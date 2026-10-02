"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  CalendarDays,
  Truck,
  Users,
  Settings,
  Bell,
  Search,
  LogOut
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

interface DesktopShellProps {
  children: React.ReactNode;
}

export function DesktopShell({ children }: DesktopShellProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  
  const userRole = (session?.user as any)?.role || "dispatcher";
  const userDepot = (session?.user as any)?.depot || "Peliyagoda";

  const NAV_ITEMS = [
    { label: "Operations", href: "/dispatcher", icon: <LayoutDashboard size={20} /> },
    { label: "Planning",   href: "/dispatcher/plan", icon: <CalendarDays size={20} /> },
    { label: "Control", href: "/dispatcher/operations", icon: <Users size={20} /> },
    { label: "Fleet",      href: "/dispatcher/fleet", icon: <Truck size={20} /> },
    { label: "Staff",      href: "/dispatcher/staff", icon: <Users size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-wp-canvas flex">
      {/* ── Left Nav Rail ── */}
      <aside className="nav-rail">
        <div className="px-6 py-6 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[7px] bg-wp-green flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="font-bold text-wp-ink text-[15px]">Waypoint Flow</span>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn("nav-item", isActive && "nav-item-active")}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-wp-border">
          <Link href="/dispatcher/settings" className="nav-item">
            <Settings size={20} />
            Settings
          </Link>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-[72px] bg-white border-b border-wp-border flex items-center justify-between px-8 sticky top-0 z-10 flex-shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-wp-ink">
              {NAV_ITEMS.find((n) => n.href === pathname)?.label || "Dashboard"}
            </h1>
            <div className="h-6 w-px bg-wp-border" />
            <span className="text-sm font-medium text-wp-muted">{userDepot} Depot</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-wp-muted" />
              <input
                type="text"
                placeholder="Search orders, trucks..."
                className="pl-9 pr-4 py-2 bg-wp-canvas border border-wp-border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-wp-action w-[240px]"
              />
            </div>

            <button className="relative text-wp-muted hover:text-wp-ink transition-colors">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-wp-pale text-wp-green flex items-center justify-center font-bold text-sm">
                {session?.user?.name?.charAt(0) || "D"}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-wp-ink leading-none">{session?.user?.name || "Dispatcher"}</span>
                <span className="text-xs text-wp-muted capitalize">{userRole.replace('_', ' ')}</span>
              </div>
              <button 
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="ml-2 text-wp-muted hover:text-red-500 transition-colors p-1"
                aria-label="Sign out"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-8 relative">
          {children}
        </main>
      </div>
    </div>
  );
}
