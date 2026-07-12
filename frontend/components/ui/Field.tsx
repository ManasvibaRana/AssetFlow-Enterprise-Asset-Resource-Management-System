import type { ReactNode } from "react";

type FieldProps = {
  label: string;
  htmlFor?: string;
  children: ReactNode;
  hint?: string;
  error?: string;
  className?: string;
};

/**
 * Form-field template: an uppercase caps label above a control, with optional
 * hint or error text below. Wrap any input/select/textarea in it for consistency.
 */
export function Field({ label, htmlFor, children, hint, error, className = "" }: FieldProps) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-xs block font-label-caps text-label-caps font-semibold uppercase text-on-surface-variant">
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-xs font-body-sm text-body-sm text-error">{error}</p>
      ) : hint ? (
        <p className="mt-xs font-body-sm text-xs text-on-surface-variant">{hint}</p>
      ) : null}
    </div>
  );
}
