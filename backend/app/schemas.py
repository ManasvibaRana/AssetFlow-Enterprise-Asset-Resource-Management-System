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


class ResetPasswordIn(BaseModel):
    token: str
    new_password: str


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


# ---- Maintenance (P3) ----
class MaintenanceIn(BaseModel):
    asset: str  # asset name, e.g. "Dell Laptop"
    asset_tag: str | None = None  # real tag when picked from the assets table
    priority: str = "Medium"
    issue: str


class MaintenanceStatusIn(BaseModel):
    status: str  # pending | approved | tech_assigned | in_progress | resolved


class MaintenanceAssignIn(BaseModel):
    technician: str | None = None


class RoleIn(BaseModel):
    role: str


class StatusIn(BaseModel):
    status: str
