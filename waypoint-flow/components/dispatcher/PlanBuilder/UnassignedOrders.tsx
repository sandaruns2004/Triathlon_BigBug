"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Info, PackageOpen, ListFilter } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Order } from "@/lib/allocation/engine";

export function UnassignedOrders({ orders }: { orders: Order[] }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = orders.filter((o) =>
    o.outletId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="card-panel h-full flex flex-col">
      <div className="p-4 border-b border-wp-border">
        <h2 className="text-sm font-semibold text-wp-ink flex items-center gap-2 mb-3">
          Unassigned Orders
          <span className="bg-wp-border text-wp-muted text-xs px-2 py-0.5 rounded-full font-bold">
            {orders.length}
          </span>
        </h2>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-wp-muted" />
          <input
            type="text"
            placeholder="Search outlet, brand..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-wp-canvas border border-wp-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-wp-action"
          />
          <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-wp-muted hover:text-wp-ink">
            <ListFilter size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-2 space-y-2 bg-wp-canvas">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-wp-muted text-sm p-4 text-center">
            <PackageOpen size={32} className="mb-2 text-wp-border" />
            No unassigned orders found.
          </div>
        ) : (
          filtered.map((order) => (
            <div key={order.orderId} className="bg-white border border-wp-border rounded-md p-3 hover:border-wp-action transition-colors cursor-grab">
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs font-bold text-wp-ink">{order.outletId}</span>
                <span className={cn(
                  "text-[10px] uppercase font-bold px-1.5 py-0.5 rounded",
                  order.brand === "Fresh" ? "bg-green-100 text-green-700" :
                  order.brand === "Style" ? "bg-purple-100 text-purple-700" :
                  "bg-blue-100 text-blue-700"
                )}>
                  {order.brand}
                </span>
              </div>
              <div className="text-xs text-wp-muted truncate mb-2">{order.district}</div>
              
              <div className="flex items-center gap-2 text-xs">
                <span className="text-wp-ink font-medium">{order.orderWeightKg} kg</span>
                <span className="text-wp-border">•</span>
                <span className="text-wp-ink font-medium">{order.orderVolumeM3} m³</span>
              </div>

              {["chilled", "frozen"].includes(order.tempRequirement) && (
                <div className="mt-2 text-[10px] font-bold text-blue-600 bg-blue-50 inline-block px-1.5 py-0.5 rounded">
                  {order.tempRequirement.toUpperCase()}
                </div>
              )}
              {order.deferredYesterday && (
                <div className="mt-2 ml-1 text-[10px] font-bold text-amber-600 bg-amber-50 inline-block px-1.5 py-0.5 rounded">
                  PRIORITY: DEFERRED YESTERDAY
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
