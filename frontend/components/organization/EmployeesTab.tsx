"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, UserPlus, ChevronDown, Check, CircleCheck } from "lucide-react";
import { Modal, fieldLabel, fieldInput } from "@/components/ui/Modal";
import { StatusPill } from "@/components/ui/StatusPill";
import { RoleBadge } from "@/components/ui/RoleBadge";
import { Loading, ErrorBanner } from "./DepartmentsTab";
import { api, ApiError } from "@/lib/api";
import { initials, ROLE_LABELS, ASSIGNABLE_ROLES, type Department, type Employee, type Role } from "@/lib/mock/org";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EmployeesTab() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [query, setQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState<"all" | Role>("all");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState({ name: "", title: "", email: "", department: "" });
  const [errors, setErrors] = useState<{ name?: string; email?: string; form?: string }>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([api.listEmployees(), api.listDepartments()])
      .then(([emps, depts]) => {
        setEmployees(emps);
        setDepartments(depts);
        setDraft((d) => ({ ...d, department: depts[0]?.name ?? "" }));
      })
      .catch((e) => setLoadError(e instanceof ApiError ? e.message : "Failed to load directory."))
      .finally(() => setLoading(false));
  }, []);

  const departmentNames = departments.map((d) => d.name);

  const filtered = useMemo(
    () =>
      employees.filter((e) => {
        const q = query.toLowerCase();
        const matchesQuery = e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q);
        const matchesDept = deptFilter === "all" || e.department === deptFilter;
        const matchesRole = roleFilter === "all" || e.role === roleFilter;
        return matchesQuery && matchesDept && matchesRole;
      }),
    [employees, query, deptFilter, roleFilter]
  );

  async function changeRole(emp: Employee, role: Role) {
    setOpenMenu(null);
    try {
      const updated = await api.changeEmployeeRole(emp.id, role);
      setEmployees((list) => list.map((e) => (e.id === emp.id ? updated : e)));
      setToast(`${emp.name.split(" ")[0]} is now ${ROLE_LABELS[role]}`);
      window.setTimeout(() => setToast(""), 2600);
    } catch (e) {
      setLoadError(e instanceof ApiError ? e.message : "Failed to change role.");
    }
  }

  async function toggleStatus(emp: Employee) {
    const next = emp.status === "active" ? "inactive" : "active";
    try {
      const updated = await api.changeEmployeeStatus(emp.id, next);
      setEmployees((list) => list.map((e) => (e.id === emp.id ? updated : e)));
    } catch (e) {
      setLoadError(e instanceof ApiError ? e.message : "Failed to update status.");
    }
  }

  async function addEmployee() {
    const next: typeof errors = {};
    if (!draft.name.trim()) next.name = "Name is required.";
    if (!EMAIL_RE.test(draft.email)) next.email = "Enter a valid email address.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      const created = await api.createEmployee({
        name: draft.name.trim(),
        title: draft.title.trim(),
        email: draft.email.trim().toLowerCase(),
        department: draft.department || null,
      });
      setEmployees((list) => [...list, created]);
      setModalOpen(false);
      setDraft({ name: "", title: "", email: "", department: departmentNames[0] ?? "" });
      setErrors({});
    } catch (e) {
      setErrors({ form: e instanceof ApiError ? e.message : "Failed to add employee." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loading />;

  return (
    <div>
      {loadError && <ErrorBanner message={loadError} />}

      <div className="mb-md flex flex-col gap-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full rounded-DEFAULT border border-border-muted bg-surface py-2 pl-9 pr-3 font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant focus:border-indigo-accent focus:outline-none focus:ring-1 focus:ring-indigo-accent"
          />
        </div>
        <div className="flex flex-wrap items-center gap-sm">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="rounded-DEFAULT border border-border-muted bg-surface px-3 py-2 font-body-sm text-body-sm text-on-surface focus:border-indigo-accent focus:outline-none focus:ring-1 focus:ring-indigo-accent"
          >
            <option value="all">All Departments</option>
            {departmentNames.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as "all" | Role)}
            className="rounded-DEFAULT border border-border-muted bg-surface px-3 py-2 font-body-sm text-body-sm text-on-surface focus:border-indigo-accent focus:outline-none focus:ring-1 focus:ring-indigo-accent"
          >
            <option value="all">All Roles</option>
            {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-xs rounded-DEFAULT bg-deep-navy px-4 py-2 font-label-caps text-label-caps font-semibold text-white transition-opacity hover:opacity-90"
          >
            <UserPlus className="h-4 w-4" />
            Add Employee
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-DEFAULT border border-border-muted">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border-muted bg-surface-subtle font-label-caps text-label-caps text-on-surface-variant">
              <th className="px-md py-3 font-semibold">Name &amp; Title</th>
              <th className="px-md py-3 font-semibold">Email</th>
              <th className="px-md py-3 font-semibold">Department</th>
              <th className="px-md py-3 font-semibold">Role</th>
              <th className="px-md py-3 font-semibold">Status</th>
              <th className="px-md py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="font-body-sm text-body-sm">
            {filtered.map((e) => (
              <tr key={e.id} className="border-b border-border-muted/60 last:border-0 hover:bg-surface-container-low">
                <td className="px-md py-3">
                  <div className="flex items-center gap-sm">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-accent/10 text-[11px] font-semibold text-indigo-accent">
                      {initials(e.name)}
                    </span>
                    <div>
                      <p className="font-semibold text-primary">{e.name}</p>
                      <p className="text-[12px] text-on-surface-variant">{e.title || "—"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-md py-3 font-mono-data text-mono-data text-on-surface-variant">{e.email}</td>
                <td className="px-md py-3 text-on-surface">{e.department ?? "—"}</td>
                <td className="px-md py-3">
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenu(openMenu === e.id ? null : e.id)}
                      className="flex items-center gap-1.5 rounded-DEFAULT px-1 py-0.5 hover:bg-surface-container-high"
                      aria-haspopup="menu"
                      aria-expanded={openMenu === e.id}
                    >
                      <RoleBadge role={e.role} />
                      <ChevronDown className="h-3.5 w-3.5 text-on-surface-variant" />
                    </button>
                    {openMenu === e.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} aria-hidden="true" />
                        <div className="absolute left-0 top-full z-20 mt-1 w-48 rounded-DEFAULT border border-border-muted bg-surface py-1 shadow-lifted">
                          <p className="px-3 pb-1 pt-1.5 font-label-caps text-[10px] font-semibold uppercase text-on-surface-variant">
                            Assign role
                          </p>
                          {ASSIGNABLE_ROLES.map((r) => (
                            <button
                              key={r}
                              onClick={() => changeRole(e, r)}
                              className="flex w-full items-center justify-between px-3 py-1.5 text-left font-body-sm text-body-sm text-on-surface hover:bg-surface-container-low"
                            >
                              {ROLE_LABELS[r]}
                              {e.role === r && <Check className="h-4 w-4 text-indigo-accent" />}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </td>
                <td className="px-md py-3">
                  <StatusPill status={e.status} />
                </td>
                <td className="px-md py-3 text-right">
                  <button
                    onClick={() => toggleStatus(e)}
                    className="font-label-caps text-label-caps font-semibold text-indigo-accent hover:underline"
                  >
                    {e.status === "active" ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-md py-8 text-center text-on-surface-variant">
                  No employees match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-sm font-body-sm text-body-sm text-on-surface-variant">
        Showing {filtered.length} of {employees.length} employees
      </p>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Employee"
        footer={
          <>
            <button
              onClick={() => setModalOpen(false)}
              className="rounded-DEFAULT border border-border-muted bg-surface px-4 py-2 font-label-caps text-label-caps font-semibold text-primary hover:bg-surface-container-low"
            >
              Cancel
            </button>
            <button
              onClick={addEmployee}
              disabled={saving}
              className="rounded-DEFAULT bg-deep-navy px-4 py-2 font-label-caps text-label-caps font-semibold text-white hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Adding..." : "Add Employee"}
            </button>
          </>
        }
      >
        <div className="space-y-md">
          <div>
            <label className={fieldLabel}>Full Name</label>
            <input value={draft.name} onChange={(ev) => setDraft({ ...draft, name: ev.target.value })} placeholder="Jane Doe" className={fieldInput} />
            {errors.name && <p className="mt-xs font-body-sm text-body-sm text-error">{errors.name}</p>}
          </div>
          <div>
            <label className={fieldLabel}>Title</label>
            <input value={draft.title} onChange={(ev) => setDraft({ ...draft, title: ev.target.value })} placeholder="e.g. Software Engineer" className={fieldInput} />
          </div>
          <div>
            <label className={fieldLabel}>Email</label>
            <input value={draft.email} onChange={(ev) => setDraft({ ...draft, email: ev.target.value })} placeholder="name@company.com" className={fieldInput} />
            {errors.email && <p className="mt-xs font-body-sm text-body-sm text-error">{errors.email}</p>}
          </div>
          <div>
            <label className={fieldLabel}>Department</label>
            <select value={draft.department} onChange={(ev) => setDraft({ ...draft, department: ev.target.value })} className={fieldInput}>
              {departmentNames.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          {errors.form && <p className="font-body-sm text-body-sm text-error">{errors.form}</p>}
          <p className="rounded-DEFAULT border border-border-muted bg-surface-subtle p-sm font-body-sm text-body-sm text-on-surface-variant">
            New accounts are created as <span className="font-semibold text-primary">Employee</span>. Promote to Department
            Head or Asset Manager from the role menu after creation.
          </p>
        </div>
      </Modal>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-sm rounded-DEFAULT border border-border-muted bg-surface px-4 py-3 shadow-lifted">
          <CircleCheck className="h-5 w-5 text-emerald-active" />
          <span className="font-body-sm text-body-sm text-on-surface">{toast}</span>
        </div>
      )}
    </div>
  );
}
