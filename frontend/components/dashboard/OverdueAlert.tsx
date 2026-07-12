"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

export function OverdueAlert({ count = 3 }: { count?: number }) {
  const [open, setOpen] = useState(true);
  if (!open) return null;

  return (
    <div className="flex items-center gap-md rounded-DEFAULT border border-status-critical/20 bg-error-container p-md text-on-error-container">
      <AlertTriangle className="h-5 w-5 shrink-0 text-status-critical" />
      <p className="flex-1 font-body-md text-body-md font-semibold">
        {count} assets overdue for return — flagged for follow-up
      </p>
      <button
        aria-label="Dismiss"
        onClick={() => setOpen(false)}
        className="rounded-full p-1 transition-opacity hover:opacity-70"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}
