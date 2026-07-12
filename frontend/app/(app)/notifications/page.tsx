"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Building2,
  Tags,
  UserPlus,
  UserCog,
  CheckCheck,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { api, ApiError, type AppNotification } from "@/lib/api";

const TYPE_META: Record<string, { icon: LucideIcon; tint: string }> = {
  role: { icon: UserCog, tint: "bg-indigo-accent/10 text-indigo-accent" },
  employee: { icon: UserPlus, tint: "bg-emerald-active/10 text-emerald-active" },
  category: { icon: Tags, tint: "bg-status-warning/10 text-status-warning" },
  department: { icon: Building2, tint: "bg-deep-navy/10 text-deep-navy" },
  info: { icon: Bell, tint: "bg-surface-variant text-on-surface-variant" },
};

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString();
}

export default function NotificationsPage() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    api
      .listNotifications()
      .then(setItems)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load notifications."))
      .finally(() => setLoading(false));
  }, []);

  const unreadCount = items.filter((n) => !n.isRead).length;
  const visible = useMemo(() => (filter === "unread" ? items.filter((n) => !n.isRead) : items), [items, filter]);

  async function markRead(n: AppNotification) {
    if (n.isRead) return;
    setItems((list) => list.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
    try {
      await api.markNotificationRead(n.id);
    } catch {
      /* revert on failure */
      setItems((list) => list.map((x) => (x.id === n.id ? { ...x, isRead: false } : x)));
    }
  }

  async function markAll() {
    setItems((list) => list.map((x) => ({ ...x, isRead: true })));
    try {
      await api.markAllNotificationsRead();
    } catch {
      /* best effort */
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl p-lg md:p-xl">
      <div className="mb-lg flex flex-wrap items-end justify-between gap-md">
        <div>
          <h1 className="flex items-center gap-sm font-display-lg text-display-lg text-primary">
            Notifications
            {unreadCount > 0 && (
              <span className="rounded-full bg-status-critical px-2 py-0.5 font-label-caps text-[11px] font-bold text-white">
                {unreadCount} new
              </span>
            )}
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">Recent activity across your workspace.</p>
        </div>
        <button
          onClick={markAll}
          disabled={unreadCount === 0}
          className="flex items-center gap-xs rounded-DEFAULT border border-border-muted bg-surface px-4 py-2 font-label-caps text-label-caps font-semibold text-primary transition-colors hover:bg-surface-container-low disabled:opacity-50"
        >
          <CheckCheck className="h-4 w-4" />
          Mark all read
        </button>
      </div>

      {/* Filter */}
      <div className="mb-md flex gap-1 border-b border-border-muted">
        {(["all", "unread"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={
              "border-b-2 px-4 py-2 font-label-caps text-label-caps font-semibold capitalize transition-colors " +
              (filter === f
                ? "border-indigo-accent text-indigo-accent"
                : "border-transparent text-on-surface-variant hover:text-primary")
            }
          >
            {f}
            {f === "unread" && unreadCount > 0 ? ` (${unreadCount})` : ""}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-sm py-12 text-on-surface-variant">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="font-body-sm text-body-sm">Loading…</span>
        </div>
      ) : error ? (
        <div className="rounded-DEFAULT border border-status-critical/20 bg-error-container px-4 py-3 font-body-sm text-body-sm text-on-error-container">
          {error}
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center gap-sm py-16 text-on-surface-variant">
          <Bell className="h-8 w-8 opacity-40" />
          <p className="font-body-sm text-body-sm">{filter === "unread" ? "You're all caught up." : "No notifications yet."}</p>
        </div>
      ) : (
        <ul className="overflow-hidden rounded-DEFAULT border border-border-muted bg-surface">
          {visible.map((n) => {
            const meta = TYPE_META[n.type] ?? TYPE_META.info;
            const Icon = meta.icon;
            return (
              <li key={n.id}>
                <button
                  onClick={() => markRead(n)}
                  className={
                    "flex w-full items-start gap-md border-b border-border-muted/60 px-md py-4 text-left transition-colors last:border-0 hover:bg-surface-container-low " +
                    (n.isRead ? "" : "bg-indigo-accent/[0.04]")
                  }
                >
                  <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${meta.tint}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="flex-1">
                    <p className={"font-body-md text-body-md " + (n.isRead ? "text-on-surface-variant" : "font-semibold text-primary")}>
                      {n.message}
                    </p>
                    <p className="mt-0.5 font-label-caps text-[11px] font-semibold text-on-surface-variant">
                      {relativeTime(n.createdAt)}
                    </p>
                  </div>
                  {!n.isRead && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-indigo-accent" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
