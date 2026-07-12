"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Calendar } from "@/components/ui/Calendar";

// e.g. "Tue, 7 Jul 2026"
function formatLabel(d: Date) {
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type DateNavProps = {
  initial?: string;
  value?: Date; // controlled
  onChange?: (d: Date) => void;
};

export function DateNav({ initial = "2026-07-07", value, onChange }: DateNavProps) {
  // Parse yyyy-mm-dd as a local date (noon avoids DST/UTC edge cases).
  const [internal, setInternal] = useState(() => new Date(`${initial}T12:00:00`));
  const date = value ?? internal;
  const setDate = (d: Date) => {
    if (value === undefined) setInternal(d);
    onChange?.(d);
  };
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function shiftDay(days: number) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    setDate(next);
  }

  return (
    <div ref={rootRef} className="relative flex w-full items-center justify-center gap-md sm:w-auto sm:justify-start">
      <button
        type="button"
        aria-label="Previous day"
        onClick={() => shiftDay(-1)}
        className="rounded-DEFAULT p-1 text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex items-center gap-xs rounded-DEFAULT px-2 py-1 font-body-md text-body-md font-semibold text-on-surface transition-colors hover:bg-surface-container-low"
      >
        <CalendarDays className="h-4 w-4 text-indigo-accent" />
        {formatLabel(date)}
      </button>

      <button
        type="button"
        aria-label="Next day"
        onClick={() => shiftDay(1)}
        className="rounded-DEFAULT p-1 text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Choose date"
          className="absolute left-1/2 top-full z-30 mt-2 w-[280px] -translate-x-1/2 rounded-lg border border-border-muted bg-surface p-md shadow-lifted"
        >
          <Calendar
            value={date}
            onSelect={(d) => {
              setDate(d);
              setOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
