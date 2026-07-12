import uuid

from sqlalchemy import Column, ForeignKey, JSON, String
from sqlalchemy.orm import relationship

from ..core.db import Base


def _uuid() -> str:
    return str(uuid.uuid4())


class Department(Base):
    __tablename__ = "departments"

    id = Column(String(36), primary_key=True, default=_uuid)
    name = Column(String(120), unique=True, nullable=False)
    head = Column(String(120))  # denormalized head name (kept simple for P1)
    parent_id = Column(String(36), ForeignKey("departments.id"))
    status = Column(String(20), nullable=False, default="active")

    parent = relationship("Department", remote_side=[id])


class AssetCategory(Base):
    __tablename__ = "asset_categories"

    id = Column(String(36), primary_key=True, default=_uuid)
    name = Column(String(120), unique=True, nullable=False)
    description = Column(String(500), default="")
    custom_fields = Column(JSON, default=dict)
    status = Column(String(20), nullable=False, default="active")


class Employee(Base):
    __tablename__ = "employees"

    id = Column(String(36), primary_key=True, default=_uuid)
    name = Column(String(120), nullable=False)
    title = Column(String(120), default="")
    email = Column(String(200), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    department_id = Column(String(36), ForeignKey("departments.id"))
    role = Column(String(20), nullable=False, default="employee")
    status = Column(String(20), nullable=False, default="active")

    department = relationship("Department")
