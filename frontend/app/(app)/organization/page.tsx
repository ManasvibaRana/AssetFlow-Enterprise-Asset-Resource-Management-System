"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Tags, Users, DoorOpen, ShieldCheck, Lock } from "lucide-react";
import { DepartmentsTab } from "@/components/organization/DepartmentsTab";
import { CategoriesTab } from "@/components/organization/CategoriesTab";
import { EmployeesTab } from "@/components/organization/EmployeesTab";
import { ResourcesTab } from "@/components/organization/ResourcesTab";
import { getUser } from "@/lib/auth";

type TabKey = "departments" | "categories" | "resources" | "employees";

const TABS: { key: TabKey; label: string; icon: typeof Building2 }[] = [
  { key: "departments", label: "Departments", icon: Building2 },
  { key: "categories", label: "Categories", icon: Tags },
  { key: "resources", label: "Resources", icon: DoorOpen },
  { key: "employees", label: "Employee Directory", icon: Users },
];

const TAB_KEYS: TabKey[] = ["departments", "categories", "resources", "employees"];

export default function OrganizationPage() {
  const [tab, setTab] = useState<TabKey>("departments");
  const [checked, setChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsAdmin(getUser()?.role === "admin");
    setChecked(true);
    const t = new URLSearchParams(window.location.search).get("tab") as TabKey | null;
    if (t && TAB_KEYS.includes(t)) setTab(t);
  }, []);

  if (!checked) return null;

  if (!isAdmin) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-md p-xl text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-error-container">
          <Lock className="h-7 w-7 text-on-error-container" />
        </div>
        <h1 className="font-headline-md text-headline-md text-primary">Admin access required</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Organization Setup is restricted to administrators. Ask an admin to promote your account if you need access.
        </p>
        <Link
          href="/dashboard"
          className="mt-sm rounded-DEFAULT bg-deep-navy px-5 py-2 font-label-caps text-label-caps font-semibold text-white transition-opacity hover:opacity-90"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1440px] p-lg md:p-xl">
      {/* Header */}
      <div className="mb-lg flex flex-col justify-between gap-sm md:flex-row md:items-start">
        <div>
          <h1 className="font-display-lg text-display-lg text-primary">Organization Setup</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Maintain the master data everything else depends on.
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-deep-navy/5 px-3 py-1 font-label-caps text-label-caps font-semibold text-deep-navy">
          <ShieldCheck className="h-4 w-4" />
          Admin only
        </span>
      </div>

      {/* Tab bar */}
      <div className="mb-lg border-b border-border-muted">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={
                  "flex items-center gap-xs whitespace-nowrap border-b-2 px-4 py-3 font-label-caps text-label-caps font-semibold transition-colors " +
                  (active
                    ? "border-indigo-accent text-indigo-accent"
                    : "border-transparent text-on-surface-variant hover:text-primary")
                }
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      {tab === "departments" && <DepartmentsTab />}
      {tab === "categories" && <CategoriesTab />}
      {tab === "resources" && <ResourcesTab />}
      {tab === "employees" && <EmployeesTab />}
    </div>
  );
}
