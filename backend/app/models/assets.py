from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Index, Numeric, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base


class Asset(Base):
    __tablename__ = "assets"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(160))
    asset_tag: Mapped[str] = mapped_column(String(24), unique=True, index=True)
    serial_number: Mapped[str | None] = mapped_column(String(120), index=True)
    category_id: Mapped[str | None] = mapped_column(String(36), index=True)
    acquisition_date: Mapped[date | None] = mapped_column(Date)
    acquisition_cost: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    condition: Mapped[str] = mapped_column(String(30), default="good")
    location: Mapped[str | None] = mapped_column(String(160), index=True)
    is_bookable: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String(30), default="available", index=True)
    photo_url: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))
    allocations: Mapped[list["Allocation"]] = relationship(back_populates="asset")
    history: Mapped[list["AssetHistory"]] = relationship(back_populates="asset", order_by="desc(AssetHistory.created_at)")


class Allocation(Base):
    __tablename__ = "allocations"
    __table_args__ = (Index("uq_active_allocation_per_asset", "asset_id", unique=True, postgresql_where=text("status IN ('active', 'overdue')")),)

    id: Mapped[int] = mapped_column(primary_key=True)
    asset_id: Mapped[int] = mapped_column(ForeignKey("assets.id", ondelete="CASCADE"), index=True)
    holder_emp_id: Mapped[str | None] = mapped_column(String(36))
    holder_dept_id: Mapped[str | None] = mapped_column(String(36))
    allocated_by: Mapped[str | None] = mapped_column(String(36))
    expected_return_date: Mapped[date | None] = mapped_column(Date)
    returned_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    checkin_notes: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), default="active", index=True)
    asset: Mapped[Asset] = relationship(back_populates="allocations")


class Transfer(Base):
    __tablename__ = "transfers"

    id: Mapped[int] = mapped_column(primary_key=True)
    asset_id: Mapped[int] = mapped_column(ForeignKey("assets.id", ondelete="CASCADE"), index=True)
    from_holder: Mapped[str]
    to_holder: Mapped[str]
    requested_by: Mapped[str | None] = mapped_column(String(36))
    approved_by: Mapped[str | None] = mapped_column(String(36))
    status: Mapped[str] = mapped_column(String(20), default="requested")


class AssetHistory(Base):
    __tablename__ = "asset_history"

    id: Mapped[int] = mapped_column(primary_key=True)
    asset_id: Mapped[int] = mapped_column(ForeignKey("assets.id", ondelete="CASCADE"), index=True)
    event_type: Mapped[str] = mapped_column(String(40))
    detail: Mapped[str] = mapped_column(Text)
    actor_id: Mapped[str | None] = mapped_column(String(36))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))
    asset: Mapped[Asset] = relationship(back_populates="history")
