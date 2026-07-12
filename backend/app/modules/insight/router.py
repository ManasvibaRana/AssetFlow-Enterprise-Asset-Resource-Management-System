import csv
import io
from datetime import date
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, Field, model_validator
from sqlalchemy import case, func
from sqlalchemy.orm import Session, selectinload

from ...core.db import get_db
from ...core.deps import get_current_user
from ...models.assets import Allocation, Asset, AssetHistory
from ...models.insight import ActivityLog, AuditAssignment, AuditCycle, AuditItem, Notification
from ...models.org import AssetCategory, Employee
from .helpers import log_activity, notify

router = APIRouter(prefix="/insight", tags=["insight"])


class CycleIn(BaseModel):
    name: str
    scope_dept_id: str | None = None
    scope_location: str | None = None
    start_date: date
    end_date: date
    auditor_ids: list[str] = Field(default_factory=list)

    @model_validator(mode="after")
    def valid_dates(self):
        if self.end_date < self.start_date:
            raise ValueError("End date cannot be before start date")
        return self


class ItemIn(BaseModel):
    result: Literal["pending", "verified", "missing", "damaged"]
    notes: str = ""
    auditor_id: str | None = None


def cycle_dict(cycle: AuditCycle) -> dict:
    counts = {key: 0 for key in ("pending", "verified", "missing", "damaged")}
    for item in cycle.items:
        counts[item.result] += 1
    return {
        "id": cycle.id, "name": cycle.name, "scope_dept_id": cycle.scope_dept_id,
        "scope_location": cycle.scope_location, "start_date": cycle.start_date,
        "end_date": cycle.end_date, "status": cycle.status, "counts": counts,
        "auditor_ids": [a.auditor_id for a in cycle.assignments],
    }


@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db), user: Employee = Depends(get_current_user)):
    status_rows = dict(db.query(Asset.status, func.count(Asset.id)).group_by(Asset.status).all())
    total = sum(status_rows.values())
    overdue = db.query(Allocation).filter(Allocation.status.in_(["active", "overdue"]), Allocation.expected_return_date < date.today()).count()
    unread = db.query(Notification).filter_by(user_id=user.id, is_read=False).count()
    recent = db.query(ActivityLog).order_by(ActivityLog.timestamp.desc()).limit(6).all()
    return {
        "total_assets": total, "available": status_rows.get("available", 0),
        "allocated": status_rows.get("allocated", 0), "maintenance": status_rows.get("under_maintenance", 0),
        "lost": status_rows.get("lost", 0), "overdue": overdue, "unread_notifications": unread,
        "utilization": round((status_rows.get("allocated", 0) / total * 100), 1) if total else 0,
        "recent_activity": [{"id": x.id, "action": x.action, "entity_type": x.entity_type, "entity_id": x.entity_id, "timestamp": x.timestamp} for x in recent],
    }


@router.get("/audits")
def list_audits(db: Session = Depends(get_db), _: Employee = Depends(get_current_user)):
    cycles = db.query(AuditCycle).options(selectinload(AuditCycle.items), selectinload(AuditCycle.assignments)).order_by(AuditCycle.start_date.desc()).all()
    return [cycle_dict(c) for c in cycles]


@router.post("/audits", status_code=201)
def create_audit(body: CycleIn, db: Session = Depends(get_db), user: Employee = Depends(get_current_user)):
    query = db.query(Asset)
    if body.scope_location:
        query = query.filter(Asset.location.ilike(f"%{body.scope_location}%"))
    if body.scope_dept_id:
        query = query.join(Allocation).filter(Allocation.holder_dept_id == body.scope_dept_id, Allocation.status.in_(["active", "overdue"]))
    cycle = AuditCycle(**body.model_dump(exclude={"auditor_ids"}), created_by=user.id)
    db.add(cycle)
    db.flush()
    db.add_all([AuditAssignment(cycle_id=cycle.id, auditor_id=x) for x in set(body.auditor_ids)])
    auditor = body.auditor_ids[0] if body.auditor_ids else None
    db.add_all([AuditItem(cycle_id=cycle.id, asset_id=a.id, auditor_id=auditor) for a in query.all()])
    log_activity(db, user.id, "Created audit cycle", "audit_cycle", cycle.id)
    for auditor_id in set(body.auditor_ids):
        notify(db, auditor_id, "audit_assigned", f"You were assigned to {cycle.name}")
    db.commit()
    return {"id": cycle.id, "status": cycle.status}


@router.get("/audits/{cycle_id}/items")
def audit_items(cycle_id: str, db: Session = Depends(get_db), _: Employee = Depends(get_current_user)):
    cycle = db.get(AuditCycle, cycle_id)
    if not cycle:
        raise HTTPException(404, "Audit cycle not found")
    items = db.query(AuditItem).options(selectinload(AuditItem.asset)).filter_by(cycle_id=cycle_id).all()
    return [{"id": x.id, "asset_id": x.asset_id, "asset_tag": x.asset.asset_tag, "asset_name": x.asset.name, "location": x.asset.location, "auditor_id": x.auditor_id, "result": x.result, "notes": x.notes} for x in items]


@router.patch("/audits/items/{item_id}")
def update_item(item_id: str, body: ItemIn, db: Session = Depends(get_db), user: Employee = Depends(get_current_user)):
    item = db.get(AuditItem, item_id)
    if not item:
        raise HTTPException(404, "Audit item not found")
    cycle = db.get(AuditCycle, item.cycle_id)
    if cycle.status == "closed":
        raise HTTPException(409, "Closed audits cannot be changed")
    item.result, item.notes, item.auditor_id = body.result, body.notes, body.auditor_id or user.id
    log_activity(db, user.id, f"Marked asset {body.result}", "audit_item", item.id)
    db.commit()
    return {"id": item.id, "result": item.result}


