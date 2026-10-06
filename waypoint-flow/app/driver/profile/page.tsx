"use client";
import Link from "next/link";
import { User, LogOut, ChevronRight, HelpCircle } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

export default function DriverProfilePage() {
  const { data: session } = useSession();
  const userName = (session?.user as any)?.name || "Driver";
  const email = (session?.user as any)?.email || "driver@waypoint.lk";

  return (
    <div className="flex-1 overflow-y-auto px-[22px] pt-[10px] pb-[24px]">
      <div className="mb-[23px]">
        <div className="text-[10px] tracking-[1.6px] uppercase font-[700] text-[#6b7870]">ACCOUNT & PREFERENCES</div>
        <h1 className="text-[28px] leading-[1.2] tracking-[-1px] font-[650] my-[8px]">Your workspace</h1>
      </div>

      <div className="flex items-center gap-[15px] mb-[25px]">
        <div className="w-[58px] h-[58px] rounded-full bg-[#e3ece2] text-[#146b45] text-[18px] font-[700] border-[4px] border-white flex items-center justify-center p-0 shadow-sm">
          {userName.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <h2 className="text-[18px] font-[650]">{userName}</h2>
          <p className="text-[13px] text-[#6b7870]">Driver · Peliyagoda depot</p>
          <span className="inline-flex items-center mt-[8px] gap-[5px] rounded-[6px] px-[8px] py-[5px] text-[10px] font-[650] bg-[#edf1ed] text-[#6b7870] whitespace-nowrap">
            Demo account
          </span>
        </div>
      </div>

      <div className="bg-white border border-[#dce5df] rounded-[14px] overflow-hidden mb-[20px]">
        <div className="flex items-center justify-between p-[18px] border-b border-[#edf0eb]">
          <div className="flex items-center gap-[12px] text-[14px] font-[650] text-[#17221d]">
            <User size={20} className="text-[#8a968c]" />
            <span>Account Details</span>
          </div>
          <span className="text-[13px] text-[#6b7870]">{email}</span>
        </div>
        
        <button onClick={() => alert("For help and support, please contact Waypoint Operations at support@waypoint.lk or call 011 234 5678.")} className="w-full flex items-center justify-between p-[18px] border-b border-[#edf0eb] hover:bg-black/5 transition-colors">
          <div className="flex items-center gap-[12px] text-[14px] font-[650] text-[#17221d]">
            <HelpCircle size={20} className="text-[#8a968c]" />
            <span>Help & support</span>
          </div>
          <ChevronRight size={18} className="text-[#8a968c]" />
        </button>

        <button 
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center justify-between p-[18px] hover:bg-black/5 transition-colors"
        >
          <div className="flex items-center gap-[12px] text-[14px] font-[650] text-[#ae483a]">
            <LogOut size={20} className="text-[#ae483a]" />
            <span>Sign out</span>
          </div>
        </button>
      </div>

      <p className="text-[11px] text-[#6b7870] text-center leading-[1.6]">
        Waypoint Flow · Mobile prototype <br/>
        Version 2026.1.0-alpha
      </p>
    </div>
  );
}
