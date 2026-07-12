"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Plus, Pencil, Power, Trash2 } from "lucide-react";
import { Modal, fieldLabel, fieldInput } from "@/components/ui/Modal";
import { StatusPill } from "@/components/ui/StatusPill";
import { Loading, ErrorBanner } from "./DepartmentsTab";
import { api, ApiError, type Resource } from "@/lib/api";

export function ResourcesTab() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("8");
  const [location, setLocation] = useState("");
  const [amenities, setAmenities] = useState<string[]>([""]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .listResources()
      .then(setResources)
      .catch((e) => setLoadError(e instanceof ApiError ? e.message : "Failed to load resources."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => resources.filter((r) => r.name.toLowerCase().includes(query.toLowerCase())),
    [resources, query],
  );
  const activeCount = resources.filter((r) => r.status === "active").length;

  function openAdd() {
    setEditingId(null);
    setName("");
    setCapacity("8");
    setLocation("");
    setAmenities([""]);
    setError("");
    setModalOpen(true);
  }

  function openEdit(r: Resource) {
    setEditingId(r.id);
    setName(r.name);
    setCapacity(String(r.capacity));
    setLocation(r.location ?? "");
    setAmenities(r.amenities.length ? r.amenities : [""]);
    setError("");
    setModalOpen(true);
  }

  async function save() {
    if (!name.trim()) {
      setError("Resource name is required.");
      return;
    }
    const cap = Number(capacity);
    if (!Number.isFinite(cap) || cap < 1) {
      setError("Capacity must be at least 1.");
      return;
    }
    const payload = {
      name: name.trim(),
      capacity: cap,
      location: location.trim(),
      amenities: amenities.map((a) => a.trim()).filter(Boolean),
      status: "active" as const,
    };

    setSaving(true);
    try {
      if (editingId) {
        const existing = resources.find((r) => r.id === editingId);
        const updated = await api.updateResource(editingId, { ...payload, status: existing?.status ?? "active" });
        setResources((list) => list.map((r) => (r.id === editingId ? updated : r)));
      } else {
        const created = await api.createResource(payload);
        setResources((list) => [...list, created]);
      }
      setModalOpen(false);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(r: Resource) {
    const nextStatus = r.status === "active" ? "inactive" : "active";
    try {
      const updated = await api.updateResource(r.id, {
        name: r.name,
        capacity: r.capacity,
        location: r.location ?? "",
        amenities: r.amenities,
        status: nextStatus,
      });
      setResources((list) => list.map((x) => (x.id === r.id ? updated : x)));
    } catch (e) {
      setLoadError(e instanceof ApiError ? e.message : "Failed to update status.");
    }
  }

  async function remove(r: Resource) {
    if (!window.confirm(`Delete “${r.name}”? This cannot be undone.`)) return;
    try {
      await api.deleteResource(r.id);
      setResources((list) => list.filter((x) => x.id !== r.id));
    } catch (e) {
      setLoadError(e instanceof ApiError ? e.message : "Failed to delete.");
    }
  }

  if (loading) return <Loading />;

  return (
    <div>
      {loadError && <ErrorBanner message={loadError} />}

      <div className="mb-md grid grid-cols-2 gap-md sm:max-w-md">
        <div className="rounded-DEFAULT border border-border-muted bg-surface p-md">
          <p className="font-label-caps text-label-caps font-semibold text-on-surface-variant">Total Resources</p>
          <p className="mt-1 font-display-lg text-display-lg text-primary">{resources.length}</p>
        </div>
        <div className="rounded-DEFAULT border border-border-muted bg-surface p-md">
          <p className="font-label-caps text-label-caps font-semibold text-on-surface-variant">Bookable Now</p>
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
          Add Resource
        </button>
      </div>

      <div className="overflow-x-auto rounded-DEFAULT border border-border-muted">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border-muted bg-surface-subtle font-label-caps text-label-caps text-on-surface-variant">
              <th className="px-md py-3 font-semibold">Resource Name</th>
              <th className="px-md py-3 font-semibold">Capacity</th>
              <th className="px-md py-3 font-semibold">Location</th>
              <th className="px-md py-3 font-semibold">Amenities</th>
              <th className="px-md py-3 font-semibold">Status</th>
              <th className="px-md py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="font-body-sm text-body-sm">
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-border-muted/60 align-top last:border-0 hover:bg-surface-container-low">
                <td className="px-md py-3 font-semibold text-primary">{r.name}</td>
                <td className="px-md py-3 text-on-surface-variant">{r.capacity} seats</td>
                <td className="max-w-[200px] px-md py-3 text-on-surface-variant">{r.location || "—"}</td>
                <td className="px-md py-3">
                  <div className="flex flex-wrap gap-1">
                    {r.amenities.length === 0 ? (
                      <span className="text-on-surface-variant">—</span>
                    ) : (
                      r.amenities.map((a) => (
                        <span key={a} className="rounded-full bg-surface-container-high px-2 py-0.5 font-label-caps text-[10px] font-semibold text-on-surface-variant">
                          {a}
                        </span>
                      ))
                    )}
                  </div>
                </td>
                <td className="px-md py-3">
                  <StatusPill status={r.status} />
                </td>
                <td className="px-md py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => openEdit(r)}
                      aria-label={`Edit ${r.name}`}
                      className="rounded-DEFAULT p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => toggleStatus(r)}
                      aria-label={`${r.status === "active" ? "Deactivate" : "Activate"} ${r.name}`}
                      title={r.status === "active" ? "Deactivate" : "Activate"}
                      className={
                        "rounded-DEFAULT p-1.5 transition-colors hover:bg-surface-container-high " +
                        (r.status === "active" ? "text-status-critical" : "text-emerald-active")
                      }
                    >
                      <Power className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => remove(r)}
                      aria-label={`Delete ${r.name}`}
                      title="Delete"
                      className="rounded-DEFAULT p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-status-critical"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-md py-8 text-center text-on-surface-variant">
                  {query ? `No resources match “${query}”.` : "No resources yet. Add a conference room to get started."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Resource" : "Add Resource"}
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
              {saving ? "Saving..." : editingId ? "Save Changes" : "Create Resource"}
            </button>
          </>
        }
      >
        <div className="space-y-md">
          <div>
            <label className={fieldLabel}>Resource Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Conference Room B2" className={fieldInput} />
            {error && <p className="mt-xs font-body-sm text-body-sm text-error">{error}</p>}
          </div>
          <div className="grid grid-cols-2 gap-md">
            <div>
              <label className={fieldLabel}>Capacity (seats)</label>
              <input type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} className={fieldInput} />
            </div>
            <div>
              <label className={fieldLabel}>Location</label>
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. 2nd Floor, East Wing" className={fieldInput} />
            </div>
          </div>
          <div>
            <label className={fieldLabel}>Amenities</label>
            <div className="space-y-sm">
              {amenities.map((a, i) => (
                <div key={i} className="flex items-center gap-sm">
                  <input
                    value={a}
                    onChange={(e) => setAmenities((rows) => rows.map((x, idx) => (idx === i ? e.target.value : x)))}
                    placeholder="e.g. Projector"
                    className={fieldInput}
                  />
                  <button
                    onClick={() => setAmenities((rows) => (rows.length > 1 ? rows.filter((_, idx) => idx !== i) : [""]))}
                    aria-label="Remove amenity"
                    className="shrink-0 rounded-DEFAULT p-2 text-on-surface-variant hover:bg-surface-container-high hover:text-status-critical"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => setAmenities((rows) => [...rows, ""])}
              className="mt-sm flex items-center gap-xs font-label-caps text-label-caps font-semibold text-indigo-accent hover:underline"
            >
              <Plus className="h-4 w-4" /> Add amenity
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
