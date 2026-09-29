"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Package, ListTodo, LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

interface LoaderShellProps {
  children: React.ReactNode;
}

export function LoaderShell({ children }: LoaderShellProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  
  const userName = (session?.user as any)?.name || "Loader";
  const userDepot = (session?.user as any)?.depot || "Peliyagoda";

  return (
    <div className="min-h-screen bg-wp-canvas flex flex-col">
      {/* ── Top Nav Bar for Tablet ── */}
      <header className="h-[72px] bg-wp-ink flex items-center justify-between px-6 flex-shrink-0 text-white">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[7px] bg-wp-green flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="font-bold text-[17px] tracking-wide hidden sm:inline-block">Waypoint Flow</span>
          </div>

          <nav className="flex items-center gap-2 ml-4">
            <Link
              href="/loader"
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md font-semibold transition-colors",
                pathname === "/loader" ? "bg-white/20 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <ListTodo size={20} />
              Load Board
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-bold">{userName}</div>
            <div className="text-xs text-white/70">{userDepot} Depot • Loading Floor</div>
          </div>
          <button 
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-md transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* ── Main Content Area ── */}
      <main className="flex-1 flex flex-col min-h-0 overflow-auto">
        {children}
      </main>
    </div>
  );
}
