from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..core.db import get_db
from ..core.deps import get_current_user, require_role
from ..models.org import Resource
from ..schemas import ResourceIn
from ..serializers import resource_dict
from .notifications import create_notification

router = APIRouter(prefix="/resources", tags=["resources"])


@router.get("")
def list_resources(db: Session = Depends(get_db), _=Depends(get_current_user)):
    rows = db.query(Resource).order_by(Resource.name).all()
    return [resource_dict(r) for r in rows]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_resource(body: ResourceIn, db: Session = Depends(get_db), _=Depends(require_role("admin"))):
    if not body.name.strip():
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Resource name is required.")
    if body.capacity < 1:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Capacity must be at least 1.")
    if db.query(Resource).filter(Resource.name == body.name.strip()).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "A resource with this name already exists.")
    r = Resource(
        name=body.name.strip(),
        capacity=body.capacity,
        location=(body.location or "").strip(),
        amenities=[a.strip() for a in body.amenities if a.strip()],
        status=body.status,
    )
    db.add(r)
    create_notification(db, "resource", f"New bookable resource “{r.name}” was added")
    db.commit()
    db.refresh(r)
    return resource_dict(r)


@router.put("/{resource_id}")
def update_resource(resource_id: str, body: ResourceIn, db: Session = Depends(get_db), _=Depends(require_role("admin"))):
    r = db.query(Resource).filter(Resource.id == resource_id).first()
    if not r:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Resource not found.")
    if body.capacity < 1:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Capacity must be at least 1.")
    dup = db.query(Resource).filter(Resource.name == body.name.strip(), Resource.id != resource_id).first()
    if dup:
        raise HTTPException(status.HTTP_409_CONFLICT, "A resource with this name already exists.")
    r.name = body.name.strip() or r.name
    r.capacity = body.capacity
    r.location = (body.location or "").strip()
    r.amenities = [a.strip() for a in body.amenities if a.strip()]
    r.status = body.status
    db.commit()
    db.refresh(r)
    return resource_dict(r)


@router.delete("/{resource_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resource(resource_id: str, db: Session = Depends(get_db), _=Depends(require_role("admin"))):
    r = db.query(Resource).filter(Resource.id == resource_id).first()
    if r:
        db.delete(r)
        db.commit()
