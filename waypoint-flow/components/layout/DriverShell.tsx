"use client";

import { usePathname } from "next/navigation";
import { LogOut, Navigation, RefreshCw } from "lucide-react";
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
    <div className="min-h-[100dvh] bg-[#f6f8f7] flex flex-col font-sans text-[#17221d]">
      <header className="flex items-center justify-between px-[22px] pt-[21px] pb-[14px] bg-[#f6f8f7] sticky top-0 z-50 flex-shrink-0">
        <div className="flex items-center gap-[8px] font-[750] text-[16px] tracking-[-0.5px]">
          <div className="w-[28px] h-[28px] rounded-[7px] bg-[#146b45] flex items-center justify-center">
            <Navigation size={14} className="text-white fill-white -rotate-45" />
          </div>
          <span>Waypoint Driver</span>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-[38px] h-[38px] rounded-full bg-[#e3ece2] text-[#146b45] text-[12px] font-[700] border-[3px] border-white flex items-center justify-center p-0 overflow-hidden cursor-pointer shadow-sm hover:opacity-80"
          >
            {userName.slice(0, 2).toUpperCase()}
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col w-full max-w-[420px] mx-auto relative pb-24 overflow-x-hidden">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#dce5df] pb-safe max-w-[420px] mx-auto z-50 flex-shrink-0">
        <div className="flex justify-around items-center px-[12px] pt-[9px] pb-[10px]">
          <Link href="/driver" className={`flex-1 flex flex-col items-center justify-center min-h-[53px] gap-[5px] rounded-[9px] text-[10px] font-medium transition-colors ${pathname === "/driver" ? "text-[#146b45]" : "text-[#8a968c]"}`}>
            <div className={`w-[20px] h-[20px] flex items-center justify-center ${pathname === "/driver" ? "bg-[#eaf6ef] shadow-[0_0_0_6px_#eaf6ef] rounded-[3px]" : ""}`}>
              <Navigation size={20} className={pathname === "/driver" ? "fill-current" : ""} />
            </div>
            <span className="mt-[3px]">Today</span>
          </Link>
          <Link href="/driver/sync" className={`flex-1 flex flex-col items-center justify-center min-h-[53px] gap-[5px] rounded-[9px] text-[10px] font-medium transition-colors ${pathname === "/driver/sync" ? "text-[#146b45]" : "text-[#8a968c]"}`}>
            <div className={`w-[20px] h-[20px] flex items-center justify-center ${pathname === "/driver/sync" ? "bg-[#eaf6ef] shadow-[0_0_0_6px_#eaf6ef] rounded-[3px]" : ""}`}>
              <RefreshCw size={20} />
            </div>
            <span className="mt-[3px]">Sync</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
