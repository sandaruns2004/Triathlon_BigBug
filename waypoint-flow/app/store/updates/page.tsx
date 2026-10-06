"use client";
import Link from "next/link";
import { Bell, ArrowRight } from "lucide-react";

export default function StoreUpdatesPage() {
  return (
    <div className="flex-1 overflow-y-auto px-[22px] pt-[10px] pb-[24px]">
      <div className="mb-[23px]">
        <div className="text-[10px] tracking-[1.6px] uppercase font-[700] text-[#6b7870]">NOTIFICATIONS</div>
        <h1 className="text-[28px] leading-[1.2] tracking-[-1px] font-[650] my-[8px]">Store updates</h1>
        <p className="text-[13px] text-[#6b7870] leading-[1.55]">The latest on your deliveries.</p>
      </div>

      <div className="flex flex-col gap-[15px]">
        <Link href="/store/orders" className="bg-white border border-[#dce5df] rounded-[14px] p-[18px] block hover:opacity-80">
          <div className="flex justify-between items-start mb-[8px]">
            <h3 className="text-[14px] font-[650]">Delivery ready to receive</h3>
            <span className="inline-flex items-center gap-[5px] rounded-[6px] px-[8px] py-[5px] text-[10px] font-[650] bg-[#eaf6ef] text-[#146b45] whitespace-nowrap">
              New
            </span>
          </div>
          <p className="text-[12px] text-[#6b7870] leading-[1.5]">
            An order arrived at your receiving bay. Check the quantities and confirm receipt.
          </p>
        </Link>

        <div className="bg-white border border-[#dce5df] rounded-[14px] p-[18px]">
          <h3 className="text-[14px] font-[650] mb-[8px]">Tomorrow's order cut-off</h3>
          <p className="text-[12px] text-[#6b7870] leading-[1.5]">
            Send your order by 4:00 PM today to be included in tomorrow's planning cycle.
          </p>
        </div>
      </div>
    </div>
  );
}
