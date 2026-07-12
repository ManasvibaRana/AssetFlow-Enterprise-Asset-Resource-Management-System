"use client";

import { useEffect, useRef } from "react";
import { Plus, Users } from "lucide-react";

export type Booking = {
  id: string;
  resource: string;
  date: string; // yyyy-mm-dd
  start: string; // "HH:MM" 24h
  end: string; // "HH:MM"
  title: string;
  by: string;
  invitees: string[];
};

// A preview only exists for a free (non-conflicting) selection.
export type Preview = { start: string; end: string } | null;

const HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`);
const ROW_H = 64; // px per hour

export const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

function place(start: string, end: string) {
  const top = (toMin(start) / 60) * ROW_H;
  const height = Math.max(20, ((toMin(end) - toMin(start)) / 60) * ROW_H);
  return { top, height };
}

export function Timeline({
  bookings,
  preview,
  onSlotClick,
  onBookingClick,
}: {
  bookings: Booking[];
  preview: Preview;
  onSlotClick: (hour: string) => void;
  onBookingClick: (b: Booking) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll the working day into view on mount.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 8 * ROW_H - 8;
  }, []);

  return (
    <div className="rounded-DEFAULT border border-border-muted bg-surface shadow-card">
      {/* Header + legend */}
      <div className="flex items-center justify-between rounded-t-DEFAULT border-b border-border-muted bg-surface-subtle px-md py-sm">
        <span className="font-label-caps text-label-caps font-semibold uppercase text-on-surface-variant">Schedule</span>
        <div className="flex gap-md">
          <span className="flex items-center gap-xs font-body-sm text-body-sm text-on-surface-variant">
            <span className="h-3 w-3 rounded border border-slate-300 bg-slate-200" /> Booked
          </span>
          <span className="flex items-center gap-xs font-body-sm text-body-sm text-indigo-accent">
            <span className="h-3 w-3 rounded border-2 border-dashed border-indigo-accent bg-indigo-accent/10" /> Your selection
          </span>
        </div>
      </div>

      {/* Scrollable full-day calendar */}
      <div ref={scrollRef} className="scroll-slim max-h-[520px] overflow-y-auto p-md">
        <div className="relative" style={{ height: 24 * ROW_H }}>
          {/* Hour rows (labels + clickable slots) */}
          {HOURS.map((h, i) => (
            <div key={h} className="absolute left-0 right-0 flex" style={{ top: i * ROW_H, height: ROW_H }}>
              <div className="w-12 shrink-0 pr-sm pt-xs text-right font-mono-data text-mono-data text-on-surface-variant">{h}</div>
              <div
                onClick={() => onSlotClick(h)}
                className={`group relative flex-1 cursor-pointer transition-colors hover:bg-surface-subtle ${i === 0 ? "" : "border-t border-border-muted/50"}`}
              >
                <span className="pointer-events-none absolute right-sm top-1/2 hidden -translate-y-1/2 items-center gap-xs rounded-full bg-indigo-accent/10 px-2 py-0.5 font-label-caps text-[10px] font-semibold text-indigo-accent group-hover:flex">
                  <Plus className="h-3 w-3" /> Book
                </span>
              </div>
            </div>
          ))}

          {/* Vertical divider under the hour labels */}
          <div className="pointer-events-none absolute inset-y-0 left-[48px] border-l border-border-muted" />

          {/* Bookings + preview overlay. Bookings are clickable; empty areas fall through to slots. */}
          <div className="pointer-events-none absolute inset-y-0 left-[52px] right-1">
            {bookings.map((b) => {
              const { top, height } = place(b.start, b.end);
              const compact = height < 44;
              return (
                <div
                  key={b.id}
                  onClick={() => onBookingClick(b)}
                  className="pointer-events-auto absolute left-1 right-1 flex cursor-pointer flex-col overflow-hidden rounded border border-l-4 border-slate-300 border-l-indigo-accent bg-slate-200 px-sm py-xs shadow-card transition-shadow hover:shadow-lifted"
                  style={{ top, height }}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate font-body-sm text-body-sm font-semibold text-deep-navy">{b.title}</span>
                    <span className="shrink-0 font-mono-data text-xs text-on-surface-variant">{b.start}–{b.end}</span>
                  </div>
                  {!compact && (
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="truncate font-body-sm text-xs text-on-surface-variant">By {b.by}</span>
                      {b.invitees.length > 0 && (
                        <span className="flex shrink-0 items-center gap-1 font-body-sm text-xs text-on-surface-variant">
                          <Users className="h-3 w-3" /> {b.invitees.length}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {preview && toMin(preview.end) > toMin(preview.start) && (
              (() => {
                const { top, height } = place(preview.start, preview.end);
                return (
                  <div
                    className="absolute left-1 right-1 z-10 flex flex-col justify-center overflow-hidden rounded border-2 border-dashed border-indigo-accent bg-indigo-accent/10 px-sm py-xs"
                    style={{ top, height }}
                  >
                    <div className="flex items-center gap-xs text-indigo-accent">
                      <span className="font-label-caps text-[10px] font-bold uppercase tracking-wider">New booking</span>
                      <span className="font-mono-data text-xs">{preview.start}–{preview.end}</span>
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
