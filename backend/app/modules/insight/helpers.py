from sqlalchemy.orm import Session

from ...models.insight import ActivityLog, Notification


def notify(db: Session, user_id: str, type: str, message: str) -> Notification:
    notification = Notification(user_id=user_id, type=type, message=message)
    db.add(notification)
    return notification


def log_activity(db: Session, actor_id: str, action: str, entity_type: str, entity_id: str) -> ActivityLog:
    log = ActivityLog(actor_id=actor_id, action=action, entity_type=entity_type, entity_id=str(entity_id))
    db.add(log)
    return log
