"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type Props = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: boolean;
  autoComplete?: string;
};

export function PasswordInput({ id, value, onChange, placeholder = "••••••••", error, autoComplete }: Props) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={error}
        className={
          "w-full rounded-DEFAULT border bg-surface px-md py-sm pr-10 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant transition focus:outline-none focus:ring-1 " +
          (error
            ? "border-error focus:border-error focus:ring-error"
            : "border-border-muted focus:border-indigo-accent focus:ring-indigo-accent")
        }
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-on-surface-variant transition-colors hover:text-primary"
        tabIndex={-1}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
