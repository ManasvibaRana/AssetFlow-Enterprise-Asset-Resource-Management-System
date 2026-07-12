from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..core.db import get_db
from ..core.deps import get_current_user, require_role
from ..models.org import Department
from ..schemas import DepartmentIn
from ..serializers import dept_dict

router = APIRouter(prefix="/departments", tags=["departments"])


def _resolve_parent_id(db: Session, parent_name: str | None, exclude_id: str | None = None) -> str | None:
    if not parent_name:
        return None
    p = db.query(Department).filter(Department.name == parent_name).first()
    if p and p.id != exclude_id:
        return p.id
    return None


@router.get("")
def list_departments(db: Session = Depends(get_db), _=Depends(get_current_user)):
    rows = db.query(Department).order_by(Department.name).all()
    return [dept_dict(d) for d in rows]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_department(body: DepartmentIn, db: Session = Depends(get_db), _=Depends(require_role("admin"))):
    if not body.name.strip():
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Department name is required.")
    if db.query(Department).filter(Department.name == body.name.strip()).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "A department with this name already exists.")
    d = Department(
        name=body.name.strip(),
        head=(body.head or "").strip() or None,
        parent_id=_resolve_parent_id(db, body.parent),
        status=body.status,
    )
    db.add(d)
    db.commit()
    db.refresh(d)
    return dept_dict(d)


@router.put("/{dept_id}")
def update_department(dept_id: str, body: DepartmentIn, db: Session = Depends(get_db), _=Depends(require_role("admin"))):
    d = db.query(Department).filter(Department.id == dept_id).first()
    if not d:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Department not found.")
    d.name = body.name.strip() or d.name
    d.head = (body.head or "").strip() or None
    d.parent_id = _resolve_parent_id(db, body.parent, exclude_id=dept_id)
    d.status = body.status
    db.commit()
    db.refresh(d)
    return dept_dict(d)


@router.delete("/{dept_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_department(dept_id: str, db: Session = Depends(get_db), _=Depends(require_role("admin"))):
    d = db.query(Department).filter(Department.id == dept_id).first()
    if d:
        db.delete(d)
        db.commit()
