"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Plus, LogOut, X } from "lucide-react";
import { navItems } from "@/lib/nav";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { clearSession, getUser } from "@/lib/auth";

type SidebarProps = {
  mobileOpen?: boolean;
  collapsed?: boolean;
  onClose?: () => void;
};

// Shared row style — light surface in light mode, navy in dark mode.
const inactiveRow =
  "text-on-surface-variant hover:bg-surface-container-high hover:text-primary dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white";

export function Sidebar({ mobileOpen = false, collapsed = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsAdmin(getUser()?.role === "admin");
  }, []);

  // Admin-only items stay hidden until we've confirmed the user is an admin.
  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  function signOut() {
    clearSession();
    router.push("/login");
  }

  return (
    <nav
      className={
        "fixed left-0 top-0 z-40 flex h-screen w-[280px] flex-col border-r border-border-muted bg-surface py-lg text-on-surface transition-transform duration-200 dark:border-white/10 dark:bg-deep-navy dark:text-white " +
        (mobileOpen ? "translate-x-0 " : "-translate-x-full ") +
        (collapsed ? "md:-translate-x-full" : "md:translate-x-0")
      }
    >
      {/* Brand + close */}
      <div className="flex items-center justify-between px-lg pb-lg">
        <Logo variant="adaptive" />
        <button
          aria-label="Close menu"
          onClick={onClose}
          className={"rounded-full p-1 md:hidden " + inactiveRow}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Primary action */}
      <div className="px-md pb-md">
        <Link
          href="/assets"
          onClick={onClose}
          className="flex w-full items-center justify-center gap-xs rounded-DEFAULT bg-emerald-active py-2 font-label-caps text-label-caps font-semibold text-white transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Register Asset
        </Link>
      </div>

      {/* Navigation */}
      <div className="scroll-slim flex-1 space-y-1 overflow-y-auto px-sm">
        {visibleItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              aria-current={active ? "page" : undefined}
              className={
                "flex items-center gap-md rounded-DEFAULT border-l-2 py-2 pl-[14px] pr-md font-label-caps text-label-caps font-semibold transition-colors " +
                (active
                  ? "border-indigo-accent bg-indigo-accent/10 text-indigo-accent dark:bg-white/10 dark:text-white"
                  : "border-transparent " + inactiveRow)
              }
            >
              <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-md space-y-1 border-t border-border-muted px-sm pt-md dark:border-white/10">
        <ThemeToggle />
        <button onClick={signOut} className={"flex w-full items-center gap-md rounded-DEFAULT py-2 pl-[14px] pr-md font-label-caps text-label-caps font-semibold " + inactiveRow}>
          <LogOut className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
          <span>Sign Out</span>
        </button>
      </div>
    </nav>
  );
}
