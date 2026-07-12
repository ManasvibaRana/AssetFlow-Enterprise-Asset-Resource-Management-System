"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  CalendarPlus,
  ClipboardList,
  AlertTriangle,
  X,
  Building2,
  Tags,
  UserPlus,
  UserCog,
  Bell,
  type LucideIcon,
} from "lucide-react";
import { api, type Asset, type AppNotification } from "@/lib/api";
import type { Category } from "@/lib/mock/org";

const NOTIF_ICON: Record<string, { icon: LucideIcon; tint: string }> = {
  role: { icon: UserCog, tint: "bg-indigo-accent/10 text-indigo-accent" },
  employee: { icon: UserPlus, tint: "bg-emerald-active/10 text-emerald-active" },
  category: { icon: Tags, tint: "bg-status-warning/10 text-status-warning" },
  department: { icon: Building2, tint: "bg-deep-navy/10 text-deep-navy" },
  info: { icon: Bell, tint: "bg-surface-variant text-on-surface-variant" },
};

function relativeTime(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  return days < 7 ? `${days} day${days === 1 ? "" : "s"} ago` : new Date(iso).toLocaleDateString();
}

export default function DashboardPage() {
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [notifs, setNotifs] = useState<AppNotification[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    Promise.all([
      api.listAssets().catch(() => [] as Asset[]),
      api.listNotifications().catch(() => [] as AppNotification[]),
      api.listCategories().catch(() => [] as Category[]),
    ])
      .then(([a, n, c]) => {
        setAssets(a);
        setNotifs(n);
        setCategories(c);
      })
      .finally(() => setLoading(false));
  }, []);

  const kpis = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let upcoming = 0;
    let overdue = 0;
    for (const a of assets) {
      // allocated with no active allocation in payload => its allocation is overdue
      if (a.status === "allocated" && !a.active_allocation) overdue++;
      const ret = a.active_allocation?.expected_return_date;
      if (ret && new Date(ret) >= today) upcoming++;
    }
    const by = (s: string) => assets.filter((a) => a.status === s).length;
    return {
      total: assets.length,
      available: by("available"),
      allocated: by("allocated"),
      maintenance: by("under_maintenance"),
      upcoming,
      overdue,
    };
  }, [assets]);

  const byCategory = useMemo(() => {
    const catMap = new Map(categories.map((c) => [c.id, c.name]));
    const counts = new Map<string, number>();
    for (const a of assets) {
      const label = a.category_id ? catMap.get(a.category_id) ?? "Other" : "Uncategorized";
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((x, y) => y.value - x.value)
      .slice(0, 6);
  }, [assets, categories]);
  const maxCount = Math.max(1, ...byCategory.map((c) => c.value));

  const cards = [
    { label: "Assets Available", value: kpis.available, accent: "border-t-emerald-active" },
    { label: "Assets Allocated", value: kpis.allocated, accent: "border-t-deep-navy" },
    { label: "Under Maintenance", value: kpis.maintenance, accent: "border-t-status-warning" },
    { label: "Upcoming Returns", value: kpis.upcoming, accent: "border-t-indigo-accent" },
    { label: "Overdue Returns", value: kpis.overdue, accent: "border-t-status-critical" },
    { label: "Total Assets", value: kpis.total, accent: "border-t-indigo-accent" },
  ];

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-lg p-lg md:p-xl">
      {/* Header + quick actions */}
      <div className="flex flex-col justify-between gap-md md:flex-row md:items-end">
        <div>
          <h1 className="mb-1 font-display-lg text-display-lg text-primary">Today&apos;s Overview</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">Real-time snapshot of your asset ecosystem.</p>
        </div>
        <div className="flex flex-wrap items-center gap-sm">
          <button onClick={() => router.push("/assets")} className="flex items-center gap-xs rounded-DEFAULT bg-deep-navy px-4 py-2 font-label-caps text-label-caps font-semibold text-white shadow-card transition-opacity hover:opacity-90">
            <Plus className="h-4 w-4" />
            Register Asset
          </button>
          <button onClick={() => router.push("/booking")} className="flex items-center gap-xs rounded-DEFAULT border border-border-muted bg-surface px-4 py-2 font-label-caps text-label-caps font-semibold text-primary shadow-card transition-colors hover:bg-surface-container-low">
            <CalendarPlus className="h-4 w-4" />
            Book Resource
          </button>
          <button onClick={() => router.push("/maintenance")} className="flex items-center gap-xs rounded-DEFAULT border border-border-muted bg-surface px-4 py-2 font-label-caps text-label-caps font-semibold text-primary shadow-card transition-colors hover:bg-surface-container-low">
            <ClipboardList className="h-4 w-4" />
            Raise Maintenance
          </button>
        </div>
      </div>

      {/* Overdue banner (dynamic) */}
      {!loading && kpis.overdue > 0 && !bannerDismissed && (
        <div className="flex items-center gap-md rounded-DEFAULT border border-status-critical/20 bg-error-container p-md text-on-error-container">
          <AlertTriangle className="h-5 w-5 shrink-0 text-status-critical" />
          <p className="flex-1 font-body-md text-body-md font-semibold">
            {kpis.overdue} asset{kpis.overdue === 1 ? "" : "s"} overdue for return — flagged for follow-up
          </p>
          <button aria-label="Dismiss" onClick={() => setBannerDismissed(true)} className="rounded-full p-1 hover:opacity-70">
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-md md:grid-cols-3 lg:grid-cols-6">
        {cards.map((k) => (
          <div key={k.label} className={`flex flex-col justify-between rounded-DEFAULT border border-border-muted border-t-2 bg-surface p-md shadow-card ${k.accent}`}>
            <p className="mb-sm font-label-caps text-label-caps font-semibold text-on-surface-variant">{k.label}</p>
            <p className="font-display-lg text-display-lg text-primary">{loading ? "—" : k.value}</p>
          </div>
        ))}
      </div>

      {/* Lower grid */}
      <div className="grid flex-1 grid-cols-1 gap-lg lg:grid-cols-3">
        {/* Recent activity (from notifications) */}
        <div className="flex flex-col rounded-DEFAULT border border-border-muted bg-surface shadow-card">
          <div className="rounded-t-DEFAULT border-b border-border-muted bg-surface-subtle px-md py-sm">
            <h2 className="font-headline-sm text-headline-sm text-primary">Recent Activity</h2>
          </div>
          <ul className="flex-1 divide-y divide-border-muted">
            {loading && <li className="p-md font-body-sm text-body-sm text-on-surface-variant">Loading…</li>}
            {!loading && notifs.length === 0 && <li className="p-md font-body-sm text-body-sm text-on-surface-variant">No recent activity.</li>}
            {notifs.slice(0, 5).map((n) => {
              const meta = NOTIF_ICON[n.type] ?? NOTIF_ICON.info;
              const Icon = meta.icon;
              return (
                <li key={n.id} className="flex items-start gap-sm p-md transition-colors hover:bg-surface-container-low">
                  <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${meta.tint}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-body-sm text-body-sm text-on-surface">{n.message}</p>
                    <p className="mt-1 font-label-caps text-[10px] font-semibold text-on-surface-variant">{relativeTime(n.createdAt)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="border-t border-border-muted px-md py-sm text-center">
            <button onClick={() => router.push("/notifications")} className="font-label-caps text-label-caps font-semibold text-indigo-accent hover:underline">
              View All Log Entries
            </button>
          </div>
        </div>

        {/* Assets by category (from real data) */}
        <div className="flex flex-col rounded-DEFAULT border border-border-muted bg-surface p-md shadow-card lg:col-span-2">
          <h2 className="mb-md font-headline-sm text-headline-sm text-primary">Assets by Category</h2>
          {byCategory.length === 0 ? (
            <div className="flex flex-1 items-center justify-center py-10 font-body-sm text-body-sm text-on-surface-variant">
              {loading ? "Loading…" : "No assets registered yet."}
            </div>
          ) : (
            <div className="flex flex-1 items-end justify-around gap-md border-b border-l border-border-muted pb-1 pl-1 pt-md">
              {byCategory.map((c) => (
                <div key={c.label} className="flex h-full w-full flex-col items-center justify-end gap-xs">
                  <span className="font-label-caps text-[11px] font-semibold text-on-surface-variant">{c.value}</span>
                  <div
                    className="w-10 rounded-t-DEFAULT bg-indigo-accent transition-all hover:opacity-80"
                    style={{ height: `${(c.value / maxCount) * 180}px` }}
                  />
                  <span className="max-w-[64px] truncate font-label-caps text-[10px] font-semibold text-primary" title={c.label}>
                    {c.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
