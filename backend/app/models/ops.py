import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, Text

from ..core.db import Base


def _uuid() -> str:
    return str(uuid.uuid4())


class MaintenanceRequest(Base):
    # P3 — maintenance workflow. Asset is denormalized (tag + name) to stay
    # decoupled from P2's assets table for the hackathon; status drives the board.
    __tablename__ = "maintenance_requests"

    id = Column(String(36), primary_key=True, default=_uuid)
    asset_tag = Column(String(24), nullable=False, default="")
    asset_name = Column(String(160), nullable=False, default="")
    priority = Column(String(10), nullable=False, default="Medium")  # High | Medium | Low
    issue = Column(Text, nullable=False, default="")
    # pending | approved | tech_assigned | in_progress | resolved
    status = Column(String(20), nullable=False, default="pending")
    technician = Column(String(120))
    progress = Column(Integer)
    raised_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    resolved_at = Column(DateTime)
