# AssetFlow — 6-Hour Hackathon Plan (4 People)

**Stack:** Next.js (frontend) · FastAPI / Python (backend) · PostgreSQL (local)
**Team:** 4 full-stack devs, each owns a full vertical slice (DB + API + UI)
**Time budget:** 6 hours

> **Golden rule for working independently:** We agree on the **DB schema** and the **API contract** in the first 45 minutes. After that, each person only touches their own folders. The only two shared things everyone imports are the **auth dependency** and the **notify() helper** — both finished in the first 45 min so nobody waits.

---

## 1. Module Ownership (4 verticals)

| Person | Screens (from PS) | Tables owned | Pages owned |
|--------|-------------------|--------------|-------------|
| **P1 — Core & Org** | 1 Login/Signup, 3 Org Setup | `employees`, `departments`, `asset_categories` | Auth, Org Setup (3 tabs), Employee Directory + role promotion |
| **P2 — Assets** | 4 Registration, 5 Allocation/Transfer | `assets`, `allocations`, `transfers`, `asset_history` | Asset register + directory/search, allocate / transfer / return |
| **P3 — Operations** | 6 Booking, 7 Maintenance | `bookings`, `maintenance_requests` | Booking calendar + overlap, maintenance approval workflow |
| **P4 — Insight** | 2 Dashboard, 8 Audit, 9 Reports, 10 Logs/Notifs | `audit_cycles`, `audit_items`, `notifications`, `activity_logs` | KPI dashboard, audit cycles, reports, notification/activity feed |

**Why P1 owns the foundation:** everyone foreign-keys into `employees` / `departments`, so P1 scaffolds the repo + auth first.
**Why P4 owns `notify()` first:** every module emits notifications, so P4 ships the helper early and P2/P3/P1 just call it.

---

## 2. Repo Structure (folder-per-owner = no merge conflicts)

```
backend/app/
  core/          # P1: db.py, auth.py, config.py, deps.py
  models/        # ONE file per module: org.py, assets.py, ops.py, insight.py
  modules/
    org/         # P1    assets/      # P2
    ops/         # P3    insight/     # P4  (+ notifications helper)
  main.py        # P1: registers all routers
frontend/app/
  (auth)/ org/   # P1    assets/      # P2
  ops/           # P3    audit/ dashboard/ reports/ activity/   # P4
  components/ui/ # SHARED — built in Phase 0, then FROZEN
  lib/api.ts     # SHARED — fetch wrapper + auth token, built Phase 0
```

**Rule:** you only edit files inside your own folders. Shared folders (`core/`, `components/ui/`, `lib/api.ts`, `models/` base) are built in Phase 0 and then frozen — changes to them require a quick team ping.

---

## 3. Database Schema (agree on this in the first 45 minutes)

> DB design is the **#1 evaluation criterion**. Use real foreign keys, no denormalized junk.

```sql
-- P1
employees(id, name, email UNIQUE, password_hash, department_id -> departments,
          role ENUM[employee|dept_head|asset_manager|admin] DEFAULT employee,
          status ENUM[active|inactive] DEFAULT active, created_at)
          -- signup ALWAYS creates role=employee. Only admin promotes.
departments(id, name, head_id -> employees, parent_id -> departments,
            status ENUM[active|inactive])
asset_categories(id, name, custom_fields JSONB)   -- JSONB holds e.g. {"warranty_months": 24}

-- P2
assets(id, name, asset_tag UNIQUE 'AF-0001', serial_number, category_id -> asset_categories,
       acquisition_date, acquisition_cost NUMERIC, condition, location, is_bookable BOOL,
       status ENUM[available|allocated|reserved|under_maintenance|lost|retired|disposed]
              DEFAULT available,
       photo_url, created_at)
allocations(id, asset_id -> assets, holder_emp_id -> employees, holder_dept_id -> departments,
            allocated_by -> employees, allocated_at, expected_return_date,
            returned_at, checkin_notes, status ENUM[active|returned|overdue])
transfers(id, asset_id -> assets, from_holder, to_holder, requested_by -> employees,
          approved_by -> employees, status ENUM[requested|approved|rejected|completed], created_at)
asset_history(id, asset_id -> assets, event_type, detail, actor_id, created_at)

-- P3
bookings(id, resource_asset_id -> assets, booked_by -> employees, start_time, end_time,
         status ENUM[upcoming|ongoing|completed|cancelled], created_at)
maintenance_requests(id, asset_id -> assets, raised_by -> employees, description, priority,
         photo_url, status ENUM[pending|approved|rejected|tech_assigned|in_progress|resolved],
         approved_by -> employees, technician_id -> employees, created_at, resolved_at)

-- P4
audit_cycles(id, name, scope_dept_id -> departments, scope_location, start_date, end_date,
             status ENUM[open|closed], created_by -> employees)
audit_assignments(cycle_id -> audit_cycles, auditor_id -> employees)   -- PK(cycle_id, auditor_id)
audit_items(id, cycle_id -> audit_cycles, asset_id -> assets,
            result ENUM[pending|verified|missing|damaged], auditor_id, notes)
notifications(id, user_id -> employees, type, message, is_read BOOL DEFAULT false, created_at)
activity_logs(id, actor_id -> employees, action, entity_type, entity_id, timestamp)
```

