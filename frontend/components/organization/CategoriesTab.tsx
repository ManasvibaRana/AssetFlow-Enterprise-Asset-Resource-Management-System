"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Plus, Pencil, Power, Trash2 } from "lucide-react";
import { Modal, fieldLabel, fieldInput } from "@/components/ui/Modal";
import { StatusPill } from "@/components/ui/StatusPill";
import { Loading, ErrorBanner } from "./DepartmentsTab";
import { api, ApiError } from "@/lib/api";
import type { Category } from "@/lib/mock/org";

type FieldRow = { key: string; type: string };

export function CategoriesTab() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<FieldRow[]>([{ key: "", type: "string" }]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .listCategories()
      .then(setCategories)
      .catch((e) => setLoadError(e instanceof ApiError ? e.message : "Failed to load categories."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => categories.filter((c) => c.name.toLowerCase().includes(query.toLowerCase())),
    [categories, query]
  );
  const activeCount = categories.filter((c) => c.status === "active").length;

  function openAdd() {
    setEditingId(null);
    setName("");
    setDescription("");
    setFields([{ key: "", type: "string" }]);
    setError("");
    setModalOpen(true);
  }

  function openEdit(c: Category) {
    setEditingId(c.id);
    setName(c.name);
    setDescription(c.description);
    const rows = Object.entries(c.customFields).map(([key, type]) => ({ key, type }));
    setFields(rows.length ? rows : [{ key: "", type: "string" }]);
    setError("");
    setModalOpen(true);
  }

  async function save() {
    if (!name.trim()) {
      setError("Category name is required.");
      return;
    }
    const customFields: Record<string, string> = {};
    for (const f of fields) if (f.key.trim()) customFields[f.key.trim()] = f.type;
    const payload = { name: name.trim(), description, customFields, status: "active" as const };

    setSaving(true);
    try {
      if (editingId) {
        const existing = categories.find((c) => c.id === editingId);
        const updated = await api.updateCategory(editingId, { ...payload, status: existing?.status ?? "active" });
        setCategories((list) => list.map((c) => (c.id === editingId ? updated : c)));
      } else {
        const created = await api.createCategory(payload);
        setCategories((list) => [...list, created]);
      }
      setModalOpen(false);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(c: Category) {
    const nextStatus = c.status === "active" ? "inactive" : "active";
    try {
      const updated = await api.updateCategory(c.id, {
        name: c.name,
        description: c.description,
        customFields: c.customFields,
        status: nextStatus,
      });
      setCategories((list) => list.map((x) => (x.id === c.id ? updated : x)));
    } catch (e) {
      setLoadError(e instanceof ApiError ? e.message : "Failed to update status.");
    }
  }

  if (loading) return <Loading />;

  return (
    <div>
      {loadError && <ErrorBanner message={loadError} />}

      <div className="mb-md grid grid-cols-2 gap-md sm:max-w-md">
        <div className="rounded-DEFAULT border border-border-muted bg-surface p-md">
          <p className="font-label-caps text-label-caps font-semibold text-on-surface-variant">Total Categories</p>
          <p className="mt-1 font-display-lg text-display-lg text-primary">{categories.length}</p>
        </div>
        <div className="rounded-DEFAULT border border-border-muted bg-surface p-md">
          <p className="font-label-caps text-label-caps font-semibold text-on-surface-variant">Active Schemas</p>
          <p className="mt-1 font-display-lg text-display-lg text-emerald-active">{activeCount}</p>
        </div>
      </div>

      <div className="mb-md flex flex-col gap-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by name..."
            className="w-full rounded-DEFAULT border border-border-muted bg-surface py-2 pl-9 pr-3 font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant focus:border-indigo-accent focus:outline-none focus:ring-1 focus:ring-indigo-accent"
          />
        </div>
        <button
          onClick={openAdd}
          className="flex items-center justify-center gap-xs rounded-DEFAULT bg-deep-navy px-4 py-2 font-label-caps text-label-caps font-semibold text-white transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </button>
      </div>

      <div className="overflow-x-auto rounded-DEFAULT border border-border-muted">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border-muted bg-surface-subtle font-label-caps text-label-caps text-on-surface-variant">
              <th className="px-md py-3 font-semibold">Category Name</th>
              <th className="px-md py-3 font-semibold">Description</th>
              <th className="px-md py-3 font-semibold">Schema (Custom Fields)</th>
              <th className="px-md py-3 font-semibold">Status</th>
              <th className="px-md py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="font-body-sm text-body-sm">
            {filtered.map((c) => (
              <tr key={c.id} className="border-b border-border-muted/60 last:border-0 align-top hover:bg-surface-container-low">
                <td className="px-md py-3 font-semibold text-primary">{c.name}</td>
                <td className="max-w-[220px] px-md py-3 text-on-surface-variant">{c.description}</td>
                <td className="px-md py-3">
                  <code className="inline-block max-w-[240px] truncate rounded border border-border-muted bg-surface-container px-2 py-0.5 font-mono-data text-mono-data text-on-surface-variant">
                    {JSON.stringify(c.customFields)}
                  </code>
                </td>
                <td className="px-md py-3">
                  <StatusPill status={c.status} />
                </td>
                <td className="px-md py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => openEdit(c)}
                      aria-label={`Edit ${c.name}`}
                      className="rounded-DEFAULT p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => toggleStatus(c)}
                      aria-label={`${c.status === "active" ? "Deactivate" : "Activate"} ${c.name}`}
                      title={c.status === "active" ? "Deactivate" : "Activate"}
                      className={
                        "rounded-DEFAULT p-1.5 transition-colors hover:bg-surface-container-high " +
                        (c.status === "active" ? "text-status-critical" : "text-emerald-active")
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
                  {query ? `No categories match “${query}”.` : "No categories yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Category" : "Add Category"}
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
              {saving ? "Saving..." : editingId ? "Save Changes" : "Create Category"}
            </button>
          </>
        }
      >
        <div className="space-y-md">
          <div>
            <label className={fieldLabel}>Category Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Electronics" className={fieldInput} />
            {error && <p className="mt-xs font-body-sm text-body-sm text-error">{error}</p>}
          </div>
          <div>
            <label className={fieldLabel}>Description</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What this category covers" className={fieldInput} />
          </div>
          <div>
            <label className={fieldLabel}>Custom Fields (schema)</label>
            <div className="space-y-sm">
              {fields.map((f, i) => (
                <div key={i} className="flex items-center gap-sm">
                  <input
                    value={f.key}
                    onChange={(e) => setFields((rows) => rows.map((r, idx) => (idx === i ? { ...r, key: e.target.value } : r)))}
                    placeholder="field name"
                    className={fieldInput}
                  />
                  <select
                    value={f.type}
                    onChange={(e) => setFields((rows) => rows.map((r, idx) => (idx === i ? { ...r, type: e.target.value } : r)))}
                    className={fieldInput + " max-w-[120px]"}
                  >
                    <option value="string">string</option>
                    <option value="number">number</option>
                    <option value="boolean">boolean</option>
                    <option value="date">date</option>
                  </select>
                  <button
                    onClick={() => setFields((rows) => rows.filter((_, idx) => idx !== i))}
                    aria-label="Remove field"
                    className="shrink-0 rounded-DEFAULT p-2 text-on-surface-variant hover:bg-surface-container-high hover:text-status-critical"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => setFields((rows) => [...rows, { key: "", type: "string" }])}
              className="mt-sm flex items-center gap-xs font-label-caps text-label-caps font-semibold text-indigo-accent hover:underline"
            >
              <Plus className="h-4 w-4" /> Add field
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