@router.post("/audits/{cycle_id}/close")
def close_audit(cycle_id: str, db: Session = Depends(get_db), user: Employee = Depends(get_current_user)):
    cycle = db.query(AuditCycle).options(selectinload(AuditCycle.items)).filter_by(id=cycle_id).first()
    if not cycle:
        raise HTTPException(404, "Audit cycle not found")
    if cycle.status == "closed":
        raise HTTPException(409, "Audit cycle already closed")
    if any(x.result == "pending" for x in cycle.items):
        raise HTTPException(409, "Resolve all pending items before closing")
    missing = [x.asset_id for x in cycle.items if x.result == "missing"]
    if missing:
        db.query(Asset).filter(Asset.id.in_(missing)).update({"status": "lost"}, synchronize_session=False)
    cycle.status = "closed"
    notify(db, cycle.created_by, "audit_closed", f"{cycle.name} closed with {len(missing)} missing assets")
    log_activity(db, user.id, "Closed audit cycle", "audit_cycle", cycle.id)
    db.commit()
    return {"status": "closed", "missing_assets": len(missing)}


@router.get("/audits/{cycle_id}/discrepancies.csv")
def audit_discrepancies(cycle_id: str, db: Session = Depends(get_db), _: Employee = Depends(get_current_user)):
    cycle = db.get(AuditCycle, cycle_id)
    if not cycle:
        raise HTTPException(404, "Audit cycle not found")
    rows = db.query(AuditItem).options(selectinload(AuditItem.asset)).filter(
        AuditItem.cycle_id == cycle_id, AuditItem.result.in_(["missing", "damaged"])
    ).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Audit", "Asset Tag", "Asset", "Result", "Location", "Notes"])
    for item in rows:
        writer.writerow([cycle.name, item.asset.asset_tag, item.asset.name, item.result, item.asset.location or "", item.notes])
    return Response(output.getvalue(), media_type="text/csv", headers={"Content-Disposition": f'attachment; filename="audit-{cycle_id}-discrepancies.csv"'})


@router.get("/notifications")
def notifications(db: Session = Depends(get_db), user: Employee = Depends(get_current_user)):
    rows = db.query(Notification).filter_by(user_id=user.id).order_by(Notification.created_at.desc()).limit(100).all()
    return [{"id": x.id, "type": x.type, "message": x.message, "is_read": x.is_read, "created_at": x.created_at} for x in rows]


@router.patch("/notifications/{notification_id}/read")
def read_notification(notification_id: str, db: Session = Depends(get_db), user: Employee = Depends(get_current_user)):
    row = db.query(Notification).filter_by(id=notification_id, user_id=user.id).first()
    if not row:
        raise HTTPException(404, "Notification not found")
    row.is_read = True
    db.commit()
    return {"ok": True}


@router.post("/notifications/read-all")
def read_all(db: Session = Depends(get_db), user: Employee = Depends(get_current_user)):
    count = db.query(Notification).filter_by(user_id=user.id, is_read=False).update({"is_read": True})
    db.commit()
    return {"updated": count}


@router.get("/activity")
def activity(db: Session = Depends(get_db), _: Employee = Depends(get_current_user)):
    rows = db.query(ActivityLog, Employee.name).outerjoin(Employee, Employee.id == ActivityLog.actor_id).order_by(ActivityLog.timestamp.desc()).limit(200).all()
    return [{"id": x.id, "actor": name or "System", "action": x.action, "entity_type": x.entity_type, "entity_id": x.entity_id, "timestamp": x.timestamp} for x, name in rows]


@router.get("/reports")
def reports(db: Session = Depends(get_db), _: Employee = Depends(get_current_user)):
    total = db.query(func.count(Asset.id)).scalar() or 0
    statuses = [{"label": label, "value": count} for label, count in db.query(Asset.status, func.count(Asset.id)).group_by(Asset.status).all()]
    locations = [{"label": label or "Unassigned", "value": count} for label, count in db.query(Asset.location, func.count(Asset.id)).group_by(Asset.location).order_by(func.count(Asset.id).desc()).limit(8).all()]
    categories = [{"label": name or "Uncategorized", "value": count} for name, count in db.query(AssetCategory.name, func.count(Asset.id)).outerjoin(Asset, Asset.category_id == AssetCategory.id).group_by(AssetCategory.name).all()]
    maintenance = [{"label": tag, "value": count} for tag, count in db.query(Asset.asset_tag, func.count(AssetHistory.id)).join(AssetHistory).filter(AssetHistory.event_type.ilike("%maintenance%")).group_by(Asset.asset_tag).order_by(func.count(AssetHistory.id).desc()).limit(8).all()]
    return {"total": total, "statuses": statuses, "locations": locations, "categories": categories, "maintenance_frequency": maintenance}


@router.get("/reports/assets.csv")
def export_assets(db: Session = Depends(get_db), _: Employee = Depends(get_current_user)):
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Asset Tag", "Name", "Status", "Condition", "Location", "Acquisition Cost"])
    for asset in db.query(Asset).order_by(Asset.asset_tag):
        writer.writerow([asset.asset_tag, asset.name, asset.status, asset.condition, asset.location or "", asset.acquisition_cost or ""])
    return Response(output.getvalue(), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=assetflow-assets.csv"})
