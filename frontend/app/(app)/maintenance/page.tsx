import {
  SlidersHorizontal,
  Download,
  MoreHorizontal,
  CheckCircle2,
  User,
} from "lucide-react";

type Priority = "High" | "Medium" | "Low";

const priorityCls: Record<Priority, string> = {
  High: "bg-red-50 text-status-critical border-red-100",
  Medium: "bg-amber-50 text-status-warning border-amber-100",
  Low: "bg-emerald-50 text-emerald-active border-emerald-100",
};

type Card = {
  tag: string;
  asset: string;
  priority: Priority;
  issue: string;
  raised: string;
  assignee?: string;
  progress?: number;
  statusNote?: string;
  approvable?: boolean;
  resolved?: boolean;
};

// Columns follow the maintenance workflow:
// pending -> approved -> tech_assigned -> in_progress -> resolved.
const columns: { title: string; dim?: boolean; cards: Card[] }[] = [
  {
    title: "Pending Approval",
    cards: [
      { tag: "AF-0062", asset: "Projector", priority: "High", issue: "Bulb flickering", raised: "Oct 12", approvable: true },
      { tag: "AF-0120", asset: "Desk", priority: "Medium", issue: "Loose leg", raised: "Oct 14", approvable: true },
    ],
  },
  {
    title: "Approved / Waiting",
    cards: [
      { tag: "AF-0034", asset: "Laptop", priority: "High", issue: "Battery swell", raised: "Oct 10", statusNote: "Status: Under Maintenance" },
    ],
  },
  {
    title: "Technician Assigned",
    cards: [
      { tag: "AF-0876", asset: "HVAC", priority: "Medium", issue: "Regular servicing", raised: "Oct 15", assignee: "R. Verma" },
    ],
  },
  {
    title: "In Progress",
    cards: [
      { tag: "AF-0114", asset: "Dell Laptop", priority: "High", issue: "Keyboard replacement", raised: "Oct 13", assignee: "S. Gupta", progress: 60 },
    ],
  },
  {
    title: "Resolved",
    dim: true,
    cards: [
      { tag: "AF-0450", asset: "Chair", priority: "Low", issue: "Caster repair completed", raised: "Oct 16", resolved: true },
    ],
  },
];

function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={`rounded border px-1 py-0.5 font-label-caps text-[10px] ${priorityCls[priority]}`}>
      {priority}
    </span>
  );
}

