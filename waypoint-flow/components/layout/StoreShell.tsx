"use client";

import { usePathname, useRouter } from "next/navigation";
import { LogOut, Home, PackageSearch, Bell, User, ShoppingCart, ChevronLeft } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface StoreShellProps {
  children: React.ReactNode;
}

export function StoreShell({ children }: StoreShellProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  
  const userName = (session?.user as any)?.name || "Store Manager";

  return (
    <div className="flex items-center justify-center min-h-[100dvh] bg-[#eef2ed] sm:p-6">
      <div className="w-full h-[100dvh] sm:h-[min(884px,calc(100vh-80px))] sm:min-h-[690px] sm:max-h-[930px] max-w-[420px] mx-auto sm:border sm:border-[#cdd8cf] sm:rounded-[36px] bg-[#f6f8f7] sm:shadow-[0_28px_70px_#2c503119,0_3px_12px_#2c50310a] overflow-hidden flex flex-col relative shadow-[0_0_20px_rgba(0,0,0,0.05)] sm:shadow-none font-sans text-[#17221d]">
        <header className="flex items-center justify-between px-[22px] pt-[21px] pb-[14px] bg-[#f6f8f7] sticky top-0 z-50 flex-shrink-0">
        <div className="flex items-center gap-[8px] font-[750] text-[16px] tracking-[-0.5px]">
          <div className="w-[28px] h-[28px] rounded-[7px] bg-[#146b45] flex items-center justify-center">
            <ShoppingCart size={14} className="text-white" />
          </div>
          <span>Waypoint Flow</span>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/store/updates")} className="w-[38px] h-[38px] rounded-full bg-white border border-[#e5ebe4] flex items-center justify-center text-[#17221d] relative hover:bg-black/5 transition-colors">
            <Bell size={20} />
          </button>
          <button 
            onClick={() => router.push("/store/profile")}
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
          <Link href="/store" className={`flex-1 flex flex-col items-center justify-center min-h-[53px] gap-[5px] rounded-[9px] text-[10px] font-medium transition-colors ${pathname === "/store" ? "text-[#146b45]" : "text-[#8a968c]"}`}>
            <div className={`w-[20px] h-[20px] flex items-center justify-center ${pathname === "/store" ? "bg-[#eaf6ef] shadow-[0_0_0_6px_#eaf6ef] rounded-[3px]" : ""}`}>
              <Home size={20} className={pathname === "/store" ? "fill-current" : ""} />
            </div>
            <span className="mt-[3px]">Home</span>
          </Link>
          <Link href="/store/orders" className={`flex-1 flex flex-col items-center justify-center min-h-[53px] gap-[5px] rounded-[9px] text-[10px] font-medium transition-colors ${pathname.startsWith("/store/orders") ? "text-[#146b45]" : "text-[#8a968c]"}`}>
            <div className={`w-[20px] h-[20px] flex items-center justify-center ${pathname.startsWith("/store/orders") ? "bg-[#eaf6ef] shadow-[0_0_0_6px_#eaf6ef] rounded-[3px]" : ""}`}>
              <PackageSearch size={20} className={pathname.startsWith("/store/orders") ? "fill-current" : ""} />
            </div>
            <span className="mt-[3px]">Orders</span>
          </Link>
          <Link href="/store/updates" className={`flex-1 flex flex-col items-center justify-center min-h-[53px] gap-[5px] rounded-[9px] text-[10px] font-medium transition-colors ${pathname === "/store/updates" ? "text-[#146b45]" : "text-[#8a968c]"}`}>
            <div className={`w-[20px] h-[20px] flex items-center justify-center ${pathname === "/store/updates" ? "bg-[#eaf6ef] shadow-[0_0_0_6px_#eaf6ef] rounded-[3px]" : ""}`}>
              <Bell size={20} className={pathname === "/store/updates" ? "fill-current" : ""} />
            </div>
            <span className="mt-[3px]">Updates</span>
          </Link>
          <Link href="/store/profile" className={`flex-1 flex flex-col items-center justify-center min-h-[53px] gap-[5px] rounded-[9px] text-[10px] font-medium transition-colors ${pathname === "/store/profile" ? "text-[#146b45]" : "text-[#8a968c]"}`}>
            <div className={`w-[20px] h-[20px] flex items-center justify-center ${pathname === "/store/profile" ? "bg-[#eaf6ef] shadow-[0_0_0_6px_#eaf6ef] rounded-[3px]" : ""}`}>
              <User size={20} className={pathname === "/store/profile" ? "fill-current" : ""} />
            </div>
            <span className="mt-[3px]">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
    </div>
  );
}
