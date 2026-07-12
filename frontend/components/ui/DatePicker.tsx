"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays } from "lucide-react";
import { Calendar } from "./Calendar";

type Tone = "default" | "warning" | "error";

const toneCls: Record<Tone, string> = {
  default: "border-border-muted focus:border-indigo-accent focus:ring-indigo-accent",
  warning: "border-status-warning bg-status-warning/5 focus:ring-status-warning",
  error: "border-error focus:border-error focus:ring-error",
};

// "7 Jul 2026"
function formatField(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

type DatePickerProps = {
  defaultValue?: string; // yyyy-mm-dd
  value?: string;
  onChange?: (value: string) => void; // yyyy-mm-dd
  tone?: Tone;
  className?: string;
};

function toInputValue(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Modern date form-field: a styled button showing the date + a Calendar popover. */
export function DatePicker({
  defaultValue = "2026-07-07",
  value,
  onChange,
  tone = "default",
  className = "",
}: DatePickerProps) {
  const [internal, setInternal] = useState(() => new Date(`${value ?? defaultValue}T12:00:00`));
  const date = value ? new Date(`${value}T12:00:00`) : internal;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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

  function select(d: Date) {
    if (value === undefined) setInternal(d);
    onChange?.(toInputValue(d));
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={
          "flex w-full items-center justify-between gap-sm rounded-DEFAULT border px-sm py-sm font-body-sm text-body-sm text-on-surface outline-none transition-colors focus:ring-1 " +
          toneCls[tone]
        }
      >
        <span>{formatField(date)}</span>
        <CalendarDays className="h-4 w-4 shrink-0 text-on-surface-variant" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Choose date"
          className="absolute left-0 top-full z-30 mt-1 w-[280px] rounded-lg border border-border-muted bg-surface p-md shadow-lifted"
        >
          <Calendar value={date} onSelect={select} />
        </div>
      )}
    </div>
  );
}
