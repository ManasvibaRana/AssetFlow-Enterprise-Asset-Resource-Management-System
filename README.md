# AssetFlow — Enterprise Asset & Resource Management System

AssetFlow is a centralized ERP platform for tracking, allocating, and maintaining an
organization's physical assets and shared resources. It replaces spreadsheets and paper
logs with structured asset lifecycles, conflict-safe allocation, resource booking,
maintenance approvals, audit cycles, and real-time visibility into **who holds what,
where it is, and its condition** — with clean, role-based workflows.

Built for the **Odoo Hackathon 2026**.

---

## Highlights

- **Real database, from scratch** — PostgreSQL + a hand-built FastAPI backend. No Firebase / Supabase / Mongo Atlas.
- **Fully dynamic** — every screen (KPIs, notifications, reports, audits) reads live data from the DB. No static JSON.
- **Role-based access control** — realistic account creation (no self-assigned admin), enforced server-side on every write.
- **Real email** — password reset, welcome, and account-invite emails over Gmail SMTP.
- **Responsive UI** — Next.js + Tailwind design system with light/dark themes.
- **Team git workflow** — feature branches, pull requests, and clean merges across 4 contributors.

---

## Features

| # | Screen | What it does |
|---|--------|--------------|
| 1 | **Login / Signup** | Email + password auth (JWT). Signup always creates an **Employee** — no self-elevation. Forgot-password sends a real reset link by email; reset-password page verifies a short-lived token. |
| 2 | **Dashboard** | Live KPI cards (available, allocated, under maintenance, upcoming & overdue returns, total), overdue banner, real activity feed, quick actions, and an "assets by category" chart — all computed from the DB. |
| 3 | **Organization Setup** *(admin only)* | **Departments** (hierarchy, heads, status), **Categories** (with per-category JSON custom-field schemas), **Resources** (bookable rooms), and the **Employee Directory** — the single place roles are assigned (promote to Dept Head / Asset Manager → triggers an invite email). |
| 4 | **Asset Registry** | Register assets with auto-generated tags (`AF-0001`), serial, category, location, cost, condition, and bookable flag. Search/filter and per-asset lifecycle history. |
| 5 | **Allocation & Transfer** | Allocate to employee/department with expected return date. **Double-allocation is blocked** ("currently held by …") and offers a **transfer request** → approval queue → auto re-allocation. Return flow captures check-in notes; overdue returns auto-flagged. |
| 6 | **Resource Booking** | Time-slot booking of shared rooms with **overlap validation**, booking states, and details. |
| 7 | **Maintenance** | Approval workflow on a Kanban board: Pending → Approved → Technician Assigned → In Progress → Resolved. Approval flips the asset to *Under Maintenance*; resolution returns it to *Available*. |
| 8 | **Audit** | Create verification cycles with scope + assigned auditors, mark each asset Verified / Missing / Damaged, auto-generate a discrepancy report, and close the cycle (confirmed-missing → *Lost*). |
| 9 | **Reports & Analytics** | Asset utilization, breakdowns by status / location / category, maintenance frequency — computed live and exportable to CSV. |
| 10 | **Notifications & Activity Log** | A live feed of **real events** (asset registered, role promoted, transfer requested, audit assigned). Users are emailed for key events. |

---

## Tech Stack

**Backend**
- Python 3.12, **FastAPI**
- **SQLAlchemy 2** (ORM), **PostgreSQL**
- **pg8000** — pure-Python Postgres driver (works on Windows ARM64 without build tools)
- **PyJWT** for auth; **PBKDF2 (stdlib)** password hashing
- SMTP via `smtplib` (Gmail app password) for transactional email

**Frontend**
- **Next.js 14** (App Router), TypeScript
- **Tailwind CSS** design-system tokens, light/dark theme
- **lucide-react** icons; self-hosted fonts via `next/font` (no CDN)

---

## Repository Structure

```
backend/
  app/
    core/         # config, db (SSL pg8000 engine), security (JWT/hash), email, deps (RBAC)
    models/       # org, assets, insight, ops (SQLAlchemy models)
    modules/      # assets, insight (feature modules)
    routers/      # auth, departments, categories, employees, resources, notifications, maintenance
    schemas.py    # Pydantic request models
    serializers.py
    seed.py       # demo data (departments, categories, employees, assets, audit cycle)
    main.py       # app + CORS + router registration
  requirements.txt
frontend/
  app/
    (auth)/       # login, signup, forgot-password, reset-password
    (app)/        # dashboard, organization, assets, allocation, booking,
                  # maintenance, audit, reports, notifications, profile
  components/     # layout (Sidebar/Topbar), ui, organization, booking, maintenance
  lib/            # api client, auth/session, nav
```

