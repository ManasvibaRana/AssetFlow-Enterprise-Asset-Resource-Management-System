from .core.db import Base, SessionLocal, engine
from .core.security import hash_password
from .models.org import AssetCategory, Department, Employee


def seed() -> None:
    """Create tables and insert demo data on first run."""
    Base.metadata.create_all(engine)
    db = SessionLocal()
    try:
        if db.query(Department).count() == 0:
            operations = Department(name="Operations", head="Priya Shah", status="active")
            db.add(operations)
            db.flush()  # get operations.id for children
            db.add_all(
                [
                    Department(name="Engineering", head="Aditi Rao", status="active"),
                    Department(name="Field Ops", head="Rohan Mehta", parent_id=operations.id, status="active"),
                    Department(name="Facilities", head="Sarah Jenkins", parent_id=operations.id, status="inactive"),
                    Department(name="Human Resources", head="David Chen", status="active"),
                    Department(name="IT", head="Marcus Lee", parent_id=operations.id, status="active"),
                ]
            )

        if db.query(AssetCategory).count() == 0:
            db.add_all(
                [
                    AssetCategory(
                        name="Laptops",
                        description="Portable computing devices assigned to individual employees.",
                        custom_fields={"Processor": "string", "RAM": "string", "WarrantyMonths": "number"},
                        status="active",
                    ),
                    AssetCategory(
                        name="Servers",
                        description="Datacenter infrastructure, rack-mounted compute units.",
                        custom_fields={"RackUnit": "string", "IP": "string"},
                        status="active",
                    ),
                    AssetCategory(
                        name="Furniture",
                        description="Office desks, chairs, and physical space fixtures.",
                        custom_fields={"LocationFloor": "number", "Ergonomic": "boolean"},
                        status="inactive",
                    ),
                    AssetCategory(
                        name="AV Equipment",
                        description="Conference room projectors, microphones, and cameras.",
                        custom_fields={"Resolution": "string", "Portable": "boolean"},
                        status="active",
                    ),
                ]
            )

        if db.query(Employee).count() == 0:
            db.flush()  # ensure pending departments are queryable for FK lookup
            depts = {d.name: d for d in db.query(Department).all()}

            def dept_id(name: str):
                d = depts.get(name)
                return d.id if d else None

            db.add_all(
                [
                    Employee(
                        name="Admin User",
                        title="System Administrator",
                        email="admin@assetflow.com",
                        password_hash=hash_password("Admin@123"),
                        department_id=dept_id("Operations"),
                        role="admin",
                        status="active",
                    ),
                    Employee(
                        name="Sarah Jenkins", title="Director of Operations", email="s.jenkins@assetcorp.com",
                        password_hash=hash_password("Welcome@123"), department_id=dept_id("Facilities"),
                        role="asset_manager", status="active",
                    ),
                    Employee(
                        name="Michael Torres", title="VP of Engineering", email="m.torres@assetcorp.com",
                        password_hash=hash_password("Welcome@123"), department_id=dept_id("Engineering"),
                        role="dept_head", status="active",
                    ),
                    Employee(
                        name="Emily Roberts", title="Data Analyst", email="e.roberts@assetcorp.com",
                        password_hash=hash_password("Welcome@123"), department_id=dept_id("Engineering"),
                        role="employee", status="on_leave",
                    ),
                    Employee(
                        name="James Wilson", title="Software Engineer", email="j.wilson@assetcorp.com",
                        password_hash=hash_password("Welcome@123"), department_id=dept_id("Engineering"),
                        role="employee", status="active",
                    ),
                ]
            )

        db.commit()
    finally:
        db.close()
