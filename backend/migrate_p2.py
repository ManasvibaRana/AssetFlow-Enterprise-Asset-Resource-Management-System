from sqlalchemy import text

from app.core.db import Base, engine
import app.models  # noqa: F401

with engine.begin() as db:
    Base.metadata.create_all(db)
    for table, columns in {
        "assets": ["category_id"],
        "allocations": ["holder_emp_id", "holder_dept_id", "allocated_by"],
        "transfers": ["requested_by", "approved_by"],
        "asset_history": ["actor_id"],
    }.items():
        for column in columns:
            db.execute(text(f"ALTER TABLE {table} ALTER COLUMN {column} TYPE VARCHAR(36) USING {column}::text"))
    db.execute(text("DROP INDEX IF EXISTS uq_active_allocation_per_asset"))
    db.execute(text("CREATE UNIQUE INDEX uq_active_allocation_per_asset ON allocations (asset_id) WHERE status IN ('active', 'overdue')"))

print("P2 schema ready")
