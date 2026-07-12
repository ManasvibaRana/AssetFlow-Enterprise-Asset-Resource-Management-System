from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ..core.db import get_db
from ..core.deps import get_current_user
from ..models.org import Notification
from ..serializers import notification_dict

router = APIRouter(prefix="/notifications", tags=["notifications"])


def create_notification(db: Session, type: str, message: str) -> None:
    """Add a notification to the session. The caller is responsible for commit."""
    db.add(Notification(type=type, message=message))


@router.get("")
def list_notifications(db: Session = Depends(get_db), _=Depends(get_current_user)):
    rows = db.query(Notification).order_by(Notification.created_at.desc()).limit(50).all()
    return [notification_dict(n) for n in rows]


@router.patch("/{notif_id}/read")
def mark_read(notif_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    n = db.query(Notification).filter(Notification.id == notif_id).first()
    if n:
        n.is_read = True
        db.commit()
    return {"ok": True}


@router.post("/read-all")
def mark_all_read(db: Session = Depends(get_db), _=Depends(get_current_user)):
    db.query(Notification).filter(Notification.is_read == False).update({"is_read": True})  # noqa: E712
    db.commit()
    return {"ok": True}