---

## Getting Started

### Prerequisites
- **Python 3.12+**
- **Node.js 18+**
- A **PostgreSQL** database (connection string)

### 1) Environment

Create a `.env` file in the **repo root** (gitignored — never commit it):

```env
# Database
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME?sslmode=require

# Auth
JWT_SECRET=change-me-to-a-long-random-string

# Frontend base URL (used in email links)
FRONTEND_URL=http://localhost:3000

# Email (Gmail app password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=you@gmail.com
SMTP_PASSWORD=your-16-char-app-password
SMTP_FROM=AssetFlow <you@gmail.com>
```

> Email is best-effort: if SMTP isn't configured, the app logs and skips sending — nothing breaks.

### 2) Backend

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\python -m pip install -r requirements.txt
.venv\Scripts\python -m uvicorn app.main:app --reload --port 8000
# macOS/Linux:
# source .venv/bin/activate && pip install -r requirements.txt
# uvicorn app.main:app --reload --port 8000
```

- API: http://localhost:8000
- Interactive docs: http://localhost:8000/docs
- Tables are created and demo data seeded automatically on first startup.

### 3) Frontend

```bash
cd frontend
npm install
npm run dev      # http://localhost:3000
```

The frontend calls `http://localhost:8000` by default (override with `NEXT_PUBLIC_API_URL`).

---

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@assetflow.com` | `Admin@123` |
| Seeded staff | `priya.sharma@assetflow.in`, `vikram.singh@assetflow.in`, … |

Log in as **admin** to manage Organization Setup, promote roles, and run audits.

---

## Roles & Permissions

- **Admin** — org setup (departments, categories, resources, employees, role assignment), audit cycles, org-wide analytics.
- **Asset Manager** — register/allocate assets; approve transfers, maintenance, and audit resolutions.
- **Department Head** — view department assets; approve allocations/transfers; book on behalf of the department.
- **Employee** — view own assets; book resources; raise maintenance; initiate return/transfer requests.

Writes to Organization Setup are **admin-only** (enforced in the API); the employee directory is admin-only, while a lightweight `/employees/options` lookup powers pickers for any authenticated user.

---

## API Overview

| Area | Endpoints |
|------|-----------|
| Auth | `POST /auth/signup` · `POST /auth/login` · `GET/PATCH /auth/me` · `POST /auth/forgot-password` · `POST /auth/reset-password` · `POST /auth/change-password` |
| Org | `GET/POST/PUT/DELETE /departments` · `/categories` · `GET/POST /employees` (+`/options`, `PATCH /{id}/role`, `/status`) · `/resources` |
| Assets | `GET/POST /api/assets` · `POST /api/assets/{id}/allocate` · `/return` · `/transfers` · `GET /api/assets/transfers` · `POST /api/assets/transfers/{id}/decision` |
| Maintenance | `/maintenance` (request → approve → assign → progress → resolve) |
| Insight (P4) | `/insight/dashboard` · `/insight/audits` · `/insight/reports` · `/insight/notifications` · `/insight/activity` |
| Notifications | `GET /notifications` · `PATCH /{id}/read` · `POST /notifications/read-all` |

Full interactive reference at `/docs`.

---

## Team & Module Ownership

| Owner | Modules |
|-------|---------|
| **P1 — Core & Org** | Auth (JWT, email reset), Organization Setup, Employee Directory & roles, Allocation & Transfer, email service |
| **P2 — Assets** | Asset registration, lifecycle, allocation/transfer backend |
| **P3 — Operations** | Resource Booking, Maintenance Kanban |
| **P4 — Insight** | Dashboard analytics, Audit cycles, Reports, Activity logs |

Version control is a shared effort — every member contributed via feature branches and pull requests.

---

## Security Notes

- Passwords hashed with PBKDF2-HMAC-SHA256; JWTs signed with `JWT_SECRET`.
- Signup can never create a privileged account; roles are admin-assigned only.
- Secrets (`DATABASE_URL`, SMTP, `JWT_SECRET`) live in a **gitignored `.env`** — never committed.
