from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict, HttpUrl, model_validator
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.core.db import get_db
from app.models.assets import Allocation, Asset, AssetHistory, Transfer

router = APIRouter(prefix="/api/assets", tags=["assets"])


class AssetCreate(BaseModel):
    name: str
    serial_number: str | None = None
    category_id: int | None = None
    acquisition_date: date | None = None
    acquisition_cost: Decimal | None = None
    condition: Literal["new", "good", "fair", "poor"] = "good"
    location: str | None = None
    is_bookable: bool = False
    photo_url: HttpUrl | None = None


class AllocateIn(BaseModel):
    holder_emp_id: int | None = None
    holder_dept_id: int | None = None
    allocated_by: int | None = None
    expected_return_date: date | None = None

    @model_validator(mode="after")
    def one_holder(self):
        if (self.holder_emp_id is None) == (self.holder_dept_id is None):
            raise ValueError("Choose exactly one employee or department")
        return self


class ReturnIn(BaseModel):
    checkin_notes: str = ""
    actor_id: int | None = None


class TransferIn(BaseModel):
    to_holder: str
    requested_by: int | None = None


class TransferDecision(BaseModel):
    approved: bool
    approved_by: int | None = None


class Out(BaseModel):
    model_config = ConfigDict(from_attributes=True)


def event(db: Session, asset_id: int, kind: str, detail: str, actor_id: int | None = None):
    db.add(AssetHistory(asset_id=asset_id, event_type=kind, detail=detail, actor_id=actor_id))


def asset_or_404(db: Session, asset_id: int) -> Asset:
    asset = db.get(Asset, asset_id)
    if not asset:
        raise HTTPException(404, "Asset not found")
    return asset


def serialize(asset: Asset) -> dict:
    active = next((a for a in asset.allocations if a.status == "active"), None)
    return {
        "id": asset.id, "name": asset.name, "asset_tag": asset.asset_tag,
        "serial_number": asset.serial_number, "category_id": asset.category_id,
        "acquisition_date": asset.acquisition_date, "acquisition_cost": asset.acquisition_cost,
        "condition": asset.condition, "location": asset.location, "is_bookable": asset.is_bookable,
        "status": asset.status, "photo_url": asset.photo_url, "created_at": asset.created_at,
        "active_allocation": active and {"id": active.id, "holder_emp_id": active.holder_emp_id, "holder_dept_id": active.holder_dept_id, "expected_return_date": active.expected_return_date},
        "history": [{"id": h.id, "event_type": h.event_type, "detail": h.detail, "created_at": h.created_at} for h in asset.history],
    }


@router.get("")
def list_assets(q: str = "", status_filter: str | None = Query(None, alias="status"), category_id: int | None = None, location: str | None = None, db: Session = Depends(get_db)):
    overdue = select(Allocation).where(Allocation.status == "active", Allocation.expected_return_date < date.today())
    for allocation in db.scalars(overdue):
        allocation.status = "overdue"
        event(db, allocation.asset_id, "overdue", "Expected return date has passed")
    db.commit()
    stmt = select(Asset).options(selectinload(Asset.allocations), selectinload(Asset.history)).order_by(Asset.created_at.desc())
    if q:
        needle = f"%{q}%"
        stmt = stmt.where(or_(Asset.name.ilike(needle), Asset.asset_tag.ilike(needle), Asset.serial_number.ilike(needle)))
    if status_filter: stmt = stmt.where(Asset.status == status_filter)
    if category_id: stmt = stmt.where(Asset.category_id == category_id)
    if location: stmt = stmt.where(Asset.location.ilike(f"%{location}%"))
    return [serialize(a) for a in db.scalars(stmt).unique()]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_asset(body: AssetCreate, db: Session = Depends(get_db)):
    asset = Asset(**body.model_dump(mode="json"), asset_tag="pending")
    db.add(asset)
    db.flush()
    asset.asset_tag = f"AF-{asset.id:04d}"
    event(db, asset.id, "registered", f"{asset.name} registered")
    db.commit()
    db.refresh(asset)
    return serialize(asset)


