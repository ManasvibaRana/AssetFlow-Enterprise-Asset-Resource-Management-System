"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Plus, Pencil, Power, Loader2 } from "lucide-react";
import { Modal, fieldLabel, fieldInput } from "@/components/ui/Modal";
import { StatusPill } from "@/components/ui/StatusPill";
import { api, ApiError } from "@/lib/api";
import { initials, type Department } from "@/lib/mock/org";

type Draft = { name: string; head: string; parent: string; status: "active" | "inactive" };
const emptyDraft: Draft = { name: "", head: "", parent: "", status: "active" };

export function DepartmentsTab() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .listDepartments()
      .then(setDepartments)
      .catch((e) => setLoadError(e instanceof ApiError ? e.message : "Failed to load departments."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => departments.filter((d) => d.name.toLowerCase().includes(query.toLowerCase())),
    [departments, query]
  );

  function openAdd() {
    setEditingId(null);
    setDraft(emptyDraft);
    setError("");
    setModalOpen(true);
  }

  function openEdit(d: Department) {
    setEditingId(d.id);
    setDraft({ name: d.name, head: d.head ?? "", parent: d.parent ?? "", status: d.status });
    setError("");
    setModalOpen(true);
  }

  async function save() {
    if (!draft.name.trim()) {
      setError("Department name is required.");
      return;
    }
    const payload = {
      name: draft.name.trim(),
      head: draft.head.trim() || null,
      parent: draft.parent.trim() || null,
      status: draft.status,
    };
    setSaving(true);
    try {
      if (editingId) {
        const updated = await api.updateDepartment(editingId, payload);
        setDepartments((list) => list.map((d) => (d.id === editingId ? updated : d)));
      } else {
        const created = await api.createDepartment(payload);
        setDepartments((list) => [...list, created]);
      }
      setModalOpen(false);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(d: Department) {
    const nextStatus = d.status === "active" ? "inactive" : "active";
    try {
      const updated = await api.updateDepartment(d.id, {
        name: d.name,
        head: d.head,
        parent: d.parent,
        status: nextStatus,
      });
      setDepartments((list) => list.map((x) => (x.id === d.id ? updated : x)));
    } catch (e) {
      setLoadError(e instanceof ApiError ? e.message : "Failed to update status.");
    }
  }

  if (loading) return <Loading />;

  return (
    <div>
      {loadError && <ErrorBanner message={loadError} />}

      <div className="mb-md flex flex-col gap-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter departments..."
            className="w-full rounded-DEFAULT border border-border-muted bg-surface py-2 pl-9 pr-3 font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant focus:border-indigo-accent focus:outline-none focus:ring-1 focus:ring-indigo-accent"
          />
        </div>
        <button
          onClick={openAdd}
          className="flex items-center justify-center gap-xs rounded-DEFAULT bg-deep-navy px-4 py-2 font-label-caps text-label-caps font-semibold text-white transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Add Department
        </button>
      </div>

      <div className="overflow-x-auto rounded-DEFAULT border border-border-muted">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border-muted bg-surface-subtle font-label-caps text-label-caps text-on-surface-variant">
              <th className="px-md py-3 font-semibold">Department Name</th>
              <th className="px-md py-3 font-semibold">Department Head</th>
              <th className="px-md py-3 font-semibold">Parent Dept</th>
              <th className="px-md py-3 font-semibold">Status</th>
              <th className="px-md py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="font-body-sm text-body-sm">
            {filtered.map((d) => (
              <tr key={d.id} className="border-b border-border-muted/60 last:border-0 hover:bg-surface-container-low">
                <td className="px-md py-3 font-semibold text-primary">{d.name}</td>
                <td className="px-md py-3">
                  <span className="flex items-center gap-sm text-on-surface">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-accent/10 text-[10px] font-semibold text-indigo-accent">
                      {d.head ? initials(d.head) : "—"}
                    </span>
                    {d.head || "—"}
                  </span>
                </td>
                <td className="px-md py-3 text-on-surface-variant">{d.parent ?? "—"}</td>
                <td className="px-md py-3">
                  <StatusPill status={d.status} />
                </td>
                <td className="px-md py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => openEdit(d)}
                      aria-label={`Edit ${d.name}`}
                      className="rounded-DEFAULT p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => toggleStatus(d)}
                      aria-label={`${d.status === "active" ? "Deactivate" : "Activate"} ${d.name}`}
                      title={d.status === "active" ? "Deactivate" : "Activate"}
                      className={
                        "rounded-DEFAULT p-1.5 transition-colors hover:bg-surface-container-high " +
                        (d.status === "active" ? "text-status-critical" : "text-emerald-active")
                      }
                    >
                      <Power className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-md py-8 text-center text-on-surface-variant">
                  {query ? `No departments match “${query}”.` : "No departments yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-sm font-body-sm text-body-sm text-on-surface-variant">
        Showing {filtered.length} of {departments.length} departments
      </p>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Department" : "Add Department"}
        footer={
          <>
            <button
              onClick={() => setModalOpen(false)}
              className="rounded-DEFAULT border border-border-muted bg-surface px-4 py-2 font-label-caps text-label-caps font-semibold text-primary hover:bg-surface-container-low"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="rounded-DEFAULT bg-deep-navy px-4 py-2 font-label-caps text-label-caps font-semibold text-white hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Saving..." : editingId ? "Save Changes" : "Create Department"}
            </button>
          </>
        }
      >
        <div className="space-y-md">
          <div>
            <label className={fieldLabel}>Department Name</label>
            <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Engineering" className={fieldInput} />
            {error && <p className="mt-xs font-body-sm text-body-sm text-error">{error}</p>}
          </div>
          <div>
            <label className={fieldLabel}>Department Head</label>
            <input value={draft.head} onChange={(e) => setDraft({ ...draft, head: e.target.value })} placeholder="e.g. Aditi Rao" className={fieldInput} />
          </div>
          <div>
            <label className={fieldLabel}>Parent Department</label>
            <select value={draft.parent} onChange={(e) => setDraft({ ...draft, parent: e.target.value })} className={fieldInput}>
              <option value="">None (top level)</option>
              {departments
                .filter((d) => d.id !== editingId)
                .map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className={fieldLabel}>Status</label>
            <select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as Draft["status"] })} className={fieldInput}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export function Loading() {
  return (
    <div className="flex items-center gap-sm py-12 text-on-surface-variant">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span className="font-body-sm text-body-sm">Loading…</span>
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mb-md rounded-DEFAULT border border-status-critical/20 bg-error-container px-4 py-3 font-body-sm text-body-sm text-on-error-container">
      {message}
    </div>
  );
}
