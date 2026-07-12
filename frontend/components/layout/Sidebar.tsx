"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, LifeBuoy, LogOut, X } from "lucide-react";
import { navItems } from "@/lib/nav";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

type SidebarProps = {
  mobileOpen?: boolean;
  collapsed?: boolean;
  onClose?: () => void;
};

export function Sidebar({ mobileOpen = false, collapsed = false, onClose }: SidebarProps) {
  const pathname = usePathname();

  // When collapsed, labels are fully hidden and fade back in on hover-expand.
  const labelCls = collapsed
    ? "opacity-0 transition-opacity duration-150 group-hover:opacity-100"
    : "";

  return (
    <nav
      className={
        "group fixed left-0 top-0 z-40 flex h-screen w-[280px] flex-col overflow-hidden bg-deep-navy py-lg text-white transition-[transform,width] duration-200 md:translate-x-0 " +
        (mobileOpen ? "translate-x-0 " : "-translate-x-full ") +
        (collapsed ? "md:w-[72px] md:hover:w-[280px]" : "md:w-[280px]")
      }
    >
      {/* Brand + mobile close */}
      <div className="flex items-center justify-between px-lg pb-lg">
        <Logo variant="light" textClassName={labelCls} />
        <button
          aria-label="Close menu"
          onClick={onClose}
          className={"rounded-full p-1 text-slate-300 hover:bg-white/10 hover:text-white md:hidden " + labelCls}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Primary action */}
      <div className="px-md pb-md">
        <Link
          href="/assets"
          onClick={onClose}
          title="Register Asset"
          className="flex w-full items-center justify-center gap-xs whitespace-nowrap rounded-DEFAULT bg-emerald-active py-2 font-label-caps text-label-caps font-semibold text-white transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4 shrink-0" />
          <span className={labelCls}>Register Asset</span>
        </Link>
      </div>

      {/* Navigation */}
      <div className="scroll-slim flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-sm">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              aria-current={active ? "page" : undefined}
              title={item.label}
              className={
                "flex items-center gap-md whitespace-nowrap rounded-DEFAULT py-2 pr-md font-label-caps text-label-caps font-semibold transition-colors " +
                (active
                  ? "border-l-2 border-indigo-accent bg-white/10 pl-[14px] text-white"
                  : "border-l-2 border-transparent pl-[14px] text-slate-300 hover:bg-white/5 hover:text-white")
              }
            >
              <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
              <span className={labelCls}>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-md space-y-1 border-t border-white/10 px-sm pt-md">
        <ThemeToggle labelClassName={labelCls} />
        <Link
          href="#"
          title="Support"
          className="flex items-center gap-md whitespace-nowrap rounded-DEFAULT py-2 pl-[14px] pr-md font-label-caps text-label-caps font-semibold text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
        >
          <LifeBuoy className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
          <span className={labelCls}>Support</span>
        </Link>
        <Link
          href="/login"
          title="Sign Out"
          className="flex items-center gap-md whitespace-nowrap rounded-DEFAULT py-2 pl-[14px] pr-md font-label-caps text-label-caps font-semibold text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
          <span className={labelCls}>Sign Out</span>
        </Link>
      </div>
    </nav>
  );
}
