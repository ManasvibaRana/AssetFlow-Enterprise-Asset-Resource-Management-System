"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, Check } from "lucide-react";

export type SelectOption = { label: string; value: string };

type SelectProps = {
  options: SelectOption[];
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  icon?: ReactNode;
  className?: string;
  buttonClassName?: string;
};

/**
 * Modern custom dropdown — a styled replacement for the native <select>.
 * Works controlled (pass value + onChange) or uncontrolled (defaultValue).
 * Closes on outside-click and Escape; basic keyboard support.
 */
export function Select({
  options,
  defaultValue,
  value,
  onChange,
  placeholder = "Select…",
  icon,
  className = "",
  buttonClassName = "",
}: SelectProps) {
  const [internal, setInternal] = useState(defaultValue ?? "");
  const selected = value ?? internal;
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

  function choose(v: string) {
    if (value === undefined) setInternal(v);
    onChange?.(v);
    setOpen(false);
  }

  const current = options.find((o) => o.value === selected);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={
          "flex w-full items-center justify-between gap-sm rounded-DEFAULT border border-border-muted bg-surface px-md py-sm font-body-md text-body-md font-semibold text-on-surface outline-none transition-colors hover:bg-surface-container-low focus:border-indigo-accent focus:ring-1 focus:ring-indigo-accent " +
          buttonClassName
        }
      >
        <span className="flex items-center gap-sm truncate">
          {icon}
          <span className={current ? "" : "text-on-surface-variant"}>{current?.label ?? placeholder}</span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-on-surface-variant transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 top-full z-30 mt-1 max-h-64 w-full overflow-auto rounded-DEFAULT border border-border-muted bg-surface p-1 shadow-lifted"
        >
          {options.map((o) => {
            const isSel = o.value === selected;
            return (
              <li key={o.value} role="option" aria-selected={isSel}>
                <button
                  type="button"
                  onClick={() => choose(o.value)}
                  className={
                    "flex w-full items-center justify-between gap-sm rounded-DEFAULT px-md py-sm text-left font-body-md text-body-md transition-colors " +
                    (isSel ? "bg-indigo-accent/10 font-semibold text-indigo-accent" : "text-on-surface hover:bg-surface-container-low")
                  }
                >
                  <span className="truncate">{o.label}</span>
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
