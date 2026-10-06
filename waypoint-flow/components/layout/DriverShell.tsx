"use client";

import { usePathname, useRouter } from "next/navigation";
import { LogOut, Navigation, RefreshCw } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

interface DriverShellProps {
  children: React.ReactNode;
}

export function DriverShell({ children }: DriverShellProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  
  const userName = (session?.user as any)?.name || "Driver";

  return (
      <div className="flex items-center justify-center min-h-[100dvh] bg-[#eef2ed] sm:p-6">
        <div className="w-full h-[100dvh] sm:h-[min(884px,calc(100vh-80px))] sm:min-h-[690px] sm:max-h-[930px] max-w-[420px] mx-auto sm:border sm:border-[#cdd8cf] sm:rounded-[36px] bg-[#f6f8f7] sm:shadow-[0_28px_70px_#2c503119,0_3px_12px_#2c50310a] overflow-hidden flex flex-col relative shadow-[0_0_20px_rgba(0,0,0,0.05)] sm:shadow-none">
          
          <header className="flex items-center justify-between px-[22px] pt-[21px] pb-[14px] bg-[#f6f8f7] flex-shrink-0 z-50">
            <div className="flex items-center gap-[8px] font-[750] text-[16px] tracking-[-0.5px]">
              <div className="w-[28px] h-[28px] rounded-[7px] bg-[#146b45] flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <span>Waypoint Driver</span>
            </div>

            {/* Removed top right profile avatar since it's now in the bottom nav */}
          </header>

          <main className="flex-1 flex flex-col w-full min-h-0 relative overflow-y-auto overscroll-contain">
            {children}
          </main>

          <nav className="bg-white border-t border-[#dce5df] pb-safe flex-shrink-0 z-50">
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
              <Link href="/driver/profile" className={`flex-1 flex flex-col items-center justify-center min-h-[53px] gap-[5px] rounded-[9px] text-[10px] font-medium transition-colors ${pathname === "/driver/profile" ? "text-[#146b45]" : "text-[#8a968c]"}`}>
                <div className={`w-[20px] h-[20px] flex items-center justify-center ${pathname === "/driver/profile" ? "bg-[#eaf6ef] shadow-[0_0_0_6px_#eaf6ef] rounded-[3px]" : ""}`}>
                  <div className="w-[20px] h-[20px] rounded-full bg-[#e3ece2] text-[#146b45] text-[7px] font-[700] border-[1.5px] border-white flex items-center justify-center p-0 shadow-sm">
                    {userName.slice(0, 2).toUpperCase()}
                  </div>
                </div>
                <span className="mt-[3px]">Profile</span>
              </Link>
            </div>
          </nav>
        </div>
      </div>
  );
}
