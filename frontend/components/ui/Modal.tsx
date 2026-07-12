"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function Modal({ open, onClose, title, children, footer }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-md" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-deep-navy/50" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-xl border border-border-muted bg-surface shadow-lifted">
        <div className="flex items-center justify-between border-b border-border-muted px-lg py-md">
          <h2 className="font-headline-sm text-headline-sm text-primary">{title}</h2>
          <button
            aria-label="Close"
            onClick={onClose}
            className="rounded-full p-1 text-on-surface-variant transition-colors hover:bg-surface-container-low"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-lg py-md">{children}</div>
        {footer && (
          <div className="flex justify-end gap-sm border-t border-border-muted bg-surface-subtle px-lg py-md">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// Shared form-control styles reused across Organization Setup forms.
export const fieldLabel = "mb-xs block font-label-caps text-label-caps font-semibold text-on-surface-variant";
export const fieldInput =
  "w-full rounded-DEFAULT border border-border-muted bg-surface px-md py-2 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant focus:border-indigo-accent focus:outline-none focus:ring-1 focus:ring-indigo-accent";
