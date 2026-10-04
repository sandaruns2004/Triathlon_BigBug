"use client";

import { usePathname } from "next/navigation";
import { LogOut, Navigation, User, RefreshCw } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

interface DriverShellProps {
  children: React.ReactNode;
}

export function DriverShell({ children }: DriverShellProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  
  const userName = (session?.user as any)?.name || "Driver";

  return (
    <div className="min-h-screen bg-wp-pale flex flex-col font-sans">
      {/* ── Top Nav Bar for Mobile ── */}
      <header className="h-16 bg-wp-ink flex items-center justify-between px-4 text-white sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-[7px] bg-wp-green flex items-center justify-center">
            <Navigation size={18} className="text-white fill-white -rotate-45" />
          </div>
          <span className="font-bold text-[17px] tracking-wide">Waypoint Driver</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold truncate max-w-[100px]">{userName}</span>
          <button 
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-md transition-colors"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* ── Main Content Area ── */}
      <main className="flex-1 flex flex-col w-full max-w-md mx-auto bg-wp-canvas shadow-xl relative pb-20 overflow-x-hidden">
        {children}
      </main>

      {/* ── Bottom Navigation ── */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-wp-border pb-safe max-w-md mx-auto z-50">
        <div className="flex justify-around items-center h-16">
          <Link href="/driver" className={`flex flex-col items-center justify-center w-full h-full gap-1 ${pathname === "/driver" ? "text-wp-action" : "text-wp-muted"}`}>
            <Navigation size={22} className={pathname === "/driver" ? "fill-wp-action" : ""} />
            <span className="text-[10px] font-bold">Today</span>
          </Link>
          <Link href="/driver/sync" className={`flex flex-col items-center justify-center w-full h-full gap-1 ${pathname === "/driver/sync" ? "text-wp-action" : "text-wp-muted"}`}>
            <RefreshCw size={22} />
            <span className="text-[10px] font-bold">Sync</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
