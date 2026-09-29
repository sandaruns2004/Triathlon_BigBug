"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { LogOut, ShoppingCart, PackageSearch } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

interface StoreShellProps {
  children: React.ReactNode;
}

export function StoreShell({ children }: StoreShellProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  
  const userName = (session?.user as any)?.name || "Store Manager";
  const outletId = (session?.user as any)?.outletId || "OUT005";

  return (
    <div className="min-h-screen bg-wp-canvas flex flex-col font-sans">
      <header className="h-[72px] bg-white border-b border-wp-border flex items-center justify-between px-6 flex-shrink-0 sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[7px] bg-wp-green flex items-center justify-center">
              <ShoppingCart size={16} className="text-white" />
            </div>
            <span className="font-bold text-[17px] text-wp-ink tracking-wide hidden sm:inline-block">Waypoint Store</span>
          </div>

          <nav className="flex items-center gap-4">
            <Link
              href="/store"
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md font-semibold transition-colors text-sm",
                pathname === "/store" ? "bg-wp-pale text-wp-ink" : "text-wp-muted hover:bg-wp-pale/50 hover:text-wp-ink"
              )}
            >
              Dashboard
            </Link>
            <Link
              href="/store/orders/new"
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md font-semibold transition-colors text-sm",
                pathname === "/store/orders/new" ? "bg-wp-pale text-wp-ink" : "text-wp-muted hover:bg-wp-pale/50 hover:text-wp-ink"
              )}
            >
              New Order
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-bold text-wp-ink">{userName}</div>
            <div className="text-xs text-wp-muted">{outletId} • Store Manager</div>
          </div>
          <button 
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-2 text-wp-muted hover:text-wp-ink hover:bg-wp-pale rounded-md transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