---

## 4. The 3 Logic Rules Judges Will Look For

Build these as **DB-backed logic**, not just UI checks:

1. **No double-allocation** — an asset may have only ONE `allocations` row with `status='active'`. If someone tries to allocate a held asset, block it, show "currently held by <name>", and offer a **Transfer Request** button.
2. **No booking overlap** — reject a new booking if `NOT (new.end <= existing.start OR new.start >= existing.end)` for the same resource. (9:00–10:00 booked → 9:30–10:30 rejected, 10:00–11:00 OK.)
3. **Auto status transitions** — maintenance approved → asset `under_maintenance`; resolved → `available`. Audit close → confirmed-missing item → asset `lost`.

---

## 5. Timeline (360 minutes)

### Phase 0 — Foundation (0:00–0:45) — ALL TOGETHER
- **P1:** repo scaffold, Postgres connection (`core/db.py`), FastAPI app, auth (signup/login/JWT), `get_current_user` + `require_role` dependencies (`core/deps.py`).
- **P4:** `notify(user_id, type, message)` and `log_activity(actor, action, entity)` helpers + their tables. Ship as importable functions.
- **P2 & P3:** write your SQLAlchemy models against the agreed schema; build seed data; build `components/ui` shell (Button, Table, Modal, Nav, Input) with ONE consistent color scheme, then freeze it.
- **ALL:** finalize schema + API contract doc. **Do not leave this phase until the schema is locked.**

### Phase 1 — Parallel Verticals (0:45–4:30) — FULLY INDEPENDENT
Each person: models → API endpoints → UI pages, in your own folders only.
Commit every ~30 minutes. Only dependencies: `require_role` (P1) and `notify()` (P4), both already done.

