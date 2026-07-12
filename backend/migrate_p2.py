from sqlalchemy import text

from app.core.db import Base, engine
import app.models  # noqa: F401

with engine.begin() as db:
    Base.metadata.create_all(db)
    db.execute(text("DROP INDEX IF EXISTS uq_active_allocation_per_asset"))
    db.execute(text("CREATE UNIQUE INDEX uq_active_allocation_per_asset ON allocations (asset_id) WHERE status IN ('active', 'overdue')"))

print("P2 schema ready")
