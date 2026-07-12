"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("sidebarCollapsed") === "1") setCollapsed(true);
  }, []);

  // On desktop the hamburger collapses the rail; on mobile it opens the drawer.
  function handleMenu() {
    if (window.matchMedia("(min-width: 768px)").matches) {
      setCollapsed((prev) => {
        const next = !prev;
        localStorage.setItem("sidebarCollapsed", next ? "1" : "0");
        return next;
      });
    } else {
      setMobileOpen(true);
    }
  }

  return (
    <div className="min-h-screen bg-surface-subtle">
      <Sidebar mobileOpen={mobileOpen} collapsed={collapsed} onClose={() => setMobileOpen(false)} />

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          aria-hidden="true"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div
        className={
          "flex min-h-screen flex-col transition-[margin] duration-200 " +
          (collapsed ? "md:ml-[72px]" : "md:ml-[280px]")
        }
      >
        <Topbar onMenuClick={handleMenu} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
