"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Plus, X } from "lucide-react";

export type Booking = {
  hour: string;
  title: string;
  time: string;
  by: string;
  // vertical offset + height within the 1-hour row, expressed as % of the row.
  top: string;
  height: string;
};

export type Conflict = { hour: string; label: string; top: string; height: string };

// Full 24-hour day.
const HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`);
const ROW_H = 64; // px, must match the h-16 rows
const POPOVER_W = 288;
const POPOVER_H_EST = 210;

function nextHour(h: string) {
  const n = (parseInt(h, 10) + 1) % 24;
  return `${String(n).padStart(2, "0")}:00`;
}

type Quick = { hour: string; left: number; top: number } | null;

export function Timeline({ bookings, conflict }: { bookings: Booking[]; conflict: Conflict }) {
  const [quick, setQuick] = useState<Quick>(null);
  const [title, setTitle] = useState("");
  const [added, setAdded] = useState<{ hour: string; title: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  // Scroll the working day into view on mount (demo bookings sit at 09:00 / 11:00).
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 8 * ROW_H - 8;
  }, []);

  // Close the quick-add tooltip on outside click / Escape.
  useEffect(() => {
    if (!quick) return;
    function onDown(e: MouseEvent) {
      const t = e.target as HTMLElement;
      if (popRef.current?.contains(t)) return;
      if (t.closest("[data-slot]")) return; // a slot click reopens via onClick
      setQuick(null);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setQuick(null);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [quick]);

  function openSlot(hour: string, e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const left = Math.min(Math.max(r.left, 8), window.innerWidth - POPOVER_W - 8);
    // Flip above the row if there isn't room below.
    const below = r.bottom + 8 + POPOVER_H_EST <= window.innerHeight;
    const top = below ? r.bottom + 8 : r.top - 8 - POPOVER_H_EST;
    setTitle("");
    setQuick({ hour, left, top });
  }

  function addReservation() {
    if (quick && title.trim()) setAdded((a) => [...a, { hour: quick.hour, title: title.trim() }]);
    setQuick(null);
  }

  return (
    <div className="rounded-DEFAULT border border-border-muted bg-surface shadow-card">
      {/* Header + legend */}
      <div className="flex items-center justify-between rounded-t-DEFAULT border-b border-border-muted bg-surface-subtle px-md py-sm">
        <span className="font-label-caps text-label-caps font-semibold uppercase text-on-surface-variant">Schedule</span>
        <div className="flex gap-md">
          <span className="flex items-center gap-xs font-body-sm text-body-sm text-on-surface-variant">
            <span className="h-3 w-3 rounded border border-slate-300 bg-slate-200" /> Booked
          </span>
          <span className="flex items-center gap-xs font-body-sm text-body-sm text-status-warning">
            <span className="h-3 w-3 rounded border-2 border-dashed border-status-warning bg-status-warning/10" /> Conflict
          </span>
        </div>
      </div>

      {/* Scrollable full-day timeline */}
      <div
        ref={scrollRef}
        onScroll={() => quick && setQuick(null)}
        className="scroll-slim max-h-[480px] overflow-y-auto p-md"
      >
        <div className="relative before:absolute before:inset-y-0 before:left-[48px] before:border-l before:border-border-muted">
          {HOURS.map((h, i) => {
            const booking = bookings.find((b) => b.hour === h);
            const isConflictRow = conflict.hour === h;
            const addedHere = added.filter((a) => a.hour === h);
            const occupied = !!booking && booking.height === "100%";
            return (
              <div key={h} className={`group relative flex h-16 ${i === 0 ? "" : "border-t border-border-muted/50"}`}>
                <div className="w-12 shrink-0 pr-sm pt-xs text-right font-mono-data text-mono-data text-on-surface-variant">
                  {h}
                </div>
                <div
                  data-slot={occupied ? undefined : h}
                  onClick={occupied ? undefined : (e) => openSlot(h, e)}
                  className={
                    "relative flex-1 transition-colors " +
                    (occupied ? "" : "cursor-pointer group-hover:bg-surface-subtle")
                  }
                >
                  {/* Hover "Add" affordance on empty slots */}
                  {!occupied && (
                    <span className="pointer-events-none absolute right-sm top-1/2 hidden -translate-y-1/2 items-center gap-xs rounded-full bg-indigo-accent/10 px-2 py-0.5 font-label-caps text-[10px] font-semibold text-indigo-accent group-hover:flex">
                      <Plus className="h-3 w-3" /> Add
                    </span>
                  )}

                  {booking && (
                    <div
                      className="absolute left-sm right-sm z-10 flex flex-col justify-center overflow-hidden rounded border border-l-4 border-slate-300 border-l-indigo-accent bg-slate-200 px-sm py-xs shadow-card"
                      style={{ top: booking.top, height: booking.height }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate font-body-sm text-body-sm font-semibold text-deep-navy">{booking.title}</span>
                        <span className="font-mono-data text-xs text-on-surface-variant">{booking.time}</span>
                      </div>
                      <span className="truncate font-body-sm text-xs text-on-surface-variant">By: {booking.by}</span>
                    </div>
                  )}

                  {addedHere.map((a, idx) => (
                    <div
                      key={idx}
                      className="absolute left-sm right-sm top-0 z-10 flex h-full flex-col justify-center overflow-hidden rounded border border-l-4 border-emerald-active/40 border-l-emerald-active bg-emerald-active/10 px-sm py-xs shadow-card"
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate font-body-sm text-body-sm font-semibold text-emerald-active">{a.title}</span>
                        <span className="font-mono-data text-xs text-on-surface-variant">{a.hour} - {nextHour(a.hour)}</span>
                      </div>
                      <span className="truncate font-body-sm text-xs text-on-surface-variant">By: You</span>
                    </div>
                  ))}

                  {isConflictRow && (
                    <div
                      className="pointer-events-none absolute left-sm right-sm z-20 flex flex-col justify-center overflow-hidden rounded border-2 border-dashed border-status-warning bg-status-warning/5 px-sm py-xs opacity-90"
                      style={{ top: conflict.top, height: conflict.height }}
                    >
                      <div className="mb-xs flex items-center gap-xs text-status-warning">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="font-label-caps text-[10px] font-bold uppercase tracking-wider">Conflict: Slot Unavailable</span>
                      </div>
                      <span className="truncate font-body-sm text-body-sm text-status-warning">{conflict.label}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick-add tooltip — fixed-positioned so the scroll container can't clip it */}
      {quick && (
        <div
          ref={popRef}
          role="dialog"
          aria-label="Quick reservation"
          style={{ position: "fixed", left: quick.left, top: quick.top, width: POPOVER_W }}
          className="z-50 rounded-lg border border-border-muted bg-surface p-md shadow-lifted"
        >
          <div className="mb-sm flex items-start justify-between">
            <div>
              <p className="font-label-caps text-label-caps font-semibold uppercase text-on-surface-variant">New reservation</p>
              <p className="mt-0.5 font-mono-data text-mono-data text-primary">
                {quick.hour} – {nextHour(quick.hour)}
              </p>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setQuick(null)}
              className="rounded-full p-1 text-on-surface-variant transition-colors hover:bg-surface-container-low"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addReservation()}
            placeholder="Purpose / title…"
            className="mb-sm w-full rounded-DEFAULT border border-border-muted px-sm py-sm font-body-sm text-body-sm text-on-surface outline-none transition-colors focus:border-indigo-accent focus:ring-1 focus:ring-indigo-accent"
          />

          <div className="flex gap-sm">
            <button
              type="button"
              onClick={() => setQuick(null)}
              className="flex-1 rounded-DEFAULT border border-border-muted bg-surface py-sm font-body-sm text-body-sm font-medium text-on-surface transition-colors hover:bg-surface-subtle"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={addReservation}
              disabled={!title.trim()}
              className="flex flex-1 items-center justify-center gap-xs rounded-DEFAULT bg-emerald-active py-sm font-body-sm text-body-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
