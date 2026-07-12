import re

from pydantic import BaseModel

EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def is_valid_email(email: str) -> bool:
    return bool(EMAIL_RE.match(email or ""))


# ---- Auth ----
class SignupIn(BaseModel):
    name: str
    email: str
    password: str


class LoginIn(BaseModel):
    email: str
    password: str


class ForgotIn(BaseModel):
    email: str


class ProfileUpdateIn(BaseModel):
    name: str
    title: str | None = ""


class ChangePasswordIn(BaseModel):
    current_password: str
    new_password: str


# ---- Organization ----
class DepartmentIn(BaseModel):
    name: str
    head: str | None = None
    parent: str | None = None  # parent department NAME (or null)
    status: str = "active"


class CategoryIn(BaseModel):
    name: str
    description: str = ""
    customFields: dict[str, str] = {}
    status: str = "active"


class EmployeeIn(BaseModel):
    name: str
    title: str | None = ""
    email: str
    department: str | None = None  # department NAME
    password: str | None = None


class ResourceIn(BaseModel):
    name: str
    capacity: int = 1
    location: str | None = ""
    amenities: list[str] = []
    status: str = "active"


class RoleIn(BaseModel):
    role: str


class StatusIn(BaseModel):
    status: str
