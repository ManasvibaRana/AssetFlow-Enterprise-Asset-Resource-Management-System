"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ChevronDown, Check, X, Search } from "lucide-react";

export type Option = { label: string; value: string };

type MultiSelectProps = {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  icon?: ReactNode;
  className?: string;
};

/** Multi-select dropdown with removable chips and search — used to invite people to a booking. */
export function MultiSelect({ options, value, onChange, placeholder = "Select…", icon, className = "" }: MultiSelectProps) {
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

  function toggle(v: string) {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  }

  const labelOf = (v: string) => options.find((o) => o.value === v)?.label ?? v;
  const showSearch = options.length > 4;
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
        className="flex min-h-[38px] w-full items-center justify-between gap-sm rounded-DEFAULT border border-border-muted bg-surface px-sm py-1.5 text-left outline-none transition-colors hover:bg-surface-container-low focus:border-indigo-accent focus:ring-1 focus:ring-indigo-accent"
      >
        <span className="flex flex-1 flex-wrap items-center gap-1">
          {icon}
          {value.length === 0 ? (
            <span className="font-body-sm text-body-sm text-on-surface-variant">{placeholder}</span>
          ) : (
            value.map((v) => (
              <span
                key={v}
                className="flex items-center gap-1 rounded-full bg-indigo-accent/10 px-2 py-0.5 font-body-sm text-[11px] font-medium text-indigo-accent"
              >
                {labelOf(v)}
                <span
                  role="button"
                  aria-label={`Remove ${labelOf(v)}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(v);
                  }}
                  className="rounded-full hover:bg-indigo-accent/20"
                >
                  <X className="h-3 w-3" />
                </span>
              </span>
            ))
          )}
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
          <ul role="listbox" aria-multiselectable="true" className="max-h-56 overflow-auto p-1">
            {filtered.length === 0 ? (
              <li className="px-md py-sm font-body-sm text-body-sm text-on-surface-variant">No results</li>
            ) : (
              filtered.map((o) => {
                const sel = value.includes(o.value);
                return (
                  <li key={o.value} role="option" aria-selected={sel}>
                    <button
                      type="button"
                      onClick={() => toggle(o.value)}
                      className={
                        "flex w-full items-center justify-between gap-sm rounded-DEFAULT px-md py-sm text-left font-body-sm text-body-sm transition-colors " +
                        (sel ? "bg-indigo-accent/10 font-semibold text-indigo-accent" : "text-on-surface hover:bg-surface-container-low")
                      }
                    >
                      <span className="truncate">{o.label}</span>
                      <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${sel ? "border-indigo-accent bg-indigo-accent text-white" : "border-border-muted"}`}>
                        {sel && <Check className="h-3 w-3" />}
                      </span>
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
