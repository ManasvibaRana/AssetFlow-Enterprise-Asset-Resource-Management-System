from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..core.db import get_db
from ..core.deps import get_current_user, require_role
from ..models.org import AssetCategory
from ..schemas import CategoryIn
from ..serializers import category_dict

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("")
def list_categories(db: Session = Depends(get_db), _=Depends(get_current_user)):
    rows = db.query(AssetCategory).order_by(AssetCategory.name).all()
    return [category_dict(c) for c in rows]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_category(body: CategoryIn, db: Session = Depends(get_db), _=Depends(require_role("admin"))):
    if not body.name.strip():
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Category name is required.")
    if db.query(AssetCategory).filter(AssetCategory.name == body.name.strip()).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "A category with this name already exists.")
    c = AssetCategory(
        name=body.name.strip(),
        description=body.description or "",
        custom_fields=body.customFields or {},
        status=body.status,
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return category_dict(c)


@router.put("/{cat_id}")
def update_category(cat_id: str, body: CategoryIn, db: Session = Depends(get_db), _=Depends(require_role("admin"))):
    c = db.query(AssetCategory).filter(AssetCategory.id == cat_id).first()
    if not c:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Category not found.")
    c.name = body.name.strip() or c.name
    c.description = body.description or ""
    c.custom_fields = body.customFields or {}
    c.status = body.status
    db.commit()
    db.refresh(c)
    return category_dict(c)


@router.delete("/{cat_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(cat_id: str, db: Session = Depends(get_db), _=Depends(require_role("admin"))):
    c = db.query(AssetCategory).filter(AssetCategory.id == cat_id).first()
    if c:
        db.delete(c)
        db.commit()
