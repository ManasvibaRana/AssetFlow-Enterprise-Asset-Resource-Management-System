"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ChevronDown, Check, Search } from "lucide-react";

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
  /** Show a search box in the dropdown. Defaults to on when there are > 4 options. */
  searchable?: boolean;
};

/**
 * Modern custom dropdown — a styled replacement for the native <select>.
 * Works controlled (pass value + onChange) or uncontrolled (defaultValue).
 * Closes on outside-click and Escape; filters as you type when searchable.
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
  searchable,
}: SelectProps) {
  const [internal, setInternal] = useState(defaultValue ?? "");
  const selected = value ?? internal;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
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
  const showSearch = searchable ?? options.length > 4;
  const filtered = useMemo(
    () => (query ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase())) : options),
    [options, query],
  );

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
        <div className="absolute left-0 top-full z-30 mt-1 w-full overflow-hidden rounded-DEFAULT border border-border-muted bg-surface shadow-lifted">
          {showSearch && (
            <div className="flex items-center gap-sm border-b border-border-muted px-sm">
              <Search className="h-4 w-4 shrink-0 text-on-surface-variant" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                className="w-full bg-transparent py-sm font-body-sm text-body-sm text-on-surface outline-none placeholder:text-on-surface-variant"
              />
            </div>
          )}
          <ul role="listbox" className="max-h-56 overflow-auto p-1">
            {filtered.length === 0 ? (
              <li className="px-md py-sm font-body-sm text-body-sm text-on-surface-variant">No results</li>
            ) : (
              filtered.map((o) => {
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
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
