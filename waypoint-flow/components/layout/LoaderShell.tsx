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
      <header className="h-[75px] bg-white border-b border-[#dce5df] flex items-center justify-between px-[20px] md:px-[34px] flex-shrink-0 text-[#17221d]">
        <div className="flex items-center gap-[15px] md:gap-[30px]">
          {/* Brand */}
          <div className="flex items-center gap-[10px] font-[750] text-[18px] tracking-[-0.6px]">
            <div className="w-[35px] h-[35px] rounded-[9px] bg-[#146b45] flex items-center justify-center shrink-0 shadow-[0_2px_10px_#146b4540]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div className="hidden sm:block">
              Waypoint Flow
              <small className="block text-[9px] tracking-[2px] font-[600] text-[#63716a] mt-[4px]">CONNECTED OPERATIONS</small>
            </div>
          </div>

          <div className="w-[1px] h-[20px] bg-[#dce5df] hidden sm:block"></div>

          {/* Navigation */}
          <nav className="flex items-center gap-2">
            <Link
              href="/loader"
              className={cn(
                "flex items-center gap-[9px] px-[14px] py-[10px] rounded-[7px] font-[600] text-[13px] transition-colors border",
                pathname === "/loader" ? "bg-[#eaf6ef] text-[#146b45] border-transparent" : "bg-transparent text-[#68736d] border-transparent hover:bg-[#f0f5f2]"
              )}
            >
              <ListTodo size={19} strokeWidth={1.7} />
              Load Board
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-[15px]">
          <span className="hidden md:flex items-center gap-[6px] text-[10px] text-[#146b45] border border-[#d8eadf] bg-[#f2faf5] px-[8px] py-[4px] rounded-[5px]">
            <span className="w-[6px] h-[6px] bg-[#1f8a5b] rounded-full inline-block"></span>
            Demo data
          </span>

          <div className="w-[1px] h-[20px] bg-[#dce5df] hidden sm:block"></div>

          <div className="text-right hidden sm:block">
            <div className="text-[12px] font-[700] text-[#17221d]">{userName}</div>
            <div className="text-[10px] text-[#63716a] mt-[3px]">{userDepot} Depot • Loading Floor</div>
          </div>
          <button 
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="h-[33px] w-[33px] rounded-full bg-[#e8eee8] flex items-center justify-center text-[#146b45] text-[11px] font-[700] hover:bg-[#dce5df] transition-colors"
            title="Sign out"
          >
            {userName.split(" ").map((n: string) => n[0]).join("").substring(0,2).toUpperCase()}
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
