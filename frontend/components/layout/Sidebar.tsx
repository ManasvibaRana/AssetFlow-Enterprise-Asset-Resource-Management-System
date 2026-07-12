"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Plus, LifeBuoy, LogOut, X } from "lucide-react";
import { navItems } from "@/lib/nav";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { clearSession } from "@/lib/auth";

type SidebarProps = {
  mobileOpen?: boolean;
  collapsed?: boolean;
  onClose?: () => void;
};

export function Sidebar({ mobileOpen = false, collapsed = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  function signOut() {
    clearSession();
    router.push("/login");
  }

  return (
    <nav
      className={
        "fixed left-0 top-0 z-40 flex h-screen w-[280px] flex-col bg-deep-navy py-lg text-white transition-transform duration-200 " +
        // Mobile: drawer controlled by mobileOpen.
        (mobileOpen ? "translate-x-0 " : "-translate-x-full ") +
        // Desktop: collapsed fully hides it off-canvas, otherwise it's pinned open.
        (collapsed ? "md:-translate-x-full" : "md:translate-x-0")
      }
    >
      {/* Brand + close */}
      <div className="flex items-center justify-between px-lg pb-lg">
        <Logo variant="light" />
        <button
          aria-label="Close menu"
          onClick={onClose}
          className="rounded-full p-1 text-slate-300 hover:bg-white/10 hover:text-white md:hidden"
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
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              aria-current={active ? "page" : undefined}
              className={
                "flex items-center gap-md rounded-DEFAULT py-2 pr-md font-label-caps text-label-caps font-semibold transition-colors " +
                (active
                  ? "border-l-2 border-indigo-accent bg-white/10 pl-[14px] text-white"
                  : "border-l-2 border-transparent pl-[14px] text-slate-300 hover:bg-white/5 hover:text-white")
              }
            >
              <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-md space-y-1 border-t border-white/10 px-sm pt-md">
        <ThemeToggle />
        <Link
          href="#"
          className="flex items-center gap-md rounded-DEFAULT py-2 pl-[14px] pr-md font-label-caps text-label-caps font-semibold text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
        >
          <LifeBuoy className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
          <span>Support</span>
        </Link>
        <button
          onClick={signOut}
          className="flex w-full items-center gap-md rounded-DEFAULT py-2 pl-[14px] pr-md font-label-caps text-label-caps font-semibold text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
          <span>Sign Out</span>
        </button>
      </div>
    </nav>
  );
}
