from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..core.db import get_db
from ..core.deps import get_current_user, require_role
from ..core.security import hash_password
from ..models.org import Department, Employee
from ..schemas import EmployeeIn, RoleIn, StatusIn, is_valid_email
from ..serializers import employee_dict
from .notifications import create_notification

router = APIRouter(prefix="/employees", tags=["employees"])

ASSIGNABLE_ROLES = {"employee", "dept_head", "asset_manager"}
VALID_STATUSES = {"active", "inactive", "on_leave"}
ROLE_LABELS = {"employee": "Employee", "dept_head": "Department Head", "asset_manager": "Asset Manager", "admin": "Admin"}
DEFAULT_PASSWORD = "Welcome@123"  # temp password for admin-created accounts


def _dept_id(db: Session, name: str | None) -> str | None:
    if not name:
        return None
    d = db.query(Department).filter(Department.name == name).first()
    return d.id if d else None


@router.get("")
def list_employees(db: Session = Depends(get_db), _=Depends(require_role("admin"))):
    rows = db.query(Employee).order_by(Employee.name).all()
    return [employee_dict(e) for e in rows]


@router.get("/options")
def employee_options(db: Session = Depends(get_db), _=Depends(get_current_user)):
    """Lightweight lookup for pickers (allocation, transfer, booking). Any authenticated
    user can read it; the full directory (with roles/status) stays admin-only."""
    rows = db.query(Employee).filter(Employee.status != "inactive").order_by(Employee.name).all()
    return [
        {"id": e.id, "name": e.name, "email": e.email, "department": e.department.name if e.department else None}
        for e in rows
    ]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_employee(body: EmployeeIn, db: Session = Depends(get_db), _=Depends(require_role("admin"))):
    if not body.name.strip():
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Name is required.")
    if not is_valid_email(body.email):
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Enter a valid email address.")
    if db.query(Employee).filter(Employee.email == body.email.lower()).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "An employee with this email already exists.")

    # Admin-created accounts always start as Employee.
    e = Employee(
        name=body.name.strip(),
        title=(body.title or "").strip(),
        email=body.email.lower(),
        password_hash=hash_password(body.password or DEFAULT_PASSWORD),
        department_id=_dept_id(db, body.department),
        role="employee",
        status="active",
    )
    db.add(e)
    create_notification(db, "employee", f"{e.name} was added to the employee directory")
    db.commit()
    db.refresh(e)
    return employee_dict(e)


@router.patch("/{emp_id}/role")
def change_role(emp_id: str, body: RoleIn, db: Session = Depends(get_db), _=Depends(require_role("admin"))):
    if body.role not in ASSIGNABLE_ROLES:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Role must be employee, dept_head, or asset_manager.")
    e = db.query(Employee).filter(Employee.id == emp_id).first()
    if not e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Employee not found.")
    e.role = body.role
    create_notification(db, "role", f"{e.name} was promoted to {ROLE_LABELS.get(body.role, body.role)}")
    db.commit()
    db.refresh(e)
    return employee_dict(e)


@router.patch("/{emp_id}/status")
def change_status(emp_id: str, body: StatusIn, db: Session = Depends(get_db), _=Depends(require_role("admin"))):
    if body.status not in VALID_STATUSES:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Invalid status.")
    e = db.query(Employee).filter(Employee.id == emp_id).first()
    if not e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Employee not found.")
    e.status = body.status
    db.commit()
    db.refresh(e)
    return employee_dict(e)
