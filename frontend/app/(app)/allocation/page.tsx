"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, AlertTriangle, CircleCheck, Check, X, Undo2 } from "lucide-react";
import { Modal, fieldLabel, fieldInput } from "@/components/ui/Modal";
import { api, ApiError, type Asset, type Transfer } from "@/lib/api";
import type { Department } from "@/lib/mock/org";

type EmployeeOption = { id: string; name: string; email: string; department: string | null };
type HolderType = "employee" | "department";

export default function AllocationPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedId, setSelectedId] = useState<number | "">("");
  const [holderType, setHolderType] = useState<HolderType>("employee");
  const [holderId, setHolderId] = useState("");
  const [expReturn, setExpReturn] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  // return modal
  const [returnFor, setReturnFor] = useState<Asset | null>(null);
  const [checkinNotes, setCheckinNotes] = useState("");

  const empMap = useMemo(() => new Map(employees.map((e) => [e.id, e.name])), [employees]);
  const deptMap = useMemo(() => new Map(departments.map((d) => [d.id, d.name])), [departments]);

  async function reload() {
    const [a, t] = await Promise.all([
      api.listAssets().catch(() => [] as Asset[]),
      api.listTransfers("requested").catch(() => [] as Transfer[]),
    ]);
    setAssets(a);
    setTransfers(t);
  }

  useEffect(() => {
    Promise.all([
      api.listAssets().catch(() => [] as Asset[]),
      api.listEmployeeOptions().catch(() => [] as EmployeeOption[]),
      api.listDepartments().catch(() => [] as Department[]),
      api.listTransfers("requested").catch(() => [] as Transfer[]),
    ])
      .then(([a, e, d, t]) => {
        setAssets(a);
        setEmployees(e);
        setDepartments(d);
        setTransfers(t);
      })
      .finally(() => setLoading(false));
  }, []);

  const selected = assets.find((a) => a.id === selectedId) || null;

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2600);
  }

  function holderName(kind: HolderType, id?: string | null) {
    if (!id) return null;
    return (kind === "employee" ? empMap.get(id) : deptMap.get(id)) ?? id;
  }

  function activeHolder(asset: Asset): string | null {
    const a = asset.active_allocation;
    if (!a) return null;
    if (a.holder_emp_id) return holderName("employee", a.holder_emp_id);
    if (a.holder_dept_id) return holderName("department", a.holder_dept_id);
    return null;
  }

  function holderFromStr(str: string): string {
    const [kind, id] = str.split(":");
    const name = kind === "employee" ? empMap.get(id) : deptMap.get(id);
    return `${name ?? id} · ${kind}`;
  }

  const holderOptions = holderType === "employee"
    ? employees.map((e) => ({ id: e.id, label: `${e.name} · ${e.email}` }))
    : departments.map((d) => ({ id: d.id, label: d.name }));

  function resetForm() {
    setHolderType("employee");
    setHolderId("");
    setExpReturn("");
    setError("");
  }

  async function allocate() {
    if (!selected || !holderId) return setError("Select a holder.");
    setBusy(true);
    setError("");
    try {
      await api.allocateAsset(selected.id, {
        [holderType === "employee" ? "holder_emp_id" : "holder_dept_id"]: holderId,
        expected_return_date: expReturn || null,
      });
      await reload();
      resetForm();
      flash("Asset allocated");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to allocate.");
    } finally {
      setBusy(false);
    }
  }

  async function requestTransfer() {
    if (!selected || !holderId) return setError("Select a new holder.");
    setBusy(true);
    setError("");
    try {
      await api.requestTransfer(selected.id, { to_holder: `${holderType}:${holderId}` });
      await reload();
      resetForm();
      flash("Transfer requested — awaiting approval");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to request transfer.");
    } finally {
      setBusy(false);
    }
  }

  async function doReturn() {
    if (!returnFor) return;
    setBusy(true);
    try {
      await api.returnAsset(returnFor.id, { checkin_notes: checkinNotes });
      setReturnFor(null);
      setCheckinNotes("");
      await reload();
      flash("Asset returned — now available");
    } catch (e) {
      flash(e instanceof ApiError ? e.message : "Failed to return.");
    } finally {
      setBusy(false);
    }
  }

  async function decide(t: Transfer, approved: boolean) {
    try {
      await api.decideTransfer(t.id, approved);
      await reload();
      flash(approved ? "Transfer approved & re-allocated" : "Transfer rejected");
    } catch (e) {
      flash(e instanceof ApiError ? e.message : "Failed.");
    }
  }

  const allocated = assets.filter((a) => a.status === "allocated");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isOverdue = (a: Asset) =>
    (a.status === "allocated" && !a.active_allocation) ||
    (!!a.active_allocation?.expected_return_date && new Date(a.active_allocation.expected_return_date) < today);

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-lg p-lg md:p-xl">
      <div>
        <h1 className="font-display-lg text-display-lg text-primary">Allocation &amp; Transfer</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">Manage who holds what, with conflict-safe transfers.</p>
      </div>

      {/* Allocate / Transfer card */}
      <div className="rounded-DEFAULT border border-border-muted bg-surface p-lg shadow-card">
        <h2 className="mb-md flex items-center gap-xs font-headline-sm text-headline-sm text-primary">
          <ArrowLeftRight className="h-5 w-5 text-on-surface-variant" /> Allocate or transfer an asset
        </h2>

        <div className="mb-md max-w-md">
          <label className={fieldLabel}>Select asset</label>
          <select
            value={selectedId}
            onChange={(e) => {
              setSelectedId(e.target.value ? Number(e.target.value) : "");
              resetForm();
            }}
            className={fieldInput}
          >
            <option value="">Choose an asset…</option>
            {assets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.asset_tag} — {a.name} ({a.status.replaceAll("_", " ")})
              </option>
            ))}
          </select>
        </div>

        {selected && selected.status === "available" && (
          <AllocateForm
            holderType={holderType}
            setHolderType={(v) => {
              setHolderType(v);
              setHolderId("");
            }}
            holderId={holderId}
            setHolderId={setHolderId}
            expReturn={expReturn}
            setExpReturn={setExpReturn}
            holderOptions={holderOptions}
            onSubmit={allocate}
            busy={busy}
            submitLabel="Allocate asset"
          />
        )}

        {selected && selected.status === "allocated" && (
          <div className="space-y-md">
            {/* Conflict rule banner */}
            <div className="flex items-start gap-md rounded-DEFAULT border border-status-warning/30 bg-status-warning/10 p-md">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-status-warning" />
              <div className="flex-1">
                <p className="font-body-md text-body-md font-semibold text-primary">
                  Currently held by {activeHolder(selected) ?? "another holder"}
                </p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Direct re-allocation is blocked. Submit a transfer request below, or return the asset first.
                </p>
              </div>
              <button
                onClick={() => setReturnFor(selected)}
                className="flex items-center gap-xs rounded-DEFAULT border border-border-muted bg-surface px-3 py-1.5 font-label-caps text-label-caps font-semibold text-primary hover:bg-surface-container-low"
              >
                <Undo2 className="h-4 w-4" /> Return
              </button>
            </div>

            <AllocateForm
              holderType={holderType}
              setHolderType={(v) => {
                setHolderType(v);
                setHolderId("");
              }}
              holderId={holderId}
              setHolderId={setHolderId}
              holderOptions={holderOptions}
              onSubmit={requestTransfer}
              busy={busy}
              submitLabel="Request transfer"
              transfer
            />
          </div>
        )}

        {selected && !["available", "allocated"].includes(selected.status) && (
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            This asset is <span className="font-semibold capitalize">{selected.status.replaceAll("_", " ")}</span> and can&apos;t be allocated right now.
          </p>
        )}

        {error && <p className="mt-md font-body-sm text-body-sm text-error">{error}</p>}
      </div>

      {/* Current allocations */}
      <div className="rounded-DEFAULT border border-border-muted bg-surface shadow-card">
        <div className="border-b border-border-muted px-md py-sm">
          <h2 className="font-headline-sm text-headline-sm text-primary">Current Allocations</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border-muted bg-surface-subtle font-label-caps text-label-caps text-on-surface-variant">
                <th className="px-md py-3 font-semibold">Asset</th>
                <th className="px-md py-3 font-semibold">Holder</th>
                <th className="px-md py-3 font-semibold">Expected Return</th>
                <th className="px-md py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-body-sm">
              {allocated.map((a) => (
                <tr key={a.id} className="border-b border-border-muted/60 last:border-0 hover:bg-surface-container-low">
                  <td className="px-md py-3">
                    <p className="font-semibold text-primary">{a.name}</p>
                    <p className="font-mono-data text-mono-data text-indigo-accent">{a.asset_tag}</p>
                  </td>
                  <td className="px-md py-3 text-on-surface">{activeHolder(a) ?? "—"}</td>
                  <td className="px-md py-3">
                    <span className="text-on-surface-variant">{a.active_allocation?.expected_return_date ?? "—"}</span>
                    {isOverdue(a) && (
                      <span className="ml-2 rounded-full bg-status-critical/10 px-2 py-0.5 font-label-caps text-[10px] font-bold text-status-critical">
                        Overdue
                      </span>
                    )}
                  </td>
                  <td className="px-md py-3">
                    <div className="flex items-center justify-end gap-sm">
                      <button
                        onClick={() => {
                          setSelectedId(a.id);
                          resetForm();
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="font-label-caps text-label-caps font-semibold text-indigo-accent hover:underline"
                      >
                        Transfer
                      </button>
                      <button
                        onClick={() => setReturnFor(a)}
                        className="font-label-caps text-label-caps font-semibold text-on-surface-variant hover:text-primary"
                      >
                        Return
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && allocated.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-md py-8 text-center text-on-surface-variant">No assets are currently allocated.</td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={4} className="px-md py-8 text-center text-on-surface-variant">Loading…</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending transfers */}
      <div className="rounded-DEFAULT border border-border-muted bg-surface shadow-card">
        <div className="flex items-center justify-between border-b border-border-muted px-md py-sm">
          <h2 className="font-headline-sm text-headline-sm text-primary">Pending Transfer Requests</h2>
          {transfers.length > 0 && (
            <span className="rounded-full bg-status-warning/10 px-2 py-0.5 font-label-caps text-[11px] font-bold text-status-warning">
              {transfers.length} awaiting
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border-muted bg-surface-subtle font-label-caps text-label-caps text-on-surface-variant">
                <th className="px-md py-3 font-semibold">Asset</th>
                <th className="px-md py-3 font-semibold">From</th>
                <th className="px-md py-3 font-semibold">To</th>
                <th className="px-md py-3 text-right font-semibold">Decision</th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-body-sm">
              {transfers.map((t) => (
                <tr key={t.id} className="border-b border-border-muted/60 last:border-0 hover:bg-surface-container-low">
                  <td className="px-md py-3">
                    <p className="font-semibold text-primary">{t.asset_name}</p>
                    <p className="font-mono-data text-mono-data text-indigo-accent">{t.asset_tag}</p>
                  </td>
                  <td className="px-md py-3 text-on-surface-variant">{holderFromStr(t.from_holder)}</td>
                  <td className="px-md py-3 text-on-surface">{holderFromStr(t.to_holder)}</td>
                  <td className="px-md py-3">
                    <div className="flex items-center justify-end gap-sm">
                      <button
                        onClick={() => decide(t, true)}
                        className="flex items-center gap-xs rounded-DEFAULT bg-emerald-active px-3 py-1.5 font-label-caps text-label-caps font-semibold text-white hover:opacity-90"
                      >
                        <Check className="h-4 w-4" /> Approve
                      </button>
                      <button
                        onClick={() => decide(t, false)}
                        className="flex items-center gap-xs rounded-DEFAULT border border-border-muted bg-surface px-3 py-1.5 font-label-caps text-label-caps font-semibold text-status-critical hover:bg-error-container/40"
                      >
                        <X className="h-4 w-4" /> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {transfers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-md py-8 text-center text-on-surface-variant">No pending transfer requests.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Return modal */}
      <Modal
        open={!!returnFor}
        onClose={() => setReturnFor(null)}
        title={`Return ${returnFor?.asset_tag ?? ""}`}
        footer={
          <>
            <button onClick={() => setReturnFor(null)} className="rounded-DEFAULT border border-border-muted bg-surface px-4 py-2 font-label-caps text-label-caps font-semibold text-primary hover:bg-surface-container-low">
              Cancel
            </button>
            <button onClick={doReturn} disabled={busy} className="rounded-DEFAULT bg-deep-navy px-4 py-2 font-label-caps text-label-caps font-semibold text-white hover:opacity-90 disabled:opacity-60">
              {busy ? "Returning..." : "Confirm return"}
            </button>
          </>
        }
      >
        <label className={fieldLabel}>Condition check-in notes</label>
        <textarea value={checkinNotes} onChange={(e) => setCheckinNotes(e.target.value)} rows={4} placeholder="Any damage or notes on return…" className={fieldInput} />
        <p className="mt-sm font-body-sm text-body-sm text-on-surface-variant">The asset status will revert to Available.</p>
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

function AllocateForm({
  holderType,
  setHolderType,
  holderId,
  setHolderId,
  expReturn,
  setExpReturn,
  holderOptions,
  onSubmit,
  busy,
  submitLabel,
  transfer,
}: {
  holderType: HolderType;
  setHolderType: (v: HolderType) => void;
  holderId: string;
  setHolderId: (v: string) => void;
  expReturn?: string;
  setExpReturn?: (v: string) => void;
  holderOptions: { id: string; label: string }[];
  onSubmit: () => void;
  busy: boolean;
  submitLabel: string;
  transfer?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-end gap-md">
      <div className="w-40">
        <label className={fieldLabel}>{transfer ? "New holder type" : "Holder type"}</label>
        <select value={holderType} onChange={(e) => setHolderType(e.target.value as HolderType)} className={fieldInput}>
          <option value="employee">Employee</option>
          <option value="department">Department</option>
        </select>
      </div>
      <div className="min-w-[220px] flex-1">
        <label className={fieldLabel}>{transfer ? "Transfer to" : "Holder"}</label>
        <select value={holderId} onChange={(e) => setHolderId(e.target.value)} className={fieldInput}>
          <option value="">Select…</option>
          {holderOptions.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      {!transfer && setExpReturn && (
        <div className="w-48">
          <label className={fieldLabel}>Expected return</label>
          <input type="date" value={expReturn} onChange={(e) => setExpReturn(e.target.value)} className={fieldInput} />
        </div>
      )}
      <button
        onClick={onSubmit}
        disabled={busy}
        className={
          "rounded-DEFAULT px-5 py-2 font-label-caps text-label-caps font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 " +
          (transfer ? "bg-indigo-accent" : "bg-emerald-active")
        }
      >
        {busy ? "Working..." : submitLabel}
      </button>
    </div>
  );
}
