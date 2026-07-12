"use client";

import { Menu, Search, Bell, HelpCircle, Settings } from "lucide-react";

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-sm border-b border-border-muted bg-surface px-md md:px-lg">
      {/* Hamburger — collapses the rail on desktop, opens the drawer on mobile */}
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
          placeholder="Search assets, locations, users..."
          aria-label="Search"
          className="w-full rounded-DEFAULT border border-border-muted bg-surface-container-lowest py-2 pl-10 pr-4 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant focus:border-indigo-accent focus:outline-none focus:ring-1 focus:ring-indigo-accent"
        />
      </div>

      {/* Actions + profile */}
      <div className="ml-auto flex items-center gap-xs">
        <button
          aria-label="Notifications"
          className="relative rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-low"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-status-critical ring-2 ring-surface" />
        </button>
        <button
          aria-label="Help"
          className="hidden rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-low sm:inline-flex"
        >
          <HelpCircle className="h-5 w-5" />
        </button>
        <button
          aria-label="Settings"
          className="hidden rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-low sm:inline-flex"
        >
          <Settings className="h-5 w-5" />
        </button>
        <button
          aria-label="Profile"
          className="ml-sm flex h-9 w-9 items-center justify-center rounded-full bg-deep-navy font-label-caps text-label-caps font-semibold text-white"
        >
          MR
        </button>
      </div>
    </header>
  );
}
