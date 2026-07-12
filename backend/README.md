# AssetFlow API (P1 — Core & Org)

FastAPI + SQLAlchemy + PostgreSQL backend for the AssetFlow Organization Setup and auth.

## Stack
- **FastAPI** (REST), **SQLAlchemy 2** (ORM)
- **pg8000** — pure-Python Postgres driver (works on Windows ARM64 without C build tools)
- **PyJWT** auth, **PBKDF2** password hashing (stdlib)

## Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt   # Windows
# source .venv/bin/activate && pip install -r requirements.txt   # macOS/Linux
```

The DB connection is read from the repo-root `.env` (`DATABASE_URL`). Optionally set `JWT_SECRET` there for production.

## Run

```bash
.venv\Scripts\python -m uvicorn app.main:app --reload --port 8000
```

- API: http://localhost:8000
- Interactive docs: http://localhost:8000/docs
- On first startup the app creates tables and seeds demo data.

## Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@assetflow.com` | `Admin@123` |
| Others (seeded) | `s.jenkins@assetcorp.com`, `m.torres@assetcorp.com`, … | `Welcome@123` |

Only **admin** can write to Organization Setup (departments/categories/employees). Signup always creates an **Employee**.

## Endpoints

| Method | Path | Auth |
|--------|------|------|
| POST | `/auth/signup` | public (creates Employee) |
| POST | `/auth/login` | public |
| GET | `/auth/me` | bearer |
| POST | `/auth/forgot-password` | public |
| GET/POST/PUT/DELETE | `/departments` | read: bearer · write: admin |
| GET/POST/PUT/DELETE | `/categories` | read: bearer · write: admin |
| GET/POST | `/employees` | read: bearer · write: admin |
| PATCH | `/employees/{id}/role` | admin (role promotion) |
| PATCH | `/employees/{id}/status` | admin |

## Re-seed (wipe + reload demo data)

```bash
.venv\Scripts\python -c "from app.models import org; from app.core.db import Base, engine; Base.metadata.drop_all(engine); from app.seed import seed; seed()"
```

## Notes
- `head` on departments is stored denormalized (name string) to keep P1 simple; `parent_id` and `employee.department_id` are proper FKs. TODO: normalize `head` to an FK.
- Frontend points at `http://localhost:8000` by default; override with `NEXT_PUBLIC_API_URL`.
