"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { isAuthed } from "@/lib/auth";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Session guard: authenticated pages require a token.
  useEffect(() => {
    if (!isAuthed()) {
      router.replace("/login");
    } else {
      setReady(true);
    }
  }, [router]);

  useEffect(() => {
    if (localStorage.getItem("sidebarCollapsed") === "1") setCollapsed(true);
  }, []);

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

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-surface-subtle">
      <Sidebar mobileOpen={mobileOpen} collapsed={collapsed} onClose={() => setMobileOpen(false)} />

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
          (collapsed ? "md:ml-0" : "md:ml-[280px]")
        }
      >
        <Topbar onMenuClick={handleMenu} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
