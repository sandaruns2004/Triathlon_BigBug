"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { PackageSearch, ChevronRight, Box } from "lucide-react";
import { api } from "@/lib/mobile/browser";

export default function StoreOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/store/orders")
      .then(res => res.json())
      .then(data => {
        setOrders(data.orders || []);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex-1 overflow-y-auto px-[22px] pt-[10px] pb-[24px]">
      <div className="mb-[23px]">
        <div className="text-[10px] tracking-[1.6px] uppercase font-[700] text-[#6b7870]">FRESH · NUGEGODA</div>
        <h1 className="text-[28px] leading-[1.2] tracking-[-1px] font-[650] my-[8px]">Your orders</h1>
        <p className="text-[13px] text-[#6b7870] leading-[1.55]">From request to receipt.</p>
      </div>

      <Link href="/store/orders/new" className="w-full bg-[#146b45] text-white font-semibold text-[14px] h-[48px] rounded-[12px] flex items-center justify-center gap-[9px] hover:bg-[#105b3a] transition-colors mb-[25px]">
        <Box size={18} /> Create a new order
      </Link>

      <div className="flex items-center justify-between mb-[12px]">
        <h2 className="text-[17px] font-[650] tracking-[-0.5px]">Recent orders</h2>
        <span className="inline-flex items-center gap-[5px] rounded-[6px] px-[8px] py-[5px] text-[10px] font-[650] bg-[#edf1ed] text-[#6b7870] whitespace-nowrap">
          {orders.length} orders
        </span>
      </div>

      <div className="flex flex-col gap-[15px]">
        {loading ? (
          <div className="p-8 text-center text-[#6b7870]">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="bg-white border border-[#dce5df] rounded-[14px] p-[18px] text-center text-[#6b7870]">
            No orders found.
          </div>
        ) : (
          orders.map((o) => (
            <Link key={o.orderId} href={`/store/orders/${o.orderId}`} className="bg-white border border-[#dce5df] rounded-[14px] p-[18px] block hover:opacity-80">
              <div className="flex justify-between items-start mb-[10px]">
                <h3 className="text-[14px] font-[650]">{String(o.orderId).split("-")[0]}-{String(o.orderId).split("-")[1]?.substring(0, 6).toUpperCase()}</h3>
                <span className="inline-flex items-center gap-[5px] rounded-[6px] px-[8px] py-[5px] text-[10px] font-[650] bg-[#fcf2df] text-[#92611a] whitespace-nowrap">
                  {o.status.replace("_", " ")}
                </span>
              </div>
              <p className="text-[12px] text-[#6b7870] leading-[1.5] mb-[10px]">
                Requested {o.planDate || o.requestedDate}<br />
                {o.orderWeightKg} kg · {o.brand}
              </p>
              <div className="text-[11px] text-[#6b7870] flex items-center justify-between border-t border-[#edf1eb] pt-[10px]">
                <span>Submitted recently</span>
                <ChevronRight size={14} />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
