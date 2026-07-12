import {
  LayoutDashboard,
  Building2,
  Package,
  ArrowLeftRight,
  CalendarCheck2,
  Wrench,
  ClipboardCheck,
  BarChart3,
  Bell,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
};

// The single source of truth for the sidebar. Mirrors the 10 product screens.
export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Organization Setup", href: "/organization", icon: Building2, adminOnly: true },
  { label: "Assets", href: "/assets", icon: Package },
  { label: "Allocation & Transfer", href: "/allocation", icon: ArrowLeftRight },
  { label: "Resource Booking", href: "/booking", icon: CalendarCheck2 },
  { label: "Maintenance", href: "/maintenance", icon: Wrench },
  { label: "Audit", href: "/audit", icon: ClipboardCheck },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Notifications", href: "/notifications", icon: Bell },
];
