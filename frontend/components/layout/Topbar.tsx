"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, Search, Bell, Building2, Tags, User } from "lucide-react";
import { getUser } from "@/lib/auth";
import { api } from "@/lib/api";
import { initials, type Category, type Department, type Employee } from "@/lib/mock/org";

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const router = useRouter();
  const [userInitials, setUserInitials] = useState("");
  const [userName, setUserName] = useState("");

  // Search state
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<{ depts: Department[]; cats: Category[]; emps: Employee[] }>({
    depts: [],
    cats: [],
    emps: [],
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = () => {
      const u = getUser();
      if (u) {
        setUserInitials(initials(u.name));
        setUserName(u.name);
      }
    };
    load();
    window.addEventListener("storage", load);
    return () => window.removeEventListener("storage", load);
  }, []);

  async function ensureLoaded() {
    if (loaded) return;
    const [depts, cats, emps] = await Promise.all([
      api.listDepartments().catch(() => [] as Department[]),
      api.listCategories().catch(() => [] as Category[]),
      api.listEmployees().catch(() => [] as Employee[]),
    ]);
    setData({ depts, cats, emps });
    setLoaded(true);
  }

  const results = useMemo(() => {
    const ql = q.trim().toLowerCase();
    if (!ql) return { depts: [], cats: [], emps: [] };
    return {
      depts: data.depts.filter((d) => d.name.toLowerCase().includes(ql)).slice(0, 4),
      cats: data.cats.filter((c) => c.name.toLowerCase().includes(ql)).slice(0, 4),
      emps: data.emps
        .filter((e) => e.name.toLowerCase().includes(ql) || e.email.toLowerCase().includes(ql))
        .slice(0, 4),
    };
  }, [q, data]);

  const hasResults = results.depts.length + results.cats.length + results.emps.length > 0;

  function go(tab: string) {
    setOpen(false);
    setQ("");
    router.push(`/organization?tab=${tab}`);
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-sm border-b border-border-muted bg-surface px-md md:px-lg">
      <button
        aria-label="Toggle sidebar"
        onClick={onMenuClick}
        className="rounded-DEFAULT p-2 text-on-surface-variant transition-colors hover:bg-surface-container-low"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-on-surface-variant" />
        <input
          type="text"
          value={q}
          placeholder="Search assets, locations, users..."
          aria-label="Search"
          onFocus={() => {
            ensureLoaded();
            setOpen(true);
          }}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          className="w-full rounded-DEFAULT border border-border-muted bg-surface-container-lowest py-2 pl-10 pr-4 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant focus:border-indigo-accent focus:outline-none focus:ring-1 focus:ring-indigo-accent"
        />

        {open && q.trim() && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />
            <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-[60vh] overflow-y-auto rounded-DEFAULT border border-border-muted bg-surface py-1 shadow-lifted">
              {!hasResults && (
                <p className="px-4 py-3 font-body-sm text-body-sm text-on-surface-variant">No matches for “{q}”.</p>
              )}
              <SearchGroup label="Departments" icon={Building2} items={results.depts.map((d) => d.name)} onPick={() => go("departments")} />
              <SearchGroup label="Categories" icon={Tags} items={results.cats.map((c) => c.name)} onPick={() => go("categories")} />
              <SearchGroup
                label="Employees"
                icon={User}
                items={results.emps.map((e) => `${e.name} · ${e.email}`)}
                onPick={() => go("employees")}
              />
            </div>
          </>
        )}
      </div>

      {/* Actions + profile */}
      <div className="ml-auto flex items-center gap-xs">
        <button
          aria-label="Notifications"
          onClick={() => router.push("/notifications")}
          className="relative rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-low"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-status-critical ring-2 ring-surface" />
        </button>
        <button
          aria-label="Profile"
          title={userName}
          onClick={() => router.push("/profile")}
          className="ml-sm flex h-9 w-9 items-center justify-center rounded-full bg-deep-navy font-label-caps text-label-caps font-semibold text-white transition-opacity hover:opacity-90"
        >
          {userInitials || "··"}
        </button>
      </div>
    </header>
  );
}

function SearchGroup({
  label,
  icon: Icon,
  items,
  onPick,
}: {
  label: string;
  icon: typeof Building2;
  items: string[];
  onPick: () => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="border-b border-border-muted py-1 last:border-0">
      <p className="px-4 py-1 font-label-caps text-[10px] font-semibold uppercase text-on-surface-variant">{label}</p>
      {items.map((item, i) => (
        <button
          key={i}
          onClick={onPick}
          className="flex w-full items-center gap-sm px-4 py-2 text-left font-body-sm text-body-sm text-on-surface hover:bg-surface-container-low"
        >
          <Icon className="h-4 w-4 shrink-0 text-on-surface-variant" />
          <span className="truncate">{item}</span>
        </button>
      ))}
    </div>
  );
}