export default function MaintenancePage() {
  return (
    <div className="flex flex-col">
      {/* Page header + actions */}
      <div className="flex flex-col justify-between gap-md border-b border-border-muted bg-surface px-lg py-lg sm:flex-row sm:items-end">
        <div>
          <h1 className="font-headline-md text-headline-md text-deep-navy">Maintenance Management</h1>
          <p className="mt-xs font-body-md text-body-md text-on-surface-variant">
            Approve and track enterprise asset repairs and scheduled servicing.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-sm">
          <button className="flex items-center gap-xs rounded-DEFAULT border border-border-muted bg-surface px-md py-1.5 font-body-sm text-body-sm text-deep-navy transition-colors hover:bg-surface-subtle">
            <SlidersHorizontal className="h-4 w-4" /> Filter by Priority
          </button>
          <button className="flex items-center gap-xs rounded-DEFAULT border border-border-muted bg-surface px-md py-1.5 font-body-sm text-body-sm text-deep-navy transition-colors hover:bg-surface-subtle">
            <Download className="h-4 w-4" /> Export Board
          </button>
          <button className="hidden rounded-DEFAULT bg-deep-navy px-md py-1.5 font-body-sm text-body-sm text-white transition-opacity hover:opacity-90 sm:block">
            Raise Maintenance Request
          </button>
        </div>
      </div>

      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto p-lg">
        <div className="flex min-w-max gap-md pb-lg">
          {columns.map((col) => (
            <div
              key={col.title}
              className={`flex w-[320px] flex-col rounded-DEFAULT border border-border-muted bg-surface-subtle ${col.dim ? "opacity-75" : ""}`}
            >
              <div className="flex items-center justify-between rounded-t-DEFAULT border-b border-border-muted bg-surface-container-low p-sm">
                <h2 className="flex items-center gap-xs font-label-caps text-label-caps font-semibold text-deep-navy">
                  {col.title}
                  <span className="rounded-full bg-surface-container-high px-1.5 py-0.5 text-on-surface-variant">{col.cards.length}</span>
                </h2>
                <button aria-label="Column options" className="text-on-surface-variant hover:text-deep-navy">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>

              <div className="flex flex-1 flex-col gap-sm p-sm">
                {col.cards.map((card) => (
                  <div
                    key={card.tag}
                    className={`group relative rounded border border-border-muted p-sm shadow-card transition-colors ${
                      card.resolved
                        ? "bg-surface-container-lowest"
                        : "cursor-grab bg-surface hover:border-indigo-accent"
                    }`}
                  >
                    <div className="mb-xs flex items-start justify-between">
                      <span className={`font-mono-data text-mono-data ${card.resolved ? "text-on-surface-variant line-through" : "text-deep-navy"}`}>
                        {card.tag} {card.asset}
                      </span>
                      <PriorityBadge priority={card.priority} />
                    </div>

                    <p className={`font-body-sm text-body-sm ${card.resolved ? "text-on-surface-variant" : "text-on-surface"} ${card.statusNote || card.progress ? "" : "mb-sm"}`}>
                      {card.issue}
                    </p>

                    {card.statusNote && (
                      <div className="mb-sm">
                        <span className="mt-1 inline-block rounded border border-amber-200/50 bg-amber-100/50 px-1 py-0.5 font-label-caps text-[9px] text-status-warning">
                          {card.statusNote}
                        </span>
                      </div>
                    )}

                    {card.progress !== undefined && (
                      <div className="mb-sm mt-sm">
                        <div className="mb-1 flex justify-between font-body-sm text-[10px] text-on-surface-variant">
                          <span>Progress</span>
                          <span>{card.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-surface-container-high">
                          <div className="h-1.5 rounded-full bg-indigo-accent" style={{ width: `${card.progress}%` }} />
                        </div>
                      </div>
                    )}

                    <div className={`flex items-center justify-between ${card.assignee && !card.progress ? "mt-sm border-t border-surface-container-high pt-xs" : ""}`}>
                      {card.resolved ? (
                        <span className="flex items-center gap-1 font-body-sm text-[11px] text-emerald-active">
                          <CheckCircle2 className="h-3 w-3" /> Done {card.raised}
                        </span>
                      ) : (
                        <>
                          {card.assignee ? (
                            <div className="flex items-center gap-1">
                              <User className="h-3.5 w-3.5 text-on-surface-variant" />
                              <span className="font-body-sm text-[11px] text-deep-navy">{card.assignee}</span>
                            </div>
                          ) : (
                            <span className="font-body-sm text-[11px] text-on-surface-variant">Raised: {card.raised}</span>
                          )}
                          {card.statusNote && (
                            <button className="font-body-sm text-[11px] font-medium text-indigo-accent hover:underline">Assign Tech</button>
                          )}
                          {card.assignee && !card.progress && (
                            <span className="font-body-sm text-[11px] text-on-surface-variant">Raised: {card.raised}</span>
                          )}
                        </>
                      )}
                    </div>

                    {/* Hover action for pending cards — the approval step that flips the asset to Under Maintenance */}
                    {card.approvable && (
                      <div className="absolute inset-0 hidden items-center justify-center rounded border border-indigo-200 bg-indigo-50/90 backdrop-blur-[1px] group-hover:flex">
                        <button className="flex items-center gap-1 rounded border border-indigo-200 bg-surface px-2 py-1 font-body-sm text-[12px] font-medium text-indigo-accent shadow-card hover:bg-indigo-50">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Approve &amp; Move
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
