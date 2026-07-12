import uuid

from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import relationship

from ..core.db import Base


def _uuid() -> str:
    return str(uuid.uuid4())


class AuditCycle(Base):
    __tablename__ = "audit_cycles"
    id = Column(String(36), primary_key=True, default=_uuid)
    name = Column(String(160), nullable=False)
    scope_dept_id = Column(String(36))
    scope_location = Column(String(160))
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(String(20), nullable=False, default="open")
    created_by = Column(String(36), nullable=False)
    items = relationship("AuditItem", cascade="all, delete-orphan")
    assignments = relationship("AuditAssignment", cascade="all, delete-orphan")


class AuditAssignment(Base):
    __tablename__ = "audit_assignments"
    cycle_id = Column(String(36), ForeignKey("audit_cycles.id", ondelete="CASCADE"), primary_key=True)
    auditor_id = Column(String(36), primary_key=True)


class AuditItem(Base):
    __tablename__ = "audit_items"
    id = Column(String(36), primary_key=True, default=_uuid)
    cycle_id = Column(String(36), ForeignKey("audit_cycles.id", ondelete="CASCADE"), nullable=False, index=True)
    asset_id = Column(ForeignKey("assets.id", ondelete="CASCADE"), nullable=False)
    auditor_id = Column(String(36))
    notes = Column(Text, default="")
    result = Column(String(20), nullable=False, default="pending")
    asset = relationship("Asset")


class Notification(Base):
    __tablename__ = "notifications"
    id = Column(String(36), primary_key=True, default=_uuid)
    user_id = Column(String(36), nullable=False, index=True)
    type = Column(String(40), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class ActivityLog(Base):
    __tablename__ = "activity_logs"
    id = Column(String(36), primary_key=True, default=_uuid)
    actor_id = Column(String(36), nullable=False, index=True)
    action = Column(String(120), nullable=False)
    entity_type = Column(String(60), nullable=False)
    entity_id = Column(String(36), nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
