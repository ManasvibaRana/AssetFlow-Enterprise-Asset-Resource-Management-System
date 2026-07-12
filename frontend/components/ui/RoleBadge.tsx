import { ROLE_LABELS, type Role } from "@/lib/mock/org";

const STYLES: Record<Role, string> = {
  admin: "bg-deep-navy text-white",
  asset_manager: "bg-indigo-accent/10 text-indigo-accent",
  dept_head: "bg-emerald-active/10 text-emerald-active",
  employee: "bg-surface-variant text-on-surface-variant",
};

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span
      className={`inline-flex items-center rounded-DEFAULT px-2 py-0.5 font-label-caps text-[11px] font-semibold ${STYLES[role]}`}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}