@router.get("/{asset_id}")
def get_asset(asset_id: int, db: Session = Depends(get_db)):
    stmt = select(Asset).where(Asset.id == asset_id).options(selectinload(Asset.allocations), selectinload(Asset.history))
    asset = db.scalar(stmt)
    if not asset: raise HTTPException(404, "Asset not found")
    return serialize(asset)


@router.post("/{asset_id}/allocate", status_code=201)
def allocate(asset_id: int, body: AllocateIn, db: Session = Depends(get_db)):
    asset = asset_or_404(db, asset_id)
    active = db.scalar(select(Allocation).where(Allocation.asset_id == asset_id, Allocation.status.in_(["active", "overdue"])))
    if active:
        holder = f"employee #{active.holder_emp_id}" if active.holder_emp_id else f"department #{active.holder_dept_id}"
        raise HTTPException(409, {"message": f"Currently held by {holder}", "can_transfer": True, "allocation_id": active.id})
    allocation = Allocation(asset_id=asset_id, **body.model_dump())
    db.add(allocation); asset.status = "allocated"
    event(db, asset_id, "allocated", "Asset allocated", body.allocated_by)
    try: db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, {"message": "Asset was allocated by another request", "can_transfer": True})
    db.refresh(allocation)
    return {"id": allocation.id, "status": allocation.status}


@router.post("/{asset_id}/return")
def return_asset(asset_id: int, body: ReturnIn, db: Session = Depends(get_db)):
    asset = asset_or_404(db, asset_id)
    allocation = db.scalar(select(Allocation).where(Allocation.asset_id == asset_id, Allocation.status.in_(["active", "overdue"])))
    if not allocation: raise HTTPException(409, "Asset has no active allocation")
    allocation.status = "returned"; allocation.returned_at = datetime.now(timezone.utc); allocation.checkin_notes = body.checkin_notes
    asset.status = "available"; event(db, asset_id, "returned", body.checkin_notes or "Asset returned", body.actor_id)
    db.commit()
    return {"status": "available"}


@router.post("/{asset_id}/transfers", status_code=201)
def request_transfer(asset_id: int, body: TransferIn, db: Session = Depends(get_db)):
    asset_or_404(db, asset_id)
    allocation = db.scalar(select(Allocation).where(Allocation.asset_id == asset_id, Allocation.status.in_(["active", "overdue"])))
    if not allocation: raise HTTPException(409, "Only allocated assets can be transferred")
    source = f"employee:{allocation.holder_emp_id}" if allocation.holder_emp_id else f"department:{allocation.holder_dept_id}"
    transfer = Transfer(asset_id=asset_id, from_holder=source, to_holder=body.to_holder, requested_by=body.requested_by)
    db.add(transfer); event(db, asset_id, "transfer_requested", f"Transfer requested to {body.to_holder}", body.requested_by)
    db.commit(); db.refresh(transfer)
    return {"id": transfer.id, "status": transfer.status}


@router.post("/transfers/{transfer_id}/decision")
def decide_transfer(transfer_id: int, body: TransferDecision, db: Session = Depends(get_db)):
    transfer = db.get(Transfer, transfer_id)
    if not transfer or transfer.status != "requested": raise HTTPException(404, "Pending transfer not found")
    transfer.approved_by = body.approved_by
    if not body.approved:
        transfer.status = "rejected"; event(db, transfer.asset_id, "transfer_rejected", "Transfer rejected", body.approved_by)
    else:
        allocation = db.scalar(select(Allocation).where(Allocation.asset_id == transfer.asset_id, Allocation.status.in_(["active", "overdue"])))
        if not allocation: raise HTTPException(409, "Allocation changed before approval")
        kind, raw_id = transfer.to_holder.split(":", 1)
        if kind not in {"employee", "department"} or not raw_id.isdigit(): raise HTTPException(422, "to_holder must be employee:<id> or department:<id>")
        allocation.holder_emp_id = int(raw_id) if kind == "employee" else None
        allocation.holder_dept_id = int(raw_id) if kind == "department" else None
        transfer.status = "completed"; event(db, transfer.asset_id, "transferred", f"Transferred to {transfer.to_holder}", body.approved_by)
    db.commit()
    return {"status": transfer.status}
