import random
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..core.db import get_db
from ..core.deps import get_current_user, require_role
from ..models.ops import MaintenanceRequest
from ..schemas import MaintenanceAssignIn, MaintenanceIn, MaintenanceStatusIn
from ..serializers import maintenance_dict
from .notifications import create_notification

router = APIRouter(prefix="/maintenance", tags=["maintenance"])

STATUSES = {"pending", "approved", "tech_assigned", "in_progress", "resolved"}
PRIORITIES = {"High", "Medium", "Low"}


def _get(db: Session, req_id: str) -> MaintenanceRequest:
    m = db.query(MaintenanceRequest).filter(MaintenanceRequest.id == req_id).first()
    if not m:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Maintenance request not found.")
    return m


@router.get("")
def list_requests(db: Session = Depends(get_db), _=Depends(get_current_user)):
    rows = db.query(MaintenanceRequest).order_by(MaintenanceRequest.raised_at.desc()).all()
    return [maintenance_dict(m) for m in rows]


@router.post("", status_code=status.HTTP_201_CREATED)
def raise_request(body: MaintenanceIn, db: Session = Depends(get_db), _=Depends(get_current_user)):
    if not body.asset.strip():
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Asset is required.")
    if not body.issue.strip():
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Describe the issue.")
    priority = body.priority if body.priority in PRIORITIES else "Medium"
    m = MaintenanceRequest(
        # Use the real asset tag when one is picked; otherwise generate a placeholder.
        asset_tag=(body.asset_tag or "").strip() or f"AF-{random.randint(1000, 9999)}",
        asset_name=body.asset.strip(),
        priority=priority,
        issue=body.issue.strip(),
        status="pending",
    )
    db.add(m)
    create_notification(db, "maintenance", f"Maintenance raised for {m.asset_name} ({m.priority} priority)")
    db.commit()
    db.refresh(m)
    return maintenance_dict(m)


@router.put("/{req_id}")
def update_request(req_id: str, body: MaintenanceIn, db: Session = Depends(get_db), _=Depends(get_current_user)):
    if not body.asset.strip():
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Asset is required.")
    if not body.issue.strip():
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Describe the issue.")
    m = _get(db, req_id)
    # Editing is only allowed while the request is still pending approval.
    if m.status != "pending":
        raise HTTPException(status.HTTP_409_CONFLICT, "Only pending requests can be edited.")
    m.asset_name = body.asset.strip()
    if body.asset_tag and body.asset_tag.strip():
        m.asset_tag = body.asset_tag.strip()
    m.priority = body.priority if body.priority in PRIORITIES else m.priority
    m.issue = body.issue.strip()
    db.commit()
    db.refresh(m)
    return maintenance_dict(m)


@router.patch("/{req_id}/status")
def move_status(req_id: str, body: MaintenanceStatusIn, db: Session = Depends(get_db), _=Depends(get_current_user)):
    if body.status not in STATUSES:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Invalid status.")
    m = _get(db, req_id)
    m.status = body.status
    m.resolved_at = datetime.utcnow() if body.status == "resolved" else None
    if body.status == "resolved":
        create_notification(db, "maintenance", f"Maintenance for {m.asset_name} was resolved")
    db.commit()
    db.refresh(m)
    return maintenance_dict(m)


@router.patch("/{req_id}/assign")
def assign_tech(req_id: str, body: MaintenanceAssignIn, db: Session = Depends(get_db), _=Depends(get_current_user)):
    m = _get(db, req_id)
    m.technician = (body.technician or "").strip() or None
    # Assigning a technician to an approved request advances it to "tech_assigned".
    if m.technician and m.status == "approved":
        m.status = "tech_assigned"
    db.commit()
    db.refresh(m)
    return maintenance_dict(m)


@router.delete("/{req_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_request(req_id: str, db: Session = Depends(get_db), _=Depends(require_role("admin", "asset_manager"))):
    m = db.query(MaintenanceRequest).filter(MaintenanceRequest.id == req_id).first()
    if m:
        db.delete(m)
        db.commit()