### Phase 2 — Integration (4:30–5:15)
- Merge all branches to `main` (P1 reviews).
- Wire the dashboard to real data (P4 pulls from everyone's tables via API).
- Connect nav links between modules.

### Phase 3 — Polish + Demo Prep (5:15–6:00)
- Input-validation pass (every form + every endpoint).
- Seed a clean demo story: register asset → allocate → raise maintenance → approve → resolve → return → audit.
- Everyone rehearses their own segment.

---

## 6. Git Workflow (they grade this — one person's repo = red flag)

- Branch per person: `feat/org`, `feat/assets`, `feat/ops`, `feat/insight`.
- Everyone commits under their own name, small and frequent (aim 8–12 commits each).
- PR into `main`; folder-per-owner means near-zero conflicts. **P1 reviews & merges.**
- Protect `main` (no direct pushes).

---

## 7. Evaluation Scorecard — how we hit each point

| Criterion (from Odoo brief) | How we cover it |
|---|---|
| **Database design (top weight)** | Normalized schema §3, real FKs, JSONB for category fields |
| **Real local DB, minimal 3rd-party** | PostgreSQL + FastAPI from scratch. NO Firebase/Supabase/Mongo Atlas |
| **Input validation** | Pydantic on every endpoint + inline form errors ("Enter a valid email"); graceful failures |
| **Modularity** | One folder = one module = one owner |
| **Clean, consistent UI** | Shared `components/ui` built once, reused everywhere — one visual language |
| **Git by whole team** | Branch-per-person, everyone commits |
| **Everyone presents** | Each person demos their own vertical (§8) |
| **Understand your tools** | No blind copy-paste; each owner can explain their logic rules |

---

## 8. Presentation Split (everyone speaks)

1. **P1** — Login/signup (role safety: signup never self-elevates) → Org Setup → promote an employee to Asset Manager.
2. **P2** — Register an asset (auto tag AF-0001) → allocate it → show the double-allocation block + transfer.
3. **P3** — Book a room (show overlap rejection) → raise maintenance → approve → asset auto-flips to Under Maintenance.
4. **P4** — Run an audit cycle (mark missing) → close it (asset → Lost) → dashboard KPIs + notifications + activity log.

---

## 9. Per-Person Checklists

### P1 — Core & Org
- [ ] Repo scaffold, Postgres, FastAPI, `.env`, README run steps
- [ ] Signup (employee only), login, JWT, forgot-password stub, session validation
- [ ] `get_current_user`, `require_role(...)` dependencies (shared)
- [ ] Org Setup Tab A: departments CRUD + head + parent + status
- [ ] Org Setup Tab B: asset categories CRUD + JSONB custom fields
- [ ] Org Setup Tab C: employee directory + **role promotion (only place roles change)**
- [ ] Input validation on all forms; admin-only route guards

### P2 — Assets
- [ ] Asset model + auto `asset_tag` generator (AF-0001, AF-0002…)
- [ ] Register asset form (name, category, serial, dates, cost, condition, location, bookable flag, photo)
- [ ] Directory: search/filter by tag, serial, category, status, dept, location
- [ ] Lifecycle status badge per asset; per-asset allocation + maintenance history view
- [ ] Allocate to employee/dept + expected return date
- [ ] **Double-allocation block** + Transfer Request button
- [ ] Transfer workflow: requested → approved → re-allocated (history auto-updates)
- [ ] Return flow: mark returned + check-in notes → status `available`
- [ ] Overdue auto-flag (past expected return date) → notify + feed dashboard
- [ ] Call `notify()` + `log_activity()` on key events

### P3 — Operations
- [ ] Booking model + calendar view of a resource's bookings
- [ ] **Overlap validation** (reject overlapping slots)
- [ ] Booking status: upcoming / ongoing / completed / cancelled
- [ ] Cancel / reschedule + reminder notification before slot
- [ ] Maintenance: raise request (asset, issue, priority, photo)
- [ ] Workflow: pending → approved/rejected → tech assigned → in progress → resolved
- [ ] Asset auto → `under_maintenance` on approval, → `available` on resolve
- [ ] Maintenance history per asset
- [ ] Call `notify()` + `log_activity()` on key events

### P4 — Insight
- [ ] `notify()` + `log_activity()` helpers + tables (ship FIRST, Phase 0)
- [ ] Notifications feed UI + mark-as-read
- [ ] Activity log UI (who did what, when)
- [ ] Audit: create cycle (scope dept/location, date range)
- [ ] Assign auditors; auditor marks each asset verified/missing/damaged
- [ ] Auto discrepancy report for flagged items
- [ ] Close cycle → lock + confirmed-missing → asset `lost`; retain history
- [ ] Dashboard KPI cards: Available, Allocated, Maintenance Today, Active Bookings, Pending Transfers, Upcoming Returns
- [ ] Overdue returns highlighted separately; quick actions (Register / Book / Raise)
- [ ] Reports: utilization, maintenance frequency, dept allocation, booking heatmap, export

---

## 10. Roles Reference (permissions)

- **Admin** — Org Setup (departments, categories, employees, role assignment), audit cycles, org-wide analytics.
- **Asset Manager** — register/allocate assets; approve transfers, maintenance, audit discrepancies, returns.
- **Department Head** — view dept assets; approve allocation/transfer within dept; book on behalf of dept.
- **Employee** — view own assets; book resources; raise maintenance; initiate return/transfer requests.
