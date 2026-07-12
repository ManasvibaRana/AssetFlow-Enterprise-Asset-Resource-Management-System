import Link from "next/link";
import {
  Plus,
  CalendarPlus,
  ClipboardList,
  Laptop,
  DoorOpen,
  CheckCircle2,
  Boxes,
} from "lucide-react";
import { OverdueAlert } from "@/components/dashboard/OverdueAlert";

const kpis = [
  { label: "Assets Available", value: 128, accent: "border-t-emerald-active" },
  { label: "Assets Allocated", value: 76, accent: "border-t-deep-navy" },
  { label: "Maintenance Today", value: 4, accent: "border-t-status-warning" },
  { label: "Active Bookings", value: 9, accent: "border-t-indigo-accent" },
  { label: "Pending Transfers", value: 3, accent: "border-t-indigo-accent" },
  { label: "Upcoming Returns", value: 12, accent: "border-t-indigo-accent" },
];

const activity = [
  { icon: Laptop, tint: "text-on-surface bg-surface-variant", tag: "AF-0114", text: "allocated to Priya Shah", pre: "Laptop", when: "10 mins ago" },
  { icon: DoorOpen, tint: "text-indigo-accent bg-indigo-accent/10", text: "Room B2 booking confirmed", when: "45 mins ago" },
  { icon: CheckCircle2, tint: "text-emerald-active bg-emerald-active/10", tag: "AF-0062", text: "maintenance resolved", pre: "Projector", when: "2 hours ago" },
  { icon: Boxes, tint: "text-on-surface bg-surface-variant", text: "New batch of 50 monitors registered", when: "Yesterday" },
];

const utilization = [
  { label: "Eng", pct: 85 },
  { label: "Fac", pct: 60 },
  { label: "Field", pct: 75 },
  { label: "IT", pct: 45 },
  { label: "HR", pct: 90 },
];

export default function DashboardPage() {
  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-lg p-lg md:p-xl">
      {/* Header + quick actions */}
      <div className="flex flex-col justify-between gap-md md:flex-row md:items-end">
        <div>
          <h1 className="mb-1 font-display-lg text-display-lg text-primary">Today&apos;s Overview</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Real-time snapshot of your asset ecosystem.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-sm">
          <button className="flex items-center gap-xs rounded-DEFAULT bg-deep-navy px-4 py-2 font-label-caps text-label-caps font-semibold text-white shadow-card transition-opacity hover:opacity-90">
            <Plus className="h-4 w-4" />
            Register Asset
          </button>
          <button className="flex items-center gap-xs rounded-DEFAULT border border-border-muted bg-surface px-4 py-2 font-label-caps text-label-caps font-semibold text-primary shadow-card transition-colors hover:bg-surface-container-low">
            <CalendarPlus className="h-4 w-4" />
            Book Resource
          </button>
          <button className="flex items-center gap-xs rounded-DEFAULT border border-border-muted bg-surface px-4 py-2 font-label-caps text-label-caps font-semibold text-primary shadow-card transition-colors hover:bg-surface-container-low">
            <ClipboardList className="h-4 w-4" />
            Raise Maintenance
          </button>
        </div>
      </div>

      {/* Overdue banner */}
      <OverdueAlert count={3} />

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-md md:grid-cols-3 lg:grid-cols-6">
        {kpis.map((k) => (
          <div
            key={k.label}
            className={`flex flex-col justify-between rounded-DEFAULT border border-border-muted border-t-2 bg-surface p-md shadow-card ${k.accent}`}
          >
            <p className="mb-sm font-label-caps text-label-caps font-semibold text-on-surface-variant">
              {k.label}
            </p>
            <p className="font-display-lg text-display-lg text-primary">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Lower grid */}
      <div className="grid flex-1 grid-cols-1 gap-lg lg:grid-cols-3">
        {/* Recent activity */}
        <div className="flex flex-col rounded-DEFAULT border border-border-muted bg-surface shadow-card">
          <div className="rounded-t-DEFAULT border-b border-border-muted bg-surface-subtle px-md py-sm">
            <h2 className="font-headline-sm text-headline-sm text-primary">Recent Activity</h2>
          </div>
          <ul className="flex-1 divide-y divide-border-muted">
            {activity.map((a, i) => {
              const Icon = a.icon;
              return (
                <li key={i} className="flex items-start gap-sm p-md transition-colors hover:bg-surface-container-low">
                  <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${a.tint}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-body-sm text-body-sm text-on-surface">
                      {a.pre ? `${a.pre} ` : ""}
                      {a.tag && <span className="font-mono-data text-mono-data">{a.tag}</span>}
                      {a.tag ? ` ${a.text}` : a.text}
                    </p>
                    <p className="mt-1 font-label-caps text-[10px] font-semibold text-on-surface-variant">
                      {a.when}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="border-t border-border-muted px-md py-sm text-center">
            <Link href="/notifications" className="font-label-caps text-label-caps font-semibold text-indigo-accent hover:underline">
              View All Log Entries
            </Link>
          </div>
        </div>

        {/* Utilization + pending audits */}
        <div className="grid grid-cols-1 gap-lg lg:col-span-2 md:grid-cols-2">
          {/* Utilization bars */}
          <div className="flex flex-col rounded-DEFAULT border border-border-muted bg-surface p-md shadow-card">
            <h2 className="mb-md font-headline-sm text-headline-sm text-primary">Utilization by Department</h2>
            <div className="relative flex flex-1 items-end justify-around gap-md border-b border-l border-border-muted pb-1 pl-1">
              <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
                <div className="h-0 w-full border-t border-border-muted/50" />
                <div className="h-0 w-full border-t border-border-muted/50" />
                <div className="h-0 w-full border-t border-border-muted/50" />
              </div>
              {utilization.map((u) => (
                <div key={u.label} className="flex w-full flex-col items-center gap-xs">
                  <div
                    className="w-8 rounded-t-DEFAULT bg-indigo-accent transition-all hover:opacity-80"
                    style={{ height: `${u.pct * 1.8}px` }}
                  />
                  <span className="font-label-caps text-[10px] font-semibold text-primary">{u.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pending audits */}
          <div className="flex flex-col rounded-DEFAULT border border-border-muted bg-surface shadow-card">
            <div className="flex items-center justify-between rounded-t-DEFAULT border-b border-border-muted bg-surface-container px-md py-sm">
              <h2 className="font-label-caps text-label-caps font-semibold text-primary">Pending Audits</h2>
              <span className="rounded-full bg-error-container px-2 py-0.5 text-[10px] font-bold text-on-error-container">
                2 Due
              </span>
            </div>
            <div className="flex-1 p-md">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-border-muted font-label-caps text-label-caps font-semibold text-primary">
                    <th className="pb-2">Location</th>
                    <th className="pb-2 text-right">Items</th>
                  </tr>
                </thead>
                <tbody className="font-body-sm text-body-sm">
                  {[
                    { loc: "Server Room A", items: 142 },
                    { loc: "Design Studio", items: 38 },
                  ].map((r) => (
                    <tr key={r.loc} className="group border-b border-border-muted/50 hover:bg-surface-container-low">
                      <td className="-ml-2 border-l-2 border-transparent py-2 pl-2 transition-all group-hover:border-indigo-accent">
                        {r.loc}
                      </td>
                      <td className="py-2 text-right font-mono-data text-mono-data">{r.items}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
