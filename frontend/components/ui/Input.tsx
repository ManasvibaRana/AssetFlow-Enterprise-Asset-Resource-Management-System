import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

type Tone = "default" | "warning" | "error";

const toneCls: Record<Tone, string> = {
  default: "border-border-muted focus:border-indigo-accent focus:ring-indigo-accent",
  warning: "border-status-warning bg-status-warning/5 focus:ring-status-warning",
  error: "border-error focus:border-error focus:ring-error",
};

const base =
  "w-full rounded-DEFAULT border px-sm py-sm font-body-sm text-body-sm text-on-surface outline-none transition-colors focus:ring-1";

type InputProps = InputHTMLAttributes<HTMLInputElement> & { tone?: Tone };

/** Styled text/date/time input. Pass `tone="warning"` to flag a conflict state. */
export function Input({ tone = "default", readOnly, className = "", ...props }: InputProps) {
  const readOnlyCls = readOnly ? "cursor-not-allowed bg-surface-subtle text-on-surface-variant" : "";
  return <input readOnly={readOnly} className={`${base} ${toneCls[tone]} ${readOnlyCls} ${className}`} {...props} />;
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { tone?: Tone };

/** Styled multi-line input sharing the same tokens as {@link Input}. */
export function Textarea({ tone = "default", className = "", ...props }: TextareaProps) {
  return <textarea className={`${base} resize-none ${toneCls[tone]} ${className}`} {...props} />;
}
