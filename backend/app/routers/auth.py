from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..core.db import get_db
from ..core.deps import get_current_user
from ..core.security import create_access_token, hash_password, verify_password
from ..models.org import Employee
from ..schemas import ChangePasswordIn, ForgotIn, LoginIn, ProfileUpdateIn, SignupIn, is_valid_email
from ..serializers import employee_dict

router = APIRouter(prefix="/auth", tags=["auth"])


def _session(user: Employee) -> dict:
    return {
        "token": create_access_token(user.id, user.role),
        "user": employee_dict(user),
    }


@router.post("/signup")
def signup(body: SignupIn, db: Session = Depends(get_db)):
    if not body.name.strip():
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Name is required.")
    if not is_valid_email(body.email):
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Enter a valid email address.")
    if len(body.password) < 8:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Password must be at least 8 characters.")
    if db.query(Employee).filter(Employee.email == body.email.lower()).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "An account with this email already exists.")

    # Signup always creates an Employee — roles are assigned later by an admin.
    user = Employee(
        name=body.name.strip(),
        email=body.email.lower(),
        password_hash=hash_password(body.password),
        role="employee",
        status="active",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _session(user)


@router.post("/login")
def login(body: LoginIn, db: Session = Depends(get_db)):
    user = db.query(Employee).filter(Employee.email == body.email.lower()).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password.")
    if user.status == "inactive":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Account is inactive.")
    return _session(user)


@router.get("/me")
def me(user: Employee = Depends(get_current_user)):
    return employee_dict(user)


@router.patch("/me")
def update_me(body: ProfileUpdateIn, user: Employee = Depends(get_current_user), db: Session = Depends(get_db)):
    if not body.name.strip():
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Name is required.")
    user.name = body.name.strip()
    user.title = (body.title or "").strip()
    db.commit()
    db.refresh(user)
    return employee_dict(user)


@router.post("/change-password")
def change_password(
    body: ChangePasswordIn,
    user: Employee = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(body.current_password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Current password is incorrect.")
    if len(body.new_password) < 8:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "New password must be at least 8 characters.")
    user.password_hash = hash_password(body.new_password)
    db.commit()
    return {"ok": True}


@router.post("/forgot-password")
def forgot_password(body: ForgotIn):
    # Always 200 so we don't leak which emails exist.
    # TODO(P1): generate reset token + send email.
    return {"ok": True}
