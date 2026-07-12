"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search, X, CircleCheck, History } from "lucide-react";
import { Modal, fieldLabel, fieldInput } from "@/components/ui/Modal";
import { api, ApiError, type Asset } from "@/lib/api";
import type { Category, Department } from "@/lib/mock/org";

type EmployeeOption = { id: string; name: string; email: string; department: string | null };

const ASSET_STATUS: Record<string, string> = {
  available: "bg-emerald-active/10 text-emerald-active",
  allocated: "bg-indigo-accent/10 text-indigo-accent",
  reserved: "bg-indigo-accent/10 text-indigo-accent",
  under_maintenance: "bg-status-warning/10 text-status-warning",
  overdue: "bg-status-critical/10 text-status-critical",
  lost: "bg-status-critical/10 text-status-critical",
  retired: "bg-surface-variant text-on-surface-variant",
  disposed: "bg-surface-variant text-on-surface-variant",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-label-caps text-[11px] font-semibold capitalize ${ASSET_STATUS[status] ?? "bg-surface-variant text-on-surface-variant"}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

type ModalKind = "register" | "allocate" | "return" | "transfer" | null;

const emptyReg = { name: "", serial_number: "", category_id: "", acquisition_date: "", acquisition_cost: "", condition: "good", location: "", photo_url: "", is_bookable: false };

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<Asset | null>(null);
  const [modal, setModal] = useState<ModalKind>(null);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  // form state
  const [reg, setReg] = useState(emptyReg);
  const [holderType, setHolderType] = useState<"employee" | "department">("employee");
  const [holderId, setHolderId] = useState("");
  const [expReturn, setExpReturn] = useState("");
  const [checkinNotes, setCheckinNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const catName = useMemo(() => {
    const m = new Map(categories.map((c) => [c.id, c.name]));
    return (id?: string | null) => (id ? m.get(id) ?? "—" : "—");
  }, [categories]);

  async function loadAssets() {
    const rows = await api.listAssets();
    setAssets(rows);
  }

  useEffect(() => {
    Promise.all([
      api.listAssets().catch(() => [] as Asset[]),
      api.listCategories().catch(() => [] as Category[]),
      api.listDepartments().catch(() => [] as Department[]),
      api.listEmployeeOptions().catch(() => [] as EmployeeOption[]),
    ])
      .then(([a, c, d, e]) => {
        setAssets(a);
        setCategories(c);
        setDepartments(d);
        setEmployees(e);
      })
      .finally(() => setLoading(false));
  }, []);

  const shown = useMemo(
    () =>
      assets.filter((a) => {
        const okStatus = filter === "all" || a.status === filter;
        const q = query.toLowerCase();
        const okQuery = [a.name, a.asset_tag, a.serial_number, a.location].some((v) => v?.toLowerCase().includes(q));
        return okStatus && okQuery;
      }),
    [assets, filter, query]
  );

  const count = (s: string) => assets.filter((a) => a.status === s).length;

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2600);
  }

  function openRegister() {
    setReg(emptyReg);
    setError("");
    setModal("register");
  }
  function openAction(kind: Exclude<ModalKind, null | "register">) {
    setHolderType("employee");
    setHolderId("");
    setExpReturn("");
    setCheckinNotes("");
    setError("");
    setModal(kind);
  }

  async function submit() {
    setError("");
    setSaving(true);
    try {
      if (modal === "register") {
        if (!reg.name.trim()) throw new ApiError("Asset name is required.", 422);
        const created = await api.createAsset({
          name: reg.name.trim(),
          serial_number: reg.serial_number || null,
          category_id: reg.category_id || null,
          acquisition_date: reg.acquisition_date || null,
          acquisition_cost: reg.acquisition_cost || null,
          condition: reg.condition,
          location: reg.location || null,
          photo_url: reg.photo_url || null,
          is_bookable: reg.is_bookable,
        });
        setAssets((list) => [created, ...list]);
        flash(`${created.asset_tag} registered`);
      } else if (modal === "allocate" && selected) {
        if (!holderId) throw new ApiError("Select a holder.", 422);
        await api.allocateAsset(selected.id, {
          [holderType === "employee" ? "holder_emp_id" : "holder_dept_id"]: holderId,
          expected_return_date: expReturn || null,
        });
        await loadAssets();
        flash("Asset allocated");
      } else if (modal === "return" && selected) {
        await api.returnAsset(selected.id, { checkin_notes: checkinNotes });
        await loadAssets();
        flash("Asset returned");
      } else if (modal === "transfer" && selected) {
        if (!holderId) throw new ApiError("Select a new holder.", 422);
        await api.requestTransfer(selected.id, { to_holder: `${holderType}:${holderId}` });
        await loadAssets();
        flash("Transfer requested");
      }
      setModal(null);
      setSelected(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  const holderOptions = holderType === "employee" ? employees.map((e) => ({ id: e.id, label: `${e.name} · ${e.email}` })) : departments.map((d) => ({ id: d.id, label: d.name }));

  return (
    <div className="mx-auto w-full max-w-[1440px] p-lg md:p-xl">
      {/* Header */}
      <div className="mb-lg flex flex-col justify-between gap-md md:flex-row md:items-end">
        <div>
          <h1 className="font-display-lg text-display-lg text-primary">Asset Registry</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">Register, locate and manage every asset through its lifecycle.</p>
        </div>
        <button onClick={openRegister} className="flex items-center gap-xs rounded-DEFAULT bg-deep-navy px-4 py-2 font-label-caps text-label-caps font-semibold text-white shadow-card transition-opacity hover:opacity-90">
          <Plus className="h-4 w-4" />
          Register Asset
        </button>
      </div>

      {/* KPIs */}
      <div className="mb-lg grid grid-cols-2 gap-md lg:grid-cols-4">
        <Metric label="Total Assets" value={assets.length} accent="border-t-deep-navy" />
        <Metric label="Available" value={count("available")} accent="border-t-emerald-active" />
        <Metric label="Allocated" value={count("allocated")} accent="border-t-indigo-accent" />
        <Metric label="Needs Attention" value={count("under_maintenance") + count("lost") + count("overdue")} accent="border-t-status-warning" />
      </div>

      {/* Toolbar */}
      <div className="mb-md flex flex-col gap-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tag, serial or name..." className="w-full rounded-DEFAULT border border-border-muted bg-surface py-2 pl-9 pr-3 font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant focus:border-indigo-accent focus:outline-none focus:ring-1 focus:ring-indigo-accent" />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-DEFAULT border border-border-muted bg-surface px-3 py-2 font-body-sm text-body-sm text-on-surface focus:border-indigo-accent focus:outline-none focus:ring-1 focus:ring-indigo-accent">
          <option value="all">All statuses</option>
          <option value="available">Available</option>
          <option value="allocated">Allocated</option>
          <option value="under_maintenance">Maintenance</option>
          <option value="lost">Lost</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-DEFAULT border border-border-muted">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border-muted bg-surface-subtle font-label-caps text-label-caps text-on-surface-variant">
              <th className="px-md py-3 font-semibold">Asset</th>
              <th className="px-md py-3 font-semibold">Category</th>
              <th className="px-md py-3 font-semibold">Location</th>
              <th className="px-md py-3 font-semibold">Condition</th>
              <th className="px-md py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="font-body-sm text-body-sm">
            {shown.map((a) => (
              <tr key={a.id} onClick={() => setSelected(a)} className="cursor-pointer border-b border-border-muted/60 last:border-0 hover:bg-surface-container-low">
                <td className="px-md py-3">
                  <p className="font-semibold text-primary">{a.name}</p>
                  <p className="font-mono-data text-mono-data text-indigo-accent">{a.asset_tag}</p>
                  <p className="text-[12px] text-on-surface-variant">{a.serial_number || "No serial"}</p>
                </td>
                <td className="px-md py-3 text-on-surface">{catName(a.category_id)}</td>
                <td className="px-md py-3 text-on-surface-variant">{a.location || "Unassigned"}</td>
                <td className="px-md py-3 capitalize text-on-surface-variant">{a.condition}</td>
                <td className="px-md py-3"><StatusBadge status={a.status} /></td>
              </tr>
            ))}
            {!loading && shown.length === 0 && (
              <tr>
                <td colSpan={5} className="px-md py-10 text-center text-on-surface-variant">
                  {assets.length === 0 ? "No assets yet — register your first one." : "No assets match these filters."}
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={5} className="px-md py-10 text-center text-on-surface-variant">Loading…</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail drawer */}
      {selected && (
        <>
          <div className="fixed inset-0 z-40 bg-deep-navy/40" onClick={() => setSelected(null)} aria-hidden="true" />
          <aside className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-md flex-col overflow-y-auto border-l border-border-muted bg-surface p-lg shadow-lifted">
            <button aria-label="Close" onClick={() => setSelected(null)} className="absolute right-4 top-4 rounded-full p-1 text-on-surface-variant hover:bg-surface-container-low">
              <X className="h-5 w-5" />
            </button>
            <p className="font-mono-data text-mono-data text-indigo-accent">{selected.asset_tag}</p>
            <h2 className="mb-sm font-headline-md text-headline-md text-primary">{selected.name}</h2>
            <StatusBadge status={selected.status} />

            <dl className="my-lg divide-y divide-border-muted border-y border-border-muted">
              {[
                ["Serial number", selected.serial_number || "—"],
                ["Category", catName(selected.category_id)],
                ["Location", selected.location || "—"],
                ["Condition", selected.condition],
                ["Bookable", selected.is_bookable ? "Yes" : "No"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-2 font-body-sm text-body-sm">
                  <dt className="text-on-surface-variant">{k}</dt>
                  <dd className="font-medium text-on-surface">{v as string}</dd>
                </div>
              ))}
            </dl>

            <div className="flex flex-wrap gap-sm">
              {selected.status === "available" ? (
                <button onClick={() => openAction("allocate")} className="rounded-DEFAULT bg-emerald-active px-4 py-2 font-label-caps text-label-caps font-semibold text-white hover:opacity-90">
                  Allocate asset
                </button>
              ) : (
                <>
                  <button onClick={() => openAction("transfer")} className="rounded-DEFAULT border border-border-muted bg-surface px-4 py-2 font-label-caps text-label-caps font-semibold text-primary hover:bg-surface-container-low">
                    Request transfer
                  </button>
                  <button onClick={() => openAction("return")} className="rounded-DEFAULT bg-deep-navy px-4 py-2 font-label-caps text-label-caps font-semibold text-white hover:opacity-90">
                    Return asset
                  </button>
                </>
              )}
            </div>

            <h3 className="mb-sm mt-lg flex items-center gap-xs font-headline-sm text-headline-sm text-primary">
              <History className="h-4 w-4 text-on-surface-variant" /> Lifecycle history
            </h3>
            <ol className="space-y-md">
              {selected.history.length === 0 && <li className="font-body-sm text-body-sm text-on-surface-variant">No history yet.</li>}
              {[...selected.history].reverse().map((h) => (
                <li key={h.id} className="flex gap-sm">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-accent" />
                  <div>
                    <p className="font-body-sm text-body-sm font-semibold capitalize text-primary">{h.event_type.replaceAll("_", " ")}</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{h.detail}</p>
                    <p className="font-label-caps text-[11px] text-on-surface-variant">{new Date(h.created_at).toLocaleString()}</p>
                  </div>
                </li>
              ))}
            </ol>
          </aside>
        </>
      )}

      {/* Modals */}
      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={
          modal === "register"
            ? "Register New Asset"
            : modal === "allocate"
              ? `Allocate ${selected?.asset_tag ?? ""}`
              : modal === "return"
                ? `Return ${selected?.asset_tag ?? ""}`
                : `Transfer ${selected?.asset_tag ?? ""}`
        }
        footer={
          <>
            <button onClick={() => setModal(null)} className="rounded-DEFAULT border border-border-muted bg-surface px-4 py-2 font-label-caps text-label-caps font-semibold text-primary hover:bg-surface-container-low">
              Cancel
            </button>
            <button onClick={submit} disabled={saving} className="rounded-DEFAULT bg-deep-navy px-4 py-2 font-label-caps text-label-caps font-semibold text-white hover:opacity-90 disabled:opacity-60">
              {saving ? "Saving..." : "Confirm"}
            </button>
          </>
        }
      >
        {modal === "register" && (
          <div className="space-y-md">
            <div>
              <label className={fieldLabel}>Asset Name</label>
              <input value={reg.name} onChange={(e) => setReg({ ...reg, name: e.target.value })} placeholder="e.g. MacBook Pro 14”" className={fieldInput} />
            </div>
            <div className="grid grid-cols-2 gap-sm">
              <div>
                <label className={fieldLabel}>Serial Number</label>
                <input value={reg.serial_number} onChange={(e) => setReg({ ...reg, serial_number: e.target.value })} className={fieldInput} />
              </div>
              <div>
                <label className={fieldLabel}>Category</label>
                <select value={reg.category_id} onChange={(e) => setReg({ ...reg, category_id: e.target.value })} className={fieldInput}>
                  <option value="">Uncategorized</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-sm">
              <div>
                <label className={fieldLabel}>Acquisition Date</label>
                <input type="date" value={reg.acquisition_date} onChange={(e) => setReg({ ...reg, acquisition_date: e.target.value })} className={fieldInput} />
              </div>
              <div>
                <label className={fieldLabel}>Cost</label>
                <input type="number" min="0" step="0.01" value={reg.acquisition_cost} onChange={(e) => setReg({ ...reg, acquisition_cost: e.target.value })} className={fieldInput} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-sm">
              <div>
                <label className={fieldLabel}>Condition</label>
                <select value={reg.condition} onChange={(e) => setReg({ ...reg, condition: e.target.value })} className={fieldInput}>
                  <option value="new">new</option>
                  <option value="good">good</option>
                  <option value="fair">fair</option>
                  <option value="poor">poor</option>
                </select>
              </div>
              <div>
                <label className={fieldLabel}>Location</label>
                <input value={reg.location} onChange={(e) => setReg({ ...reg, location: e.target.value })} className={fieldInput} />
              </div>
            </div>
            <label className="flex items-center gap-sm font-body-sm text-body-sm text-on-surface">
              <input type="checkbox" checked={reg.is_bookable} onChange={(e) => setReg({ ...reg, is_bookable: e.target.checked })} className="h-4 w-4 accent-indigo-accent" />
              Available for booking
            </label>
          </div>
        )}

        {(modal === "allocate" || modal === "transfer") && (
          <div className="space-y-md">
            <div className="grid grid-cols-2 gap-sm">
              <div>
                <label className={fieldLabel}>{modal === "transfer" ? "New holder type" : "Holder type"}</label>
                <select value={holderType} onChange={(e) => { setHolderType(e.target.value as "employee" | "department"); setHolderId(""); }} className={fieldInput}>
                  <option value="employee">Employee</option>
                  <option value="department">Department</option>
                </select>
              </div>
              <div>
                <label className={fieldLabel}>{modal === "transfer" ? "New holder" : "Holder"}</label>
                <select value={holderId} onChange={(e) => setHolderId(e.target.value)} className={fieldInput}>
                  <option value="">Select…</option>
                  {holderOptions.map((o) => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
            {modal === "allocate" && (
              <div>
                <label className={fieldLabel}>Expected Return Date</label>
                <input type="date" value={expReturn} onChange={(e) => setExpReturn(e.target.value)} className={fieldInput} />
              </div>
            )}
            {holderType === "employee" && employees.length === 0 && (
              <p className="font-body-sm text-body-sm text-on-surface-variant">No active employees found. Add one in Organization Setup first.</p>
            )}
          </div>
        )}

        {modal === "return" && (
          <div>
            <label className={fieldLabel}>Check-in notes</label>
            <textarea value={checkinNotes} onChange={(e) => setCheckinNotes(e.target.value)} rows={4} placeholder="Condition on return…" className={fieldInput} />
          </div>
        )}

        {error && <p className="mt-md font-body-sm text-body-sm text-error">{error}</p>}
      </Modal>

      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] flex items-center gap-sm rounded-DEFAULT border border-border-muted bg-surface px-4 py-3 shadow-lifted">
          <CircleCheck className="h-5 w-5 text-emerald-active" />
          <span className="font-body-sm text-body-sm text-on-surface">{toast}</span>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className={`rounded-DEFAULT border border-border-muted border-t-2 bg-surface p-md shadow-card ${accent}`}>
      <p className="font-label-caps text-label-caps font-semibold text-on-surface-variant">{label}</p>
      <p className="mt-sm font-display-lg text-display-lg text-primary">{value}</p>
    </div>
  );
}
