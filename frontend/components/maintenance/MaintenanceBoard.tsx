"use client";

import { useEffect, useRef, useState } from "react";
import {
  SlidersHorizontal,
  Download,
  MoreHorizontal,
  CheckCircle2,
  User,
  Plus,
  X,
  Check,
  ArrowRight,
  Clock,
  Trash2,
  Pencil,
} from "lucide-react";
import { Field } from "@/components/ui/Field";
import { Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { api, type MaintenanceRequest } from "@/lib/api";

type Priority = "High" | "Medium" | "Low";
type ColumnKey = "pending" | "approved" | "assigned" | "in_progress" | "resolved";

type Card = {
  id: string;
  tag: string;
  asset: string;
  priority: Priority;
  issue: string;
  raisedAt: number; // epoch ms
  column: ColumnKey;
  assignee?: string;
  progress?: number;
};

// Relative "time since raised" — just now / minutes / hours / days / weeks / months / years.
function timeAgo(ms: number, now: number): string {
  const s = Math.max(0, Math.floor((now - ms) / 1000));
  if (s < 45) return "just now";
  const plural = (n: number, u: string) => `${n} ${u}${n > 1 ? "s" : ""} ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return plural(m, "minute");
  const h = Math.floor(m / 60);
  if (h < 24) return plural(h, "hour");
  const d = Math.floor(h / 24);
  if (d < 7) return plural(d, "day");
  const w = Math.floor(d / 7);
  if (d < 30) return plural(w, "week");
  const mo = Math.floor(d / 30);
  if (mo < 12) return plural(mo, "month");
  return plural(Math.floor(d / 365), "year");
}

// Absolute date for CSV export and tooltips, e.g. "12 Jul 2026".
function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const COLUMNS: { key: ColumnKey; title: string }[] = [
  { key: "pending", title: "Pending Approval" },
  { key: "approved", title: "Approved / Waiting" },
  { key: "assigned", title: "Technician Assigned" },
  { key: "in_progress", title: "In Progress" },
  { key: "resolved", title: "Resolved" },
];

const PRIORITIES: Priority[] = ["High", "Medium", "Low"];

// Technicians available to take maintenance work.
const TECHNICIANS = ["R. Verma", "S. Gupta", "A. Khan", "M. Rao", "P. Iyer"];

// Translucent-accent chips so priority badges read well in both light and dark themes.
const priorityCls: Record<Priority, string> = {
  High: "bg-status-critical/15 text-status-critical border-status-critical/30",
  Medium: "bg-status-warning/15 text-status-warning border-status-warning/30",
  Low: "bg-emerald-active/15 text-emerald-active border-emerald-active/30",
};

// Board columns ⇄ backend status values.
const STATUS_TO_COLUMN: Record<string, ColumnKey> = {
  pending: "pending",
  approved: "approved",
  tech_assigned: "assigned",
  in_progress: "in_progress",
  resolved: "resolved",
};
const COLUMN_TO_STATUS: Record<ColumnKey, string> = {
  pending: "pending",
  approved: "approved",
  assigned: "tech_assigned",
  in_progress: "in_progress",
  resolved: "resolved",
};

function toCard(m: MaintenanceRequest): Card {
  return {
    id: m.id,
    tag: m.assetTag,
    asset: m.assetName,
    priority: (PRIORITIES.includes(m.priority as Priority) ? m.priority : "Medium") as Priority,
    issue: m.issue,
    raisedAt: m.raisedAt ? new Date(m.raisedAt).getTime() : Date.now(),
    column: STATUS_TO_COLUMN[m.status] ?? "pending",
    assignee: m.technician ?? undefined,
    progress: m.progress ?? undefined,
  };
}

function PriorityBadge({ priority }: { priority: Priority }) {
  return <span className={`rounded border px-1 py-0.5 font-label-caps text-[10px] ${priorityCls[priority]}`}>{priority}</span>;
}

function csvCell(v: string) {
  return /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export function MaintenanceBoard() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [people, setPeople] = useState<string[]>([]); // technicians from the employees table
  const [now, setNow] = useState(() => Date.now());
  const [enabled, setEnabled] = useState<Record<Priority, boolean>>({ High: true, Medium: true, Low: true });
  const [filterOpen, setFilterOpen] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<ColumnKey | null>(null);
  const [raiseOpen, setRaiseOpen] = useState(false);
  const [detail, setDetail] = useState<Card | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  // Assets from the assets table (for the raise-request picker).
  const [assets, setAssets] = useState<{ tag: string; name: string }[]>([]);

  // Raise/edit-request form state. editingId set → the modal is in edit mode.
  const [form, setForm] = useState({ assetTag: "", issue: "", priority: "Medium" as Priority });
  const [errors, setErrors] = useState<{ asset?: string; issue?: string }>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  // Close the filter popover on outside click / Escape.
  useEffect(() => {
    if (!filterOpen) return;
    function onDown(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setFilterOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [filterOpen]);

  // Load maintenance requests from the backend.
  function reload() {
    return api
      .listMaintenance()
      .then((rows) => setCards(rows.map(toCard)))
      .catch(() => setLoadError("Couldn't load maintenance requests. Is the backend running?"));
  }
  useEffect(() => {
    reload().finally(() => setLoading(false));
    // Assignee options come from the employees table (same directory the booking pickers use).
    api.listEmployeeOptions().then((rows) => setPeople(rows.map((r) => r.name))).catch(() => {});
    api.listAssets().then((rows) => setAssets(rows.map((a) => ({ tag: a.asset_tag, name: a.name })))).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep relative "raised ago" labels fresh.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Close the detail modal on Escape.
  useEffect(() => {
    if (!detail) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setDetail(null);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [detail]);

  const allPriorities = PRIORITIES.every((p) => enabled[p]);
  const visible = (c: Card) => enabled[c.priority];
  const colTitle = (k: ColumnKey) => COLUMNS.find((c) => c.key === k)!.title;

  // Optimistic move; reload from server if the request fails.
  function moveCard(id: string, column: ColumnKey) {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, column } : c)));
    api.moveMaintenance(id, COLUMN_TO_STATUS[column]).catch(() => reload());
  }

  function moveDetailNext() {
    if (!detail) return;
    const idx = COLUMNS.findIndex((c) => c.key === detail.column);
    const next = COLUMNS[idx + 1];
    if (!next) return;
    moveCard(detail.id, next.key);
    setDetail({ ...detail, column: next.key });
  }

  // Assign / reassign / unassign a technician. Assigning an approved request
  // advances it to "Technician Assigned".
  function assign(id: string, name: string) {
    const assignee = name || undefined;
    const advance = (col: ColumnKey): ColumnKey => (assignee && col === "approved" ? "assigned" : col);
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, assignee, column: advance(c.column) } : c)));
    setDetail((d) => (d && d.id === id ? { ...d, assignee, column: advance(d.column) } : d));
    api.assignMaintenance(id, name || null).catch(() => reload());
  }

  // Asset picker options; when editing, ensure the request's current asset stays selectable.
  const assetOptions = (() => {
    const opts = assets.map((a) => ({ tag: a.tag, name: a.name }));
    if (editingId) {
      const orig = cards.find((c) => c.id === editingId);
      if (orig && orig.tag && !opts.some((o) => o.tag === orig.tag)) opts.unshift({ tag: orig.tag, name: orig.asset });
    }
    return opts;
  })();

  function openRaise() {
    setEditingId(null);
    setForm({ assetTag: "", issue: "", priority: "Medium" });
    setErrors({});
    setRaiseOpen(true);
  }

  function openEdit(card: Card) {
    setEditingId(card.id);
    setForm({ assetTag: card.tag, issue: card.issue, priority: card.priority });
    setErrors({});
    setDetail(null);
    setRaiseOpen(true);
  }

  function closeForm() {
    setRaiseOpen(false);
    setEditingId(null);
    setForm({ assetTag: "", issue: "", priority: "Medium" });
    setErrors({});
  }

  function deleteRequest(id: string) {
    if (!window.confirm("Delete this maintenance request? This cannot be undone.")) return;
    setCards((prev) => prev.filter((c) => c.id !== id));
    setDetail(null);
    api.deleteMaintenance(id).catch(() => reload());
  }

  function exportBoard() {
    const header = ["Tag", "Asset", "Priority", "Issue", "Status", "Assignee", "Raised"];
    const titleOf = (k: ColumnKey) => COLUMNS.find((c) => c.key === k)!.title;
    // Export what's on the board, ordered by column and respecting the active filter.
    const ordered = COLUMNS.flatMap((col) => cards.filter((c) => c.column === col.key && visible(c)));
    const rows = ordered.map((c) => [c.tag, c.asset, c.priority, c.issue, titleOf(c.column), c.assignee ?? "", formatDate(c.raisedAt)]);
    // CRLF line endings (RFC 4180) + UTF-8 BOM so Excel/Windows editors parse it correctly.
    const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "maintenance-board.csv";
    a.rel = "noopener";
    a.style.display = "none";
    // Anchor must be in the DOM for the download filename/extension to be honored in all browsers.
    document.body.appendChild(a);
    a.click();
    // Defer cleanup: revoking the object URL synchronously can race the download
    // start in Chromium and drop the filename/extension.
    setTimeout(() => {
      a.remove();
      URL.revokeObjectURL(url);
    }, 2000);
  }

  function submitRaise(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!form.assetTag) next.asset = "Select an asset.";
    if (!form.issue.trim()) next.issue = "Describe the issue.";
    setErrors(next);
    if (Object.keys(next).length) return;

    const picked = assetOptions.find((a) => a.tag === form.assetTag);
    const payload = { asset: picked?.name ?? form.assetTag, asset_tag: form.assetTag, priority: form.priority, issue: form.issue.trim() };
    if (editingId) {
      api
        .updateMaintenance(editingId, payload)
        .then((updated) => setCards((prev) => prev.map((c) => (c.id === editingId ? toCard(updated) : c))))
        .catch(() => reload());
    } else {
      api
        .raiseMaintenance(payload)
        .then((created) => setCards((prev) => [toCard(created), ...prev]))
        .catch(() => reload());
    }
    closeForm();
  }

  if (loading) {
    return <div className="p-lg font-body-md text-body-md text-on-surface-variant">Loading maintenance board…</div>;
  }

  return (
    <div className="flex flex-col">
      {loadError && (
        <div className="border-b border-status-warning/30 bg-status-warning/10 px-lg py-sm font-body-sm text-body-sm text-status-warning">
          {loadError}
        </div>
      )}
      {/* Header + actions */}
      <div className="flex flex-col justify-between gap-md border-b border-border-muted bg-surface px-lg py-lg sm:flex-row sm:items-end">
        <div>
          <h1 className="font-headline-md text-headline-md text-primary">Maintenance Management</h1>
          <p className="mt-xs font-body-md text-body-md text-on-surface-variant">
            Approve and track enterprise asset repairs — drag a card to move it to the next step.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-sm">
          {/* Filter by priority */}
          <div ref={filterRef} className="relative">
            <button
              onClick={() => setFilterOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={filterOpen}
              className="flex items-center gap-xs rounded-DEFAULT border border-border-muted bg-surface px-md py-1.5 font-body-sm text-body-sm text-primary transition-colors hover:bg-surface-subtle"
            >
              <SlidersHorizontal className="h-4 w-4" /> Filter by Priority
              {!allPriorities && <span className="h-1.5 w-1.5 rounded-full bg-indigo-accent" />}
            </button>
            {filterOpen && (
              <div role="menu" className="absolute right-0 top-full z-30 mt-1 w-52 rounded-DEFAULT border border-border-muted bg-surface p-1 shadow-lifted">
                {PRIORITIES.map((p) => (
                  <button
                    key={p}
                    role="menuitemcheckbox"
                    aria-checked={enabled[p]}
                    onClick={() => setEnabled((s) => ({ ...s, [p]: !s[p] }))}
                    className="flex w-full items-center justify-between rounded-DEFAULT px-md py-sm text-left font-body-sm text-body-sm text-on-surface transition-colors hover:bg-surface-container-low"
                  >
                    <span className="flex items-center gap-sm">
                      <PriorityBadge priority={p} /> {p}
                    </span>
                    <span className={`flex h-4 w-4 items-center justify-center rounded border ${enabled[p] ? "border-indigo-accent bg-indigo-accent text-white" : "border-border-muted"}`}>
                      {enabled[p] && <Check className="h-3 w-3" />}
                    </span>
                  </button>
                ))}
                <div className="mt-1 border-t border-border-muted pt-1">
                  <button
                    onClick={() => setEnabled({ High: true, Medium: true, Low: true })}
                    className="w-full rounded-DEFAULT px-md py-sm text-left font-label-caps text-label-caps font-semibold text-indigo-accent transition-colors hover:bg-surface-container-low"
                  >
                    Show all
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={exportBoard}
            className="flex items-center gap-xs rounded-DEFAULT border border-border-muted bg-surface px-md py-1.5 font-body-sm text-body-sm text-primary transition-colors hover:bg-surface-subtle"
          >
            <Download className="h-4 w-4" /> Export Board
          </button>
          <button
            onClick={openRaise}
            className="flex items-center gap-xs rounded-DEFAULT bg-deep-navy px-md py-1.5 font-body-sm text-body-sm text-white shadow-card transition-opacity hover:opacity-90 dark:bg-indigo-accent"
          >
            <Plus className="h-4 w-4" /> Raise Maintenance Request
          </button>
        </div>
      </div>

      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto p-lg">
        <div className="flex min-w-max gap-md pb-lg">
          {COLUMNS.map((col) => {
            const colCards = cards.filter((c) => c.column === col.key && visible(c));
            const isResolved = col.key === "resolved";
            return (
              <div
                key={col.key}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(col.key);
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragId) moveCard(dragId, col.key);
                  setDragId(null);
                  setDragOver(null);
                }}
                className={
                  "flex w-[320px] flex-col rounded-DEFAULT border bg-surface-subtle transition-colors " +
                  (dragOver === col.key ? "border-indigo-accent ring-2 ring-indigo-accent/30" : "border-border-muted") +
                  (isResolved ? " opacity-90" : "")
                }
              >
                <div className="flex items-center justify-between rounded-t-DEFAULT border-b border-border-muted bg-surface-container-low p-sm">
                  <h2 className="flex items-center gap-xs font-label-caps text-label-caps font-semibold text-primary">
                    {col.title}
                    <span className="rounded-full bg-surface-container-high px-1.5 py-0.5 text-on-surface-variant">{colCards.length}</span>
                  </h2>
                  <button aria-label="Column options" className="text-on-surface-variant hover:text-primary">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex min-h-[96px] flex-1 flex-col gap-sm p-sm">
                  {colCards.length === 0 && (
                    <div className="flex flex-1 items-center justify-center rounded-DEFAULT border border-dashed border-border-muted py-lg font-body-sm text-body-sm text-on-surface-variant">
                      Drop here
                    </div>
                  )}
                  {colCards.map((card) => (
                    <div
                      key={card.id}
                      draggable
                      onDragStart={() => setDragId(card.id)}
                      onDragEnd={() => {
                        setDragId(null);
                        setDragOver(null);
                      }}
                      onClick={() => setDetail(card)}
                      className={
                        "group cursor-move rounded border border-border-muted p-sm shadow-card transition-all hover:border-indigo-accent hover:shadow-lifted " +
                        (isResolved ? "bg-surface-container-lowest" : "bg-surface") +
                        (dragId === card.id ? " opacity-40" : "")
                      }
                    >
                      <div className="mb-xs flex items-start justify-between">
                        <span className={`font-mono-data text-mono-data ${isResolved ? "text-on-surface-variant line-through" : "text-primary"}`}>
                          {card.tag} {card.asset}
                        </span>
                        <PriorityBadge priority={card.priority} />
                      </div>

                      <p className={`font-body-sm text-body-sm ${isResolved ? "text-on-surface-variant" : "text-on-surface"} ${card.column === "approved" || card.progress ? "" : "mb-sm"}`}>
                        {card.issue}
                      </p>

                      {card.column === "approved" && (
                        <div className="mb-sm">
                          <span className="mt-1 inline-block rounded border border-status-warning/30 bg-status-warning/15 px-1 py-0.5 font-label-caps text-[9px] font-semibold text-status-warning">
                            Status: Under Maintenance
                          </span>
                        </div>
                      )}

                      {card.column === "in_progress" && card.progress !== undefined && (
                        <div className="mb-sm mt-sm">
                          <div className="mb-1 flex justify-between font-body-sm text-[10px] text-on-surface-variant">
                            <span>Progress</span>
                            <span>{card.progress}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-surface-container-high">
                            <div className="h-1.5 rounded-full bg-indigo-accent" style={{ width: `${card.progress}%` }} />
                          </div>
                        </div>
                      )}

                      <div className={`flex items-center justify-between ${card.assignee && card.column === "assigned" ? "mt-sm border-t border-surface-container-high pt-xs" : ""}`}>
                        {isResolved ? (
                          <span title={`Raised ${formatDate(card.raisedAt)}`} className="flex items-center gap-1 font-body-sm text-[11px] text-emerald-active">
                            <CheckCircle2 className="h-3 w-3" /> Done {timeAgo(card.raisedAt, now)}
                          </span>
                        ) : card.assignee ? (
                          <>
                            <div className="flex items-center gap-1">
                              <User className="h-3.5 w-3.5 text-on-surface-variant" />
                              <span className="font-body-sm text-[11px] text-primary">{card.assignee}</span>
                            </div>
                            <span title={`Raised ${formatDate(card.raisedAt)}`} className="flex items-center gap-1 font-body-sm text-[11px] text-on-surface-variant">
                              <Clock className="h-3 w-3" /> {timeAgo(card.raisedAt, now)}
                            </span>
                          </>
                        ) : card.column === "approved" ? (
                          <>
                            <span title={`Raised ${formatDate(card.raisedAt)}`} className="flex items-center gap-1 font-body-sm text-[11px] text-on-surface-variant">
                              <Clock className="h-3 w-3" /> {timeAgo(card.raisedAt, now)}
                            </span>
                            <span className="font-body-sm text-[11px] font-medium text-indigo-accent">Assign Tech</span>
                          </>
                        ) : (
                          <span title={`Raised ${formatDate(card.raisedAt)}`} className="flex items-center gap-1 font-body-sm text-[11px] text-on-surface-variant">
                              <Clock className="h-3 w-3" /> {timeAgo(card.raisedAt, now)}
                            </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Raise maintenance request modal */}
      {raiseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md">
          <div className="absolute inset-0 bg-black/40" aria-hidden="true" onClick={closeForm} />
          <div role="dialog" aria-label={editingId ? "Edit maintenance request" : "Raise maintenance request"} className="relative z-10 w-full max-w-md rounded-lg border border-border-muted bg-surface p-lg shadow-lifted">
            <div className="mb-md flex items-start justify-between">
              <h2 className="font-headline-sm text-headline-sm font-semibold text-primary">{editingId ? "Edit Maintenance Request" : "Raise Maintenance Request"}</h2>
              <button aria-label="Close" onClick={closeForm} className="rounded-full p-1 text-on-surface-variant transition-colors hover:bg-surface-container-low">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form className="space-y-md" onSubmit={submitRaise} noValidate>
              <Field label="Asset" error={errors.asset}>
                <Select
                  searchable
                  options={assetOptions.map((a) => ({ label: `${a.tag} · ${a.name}`, value: a.tag }))}
                  value={form.assetTag}
                  onChange={(v) => setForm((f) => ({ ...f, assetTag: v }))}
                  placeholder={assets.length ? "Search an asset…" : "No assets — register one first"}
                />
              </Field>
              <Field label="Issue" error={errors.issue}>
                <Textarea
                  rows={3}
                  placeholder="Describe the problem…"
                  tone={errors.issue ? "error" : "default"}
                  value={form.issue}
                  onChange={(e) => setForm((f) => ({ ...f, issue: e.target.value }))}
                />
              </Field>
              <Field label="Priority">
                <Select
                  options={PRIORITIES.map((p) => ({ label: p, value: p }))}
                  value={form.priority}
                  onChange={(v) => setForm((f) => ({ ...f, priority: v as Priority }))}
                />
              </Field>
              <div className="flex gap-sm border-t border-border-muted pt-md">
                <button type="button" onClick={closeForm} className="flex-1 rounded-DEFAULT border border-border-muted bg-surface py-sm font-body-sm text-body-sm font-medium text-on-surface transition-colors hover:bg-surface-subtle">
                  Cancel
                </button>
                <button type="submit" className="flex flex-1 items-center justify-center gap-xs rounded-DEFAULT bg-emerald-active py-sm font-body-sm text-body-sm font-semibold text-white transition-opacity hover:opacity-90">
                  {editingId ? (<><Check className="h-4 w-4" /> Save Changes</>) : (<><Plus className="h-4 w-4" /> Add Request</>)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request detail modal — opens when a card is clicked */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md">
          <div className="absolute inset-0 bg-black/40" aria-hidden="true" onClick={() => setDetail(null)} />
          <div role="dialog" aria-label="Request details" className="relative z-10 w-full max-w-md rounded-lg border border-border-muted bg-surface p-lg shadow-lifted">
            <div className="mb-md flex items-start justify-between gap-md">
              <div>
                <p className="font-mono-data text-mono-data text-on-surface-variant">{detail.tag}</p>
                <h2 className="font-headline-sm text-headline-sm font-semibold text-primary">{detail.asset}</h2>
              </div>
              <button aria-label="Close" onClick={() => setDetail(null)} className="rounded-full p-1 text-on-surface-variant transition-colors hover:bg-surface-container-low">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-md flex flex-wrap items-center gap-sm">
              <PriorityBadge priority={detail.priority} />
              <span className="rounded-full border border-border-muted bg-surface-subtle px-2 py-0.5 font-label-caps text-[10px] font-semibold uppercase text-on-surface-variant">
                {colTitle(detail.column)}
              </span>
            </div>

            <div className="space-y-md">
              <div>
                <p className="mb-xs font-label-caps text-label-caps font-semibold uppercase text-on-surface-variant">Issue</p>
                <p className="font-body-md text-body-md text-on-surface">{detail.issue}</p>
              </div>

              <Field label="Assignee">
                <Select
                  options={[{ label: "Unassigned", value: "" }, ...(people.length ? people : TECHNICIANS).map((t) => ({ label: t, value: t }))]}
                  value={detail.assignee ?? ""}
                  onChange={(v) => assign(detail.id, v)}
                  placeholder="Unassigned"
                  icon={<User className="h-[18px] w-[18px] text-on-surface-variant" />}
                />
              </Field>

              <div>
                <p className="mb-xs font-label-caps text-label-caps font-semibold uppercase text-on-surface-variant">Raised</p>
                <p className="font-body-md text-body-md text-on-surface">{timeAgo(detail.raisedAt, now)}</p>
                <p className="font-body-sm text-[11px] text-on-surface-variant">{formatDate(detail.raisedAt)}</p>
              </div>

              {detail.column === "in_progress" && detail.progress !== undefined && (
                <div>
                  <div className="mb-1 flex justify-between font-body-sm text-body-sm text-on-surface-variant">
                    <span>Progress</span>
                    <span>{detail.progress}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-surface-container-high">
                    <div className="h-2 rounded-full bg-indigo-accent" style={{ width: `${detail.progress}%` }} />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-lg flex items-center justify-between gap-sm border-t border-border-muted pt-md">
              <div className="flex gap-sm">
                {detail.column === "pending" && (
                  <button
                    type="button"
                    onClick={() => openEdit(detail)}
                    className="flex items-center gap-xs rounded-DEFAULT border border-border-muted bg-surface px-3 py-sm font-body-sm text-body-sm font-medium text-on-surface transition-colors hover:bg-surface-subtle"
                  >
                    <Pencil className="h-4 w-4" /> Edit
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => deleteRequest(detail.id)}
                  className="flex items-center gap-xs rounded-DEFAULT border border-error/40 bg-error/5 px-3 py-sm font-body-sm text-body-sm font-semibold text-error transition-colors hover:bg-error/10"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              </div>
              <div className="flex justify-end gap-sm">
                <button type="button" onClick={() => setDetail(null)} className="rounded-DEFAULT border border-border-muted bg-surface px-4 py-sm font-body-sm text-body-sm font-medium text-on-surface transition-colors hover:bg-surface-subtle">
                  Close
                </button>
                {detail.column !== "resolved" && (
                  <button
                    type="button"
                    onClick={moveDetailNext}
                    className="flex items-center justify-center gap-xs whitespace-nowrap rounded-DEFAULT bg-deep-navy px-4 py-sm font-body-sm text-body-sm font-semibold text-white transition-opacity hover:opacity-90 dark:bg-indigo-accent"
                  >
                    Next step <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
