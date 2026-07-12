"use client";

import { useState } from "react";
import { Building2, Tags, Users, ShieldCheck } from "lucide-react";
import { DepartmentsTab } from "@/components/organization/DepartmentsTab";
import { CategoriesTab } from "@/components/organization/CategoriesTab";
import { EmployeesTab } from "@/components/organization/EmployeesTab";

type TabKey = "departments" | "categories" | "employees";

const TABS: { key: TabKey; label: string; icon: typeof Building2 }[] = [
  { key: "departments", label: "Departments", icon: Building2 },
  { key: "categories", label: "Categories", icon: Tags },
  { key: "employees", label: "Employee Directory", icon: Users },
];

export default function OrganizationPage() {
  const [tab, setTab] = useState<TabKey>("departments");

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
      {tab === "employees" && <EmployeesTab />}
    </div>
  );
}
