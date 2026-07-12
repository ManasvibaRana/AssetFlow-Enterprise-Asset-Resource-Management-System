"use client";

import { useEffect, useRef, useState } from "react";
import { Clock, Check } from "lucide-react";

type Tone = "default" | "warning" | "error";

const toneCls: Record<Tone, string> = {
  default: "border-border-muted focus:border-indigo-accent focus:ring-indigo-accent",
  warning: "border-status-warning bg-status-warning/5 focus:ring-status-warning",
  error: "border-error focus:border-error focus:ring-error",
};

// "09:30" -> "09:30 AM"
function format12(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
}

// Build ["00:00", "00:30", …] at the given minute step.
function buildOptions(step: number) {
  const out: string[] = [];
  for (let mins = 0; mins < 24 * 60; mins += step) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
  return out;
}

type TimePickerProps = {
  defaultValue?: string; // 24h "HH:MM"
  value?: string;
  onChange?: (value: string) => void;
  step?: number; // minutes between options
  tone?: Tone;
  className?: string;
};

/** Modern custom time picker — a styled popover list replacing <input type="time">. */
export function TimePicker({
  defaultValue = "09:00",
  value,
  onChange,
  step = 30,
  tone = "default",
  className = "",
}: TimePickerProps) {
  const [internal, setInternal] = useState(defaultValue);
  const selected = value ?? internal;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  const options = buildOptions(step);

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
    // Bring the selected option into view when the list opens.
    selectedRef.current?.scrollIntoView({ block: "center" });
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function choose(v: string) {
    if (value === undefined) setInternal(v);
    onChange?.(v);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={
          "flex w-full items-center justify-between gap-sm rounded-DEFAULT border px-sm py-sm font-body-sm text-body-sm text-on-surface outline-none transition-colors focus:ring-1 " +
          toneCls[tone]
        }
      >
        <span>{format12(selected)}</span>
        <Clock className="h-4 w-4 shrink-0 text-on-surface-variant" />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 top-full z-30 mt-1 max-h-56 w-full overflow-auto rounded-DEFAULT border border-border-muted bg-surface p-1 shadow-lifted"
        >
          {options.map((o) => {
            const isSel = o === selected;
            return (
              <li key={o} role="option" aria-selected={isSel}>
                <button
                  ref={isSel ? selectedRef : undefined}
                  type="button"
                  onClick={() => choose(o)}
                  className={
                    "flex w-full items-center justify-between rounded-DEFAULT px-md py-sm text-left font-body-sm text-body-sm transition-colors " +
                    (isSel ? "bg-indigo-accent/10 font-semibold text-indigo-accent" : "text-on-surface hover:bg-surface-container-low")
                  }
                >
                  <span>{format12(o)}</span>
                  {isSel && <Check className="h-4 w-4 shrink-0" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
