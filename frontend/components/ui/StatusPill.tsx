import type { Status } from "@/lib/mock/org";

const STYLES: Record<Status, string> = {
  active: "bg-emerald-active/10 text-emerald-active",
  inactive: "bg-surface-variant text-on-surface-variant",
  on_leave: "bg-status-warning/10 text-status-warning",
};

const LABELS: Record<Status, string> = {
  active: "Active",
  inactive: "Inactive",
  on_leave: "On Leave",
};

export function StatusPill({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-label-caps text-[11px] font-semibold ${STYLES[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {LABELS[status]}
    </span>
  );
}
