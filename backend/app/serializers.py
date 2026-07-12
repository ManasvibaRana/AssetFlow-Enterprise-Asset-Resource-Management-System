from .models.org import AssetCategory, Department, Employee, Notification


def dept_dict(d: Department) -> dict:
    return {
        "id": d.id,
        "name": d.name,
        "head": d.head,
        "parent": d.parent.name if d.parent else None,
        "status": d.status,
    }


def category_dict(c: AssetCategory) -> dict:
    return {
        "id": c.id,
        "name": c.name,
        "description": c.description or "",
        "customFields": c.custom_fields or {},
        "status": c.status,
    }


def employee_dict(e: Employee) -> dict:
    return {
        "id": e.id,
        "name": e.name,
        "title": e.title or "",
        "email": e.email,
        "department": e.department.name if e.department else None,
        "role": e.role,
        "status": e.status,
    }


def notification_dict(n: Notification) -> dict:
    return {
        "id": n.id,
        "type": n.type,
        "message": n.message,
        "isRead": n.is_read,
        "createdAt": (n.created_at.isoformat() + "Z") if n.created_at else None,
    }
