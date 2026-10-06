"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, Truck, Calendar, ChevronRight, Check, Box, Clock } from "lucide-react";
import { useSession } from "next-auth/react";
import { StatusChip } from "@/components/shared/StatusChip";

export default function StoreDashboardPage() {
  const { data: session } = useSession();
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

  const hasDelivered = orders.some(o => o.status === "delivered");
  const hasReceipt = orders.some(o => o.status === "receipt_confirmed");
  const showHero = hasDelivered || hasReceipt || orders.length > 0;
  
  const activeOrder = orders.find(o => o.status === "delivered") || 
                      orders.find(o => o.status === "on_route") || 
                      orders[0];

  return (
    <div className="flex-1 overflow-y-auto px-[22px] pt-[10px] pb-[24px]">
      <div className="mb-[23px]">
        <div className="text-[10px] tracking-[1.6px] uppercase font-[700] text-[#6b7870]">YOUR STORE, CONNECTED</div>
        <h1 className="text-[28px] leading-[1.2] tracking-[-1px] font-[650] my-[8px]">Good morning, Store Manager</h1>
        <p className="text-[13px] text-[#6b7870] leading-[1.55]">Fresh · Nugegoda</p>
      </div>

      {showHero && activeOrder && (
        <div className="relative overflow-hidden rounded-[18px] bg-[#146b45] text-white p-[22px] mb-[18px]">
          <div className="pointer-events-none absolute -right-[56px] top-[50px] w-[205px] h-[205px] rounded-full border border-white/10 shadow-[0_0_0_30px_rgba(255,255,255,0.015),0_0_0_60px_rgba(255,255,255,0.01)]" />
          
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <div className="text-[#acd0bb] text-[10px] font-bold uppercase tracking-[1.6px]">TODAY'S DELIVERY</div>
              <span className="inline-flex items-center gap-[5px] rounded-[6px] px-[8px] py-[5px] text-[10px] font-[650] bg-white/10 text-[#e8f5e9] border border-white/20 whitespace-nowrap">
                <Check size={12} /> {activeOrder.status === "receipt_confirmed" ? "Received" : activeOrder.status === "delivered" ? "Delivered" : "Pending"}
              </span>
            </div>
            
            <div className="flex items-center gap-[12px] min-h-[82px] mt-[12px]">
              <h2 className="flex-1 min-w-0 m-0 text-[27px] leading-[1.2] font-[650] tracking-tight">
                {activeOrder.status === "receipt_confirmed" ? "All received." : activeOrder.status === "delivered" ? "Your order is here." : "Awaiting delivery."}
              </h2>
            </div>
            
            <p className="text-[#c0ddcb] text-[12px] mt-[6px]">
              {activeOrder.orderId} · {activeOrder.planDate}
            </p>
            
            <div className="flex my-[23px] gap-[28px]">
              <div>
                <strong className="block text-[23px] font-semibold">{activeOrder.orderWeightKg}</strong>
                <small className="block text-[10px] text-[#b9d7c6] font-bold uppercase tracking-[1.6px] mt-1">Weight Kg</small>
              </div>
              <div className="w-px bg-white/20"></div>
              <div>
                <strong className="block text-[23px] font-semibold">{activeOrder.brand}</strong>
                <small className="block text-[10px] text-[#b9d7c6] font-bold uppercase tracking-[1.6px] mt-1">Brand</small>
              </div>
            </div>

            <Link href={`/store/orders/${activeOrder.orderId}`} className="w-full bg-white text-[#146b45] font-semibold text-[14px] h-[48px] rounded-[9px] flex items-center justify-center gap-[9px] hover:bg-[#f0f6f1] transition-colors">
              {activeOrder.status === "receipt_confirmed" ? <Truck size={20} /> : <Box size={20} />}
              {activeOrder.status === "receipt_confirmed" ? "View delivery" : "Check & confirm receipt"}
              <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-[12px] mb-[18px]">
        <Link href="/store/orders/new" className="bg-white border border-[#dce5df] rounded-[14px] p-[17px] min-h-[98px] flex flex-col items-start gap-[12px] text-[13px] font-[600]">
          <Box size={21} className="text-[#146b45]" strokeWidth={1.8} />
          Create an order
        </Link>
        <Link href="/store/orders" className="bg-white border border-[#dce5df] rounded-[14px] p-[17px] min-h-[98px] flex flex-col items-start gap-[12px] text-[13px] font-[600]">
          <Clock size={21} className="text-[#146b45]" strokeWidth={1.8} />
          Order history
        </Link>
      </div>

      <div className="bg-[#fff7e8] border border-[#efdfbe] text-[#92611a] p-[14px] rounded-[10px] text-[13px] leading-[1.6] mb-[25px]">
        <strong>Planning tomorrow's delivery?</strong><br />
        Submit by 4:00 PM today for the next planning cycle.
      </div>

      <div className="flex items-center justify-between mb-[12px]">
        <h2 className="text-[17px] font-[650] tracking-[-0.5px]">Recent activity</h2>
        <Link href="/store/orders" className="text-[#146b45] text-[12px] font-[650]">View all</Link>
      </div>

      <div className="bg-white border border-[#dce5df] rounded-[14px] p-[18px]">
        <div className="my-[20px]">
          {orders.slice(0, 3).map((order, i) => (
            <Link href={`/store/orders/${order.orderId}`} key={order.orderId} className={`block pl-[24px] pb-[20px] border-l-2 ${i === 0 ? "border-[#146b45]" : "border-[#dde7de]"} relative -ml-[6px] last:pb-0 hover:opacity-80`}>
              <div className={`absolute -left-[6px] top-[3px] w-[10px] h-[10px] rounded-full border-2 border-white ${i === 0 ? "bg-[#146b45]" : "bg-[#b9cbbd]"}`}></div>
              <h3 className="text-[14px] font-[650]">{String(order.orderId).split("-")[0]}-{String(order.orderId).split("-")[1]?.substring(0, 6).toUpperCase()}</h3>
              <p className="text-[12px] text-[#6b7870] mt-[4px]">{order.status.replace("_", " ")} · {order.planDate}</p>
            </Link>
          ))}
          {orders.length === 0 && <div className="text-[13px] text-[#6b7870] text-center">No recent activity.</div>}
        </div>
      </div>
    </div>
  );
}

