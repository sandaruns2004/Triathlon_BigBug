"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, Truck, Calendar, ChevronRight } from "lucide-react";
import { useSession } from "next-auth/react";
import { StatusChip } from "@/components/shared/StatusChip";

export default function StoreDashboardPage() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app we'd filter by outletId via API
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
    <div>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-wp-ink">Store Dashboard</h1>
          <p className="text-wp-muted mt-2">Track incoming deliveries and manage stock.</p>
        </div>
        <Link href="/store/orders/new" className="btn btn-primary py-2.5 px-6">
          New Restock Order
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="card-panel p-6 bg-wp-ink text-white">
          <div className="flex items-center gap-3 mb-2 opacity-80">
            <Truck size={20} />
            <h3 className="font-semibold">Expected Today</h3>
          </div>
          <div className="text-4xl font-bold">
            {orders.filter(o => o.status !== "delivered" && o.status !== "pending").length}
          </div>
        </div>
        
        <div className="card-panel p-6 bg-wp-green/10 border border-wp-green/20 text-wp-ink">
          <div className="flex items-center gap-3 mb-2 text-wp-green">
            <Package size={20} />
            <h3 className="font-semibold">Pending Fulfillment</h3>
          </div>
          <div className="text-4xl font-bold">
            {orders.filter(o => o.status === "pending" || o.status === "deferred").length}
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold text-wp-ink mb-4">Recent Orders</h2>
      
      {loading ? (
        <div className="p-8 text-center text-wp-muted card-panel">Loading...</div>
      ) : orders.length === 0 ? (
        <div className="p-12 text-center text-wp-muted card-panel border-dashed">
          <Package size={48} className="mx-auto mb-4 opacity-50" />
          <p>No orders found for your store.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <Link 
              key={order.orderId}
              href={`/store/orders/${order.orderId}`}
              className="card-panel p-4 flex flex-col md:flex-row md:items-center justify-between hover:border-wp-action transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-4 mb-3 md:mb-0">
                <div className="w-12 h-12 rounded-xl bg-wp-pale flex items-center justify-center text-wp-ink font-bold">
                  {new Date(order.planDate).getDate()}
                </div>
                <div>
                  <h3 className="font-bold text-wp-ink">{order.orderId}</h3>
                  <div className="text-sm text-wp-muted flex items-center gap-2">
                    <Calendar size={14} /> {order.planDate} • {order.orderWeightKg} kg • {order.brand}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto border-t border-wp-border md:border-0 pt-3 md:pt-0">
                <StatusChip status={order.status} />
                <ChevronRight size={20} className="text-wp-muted group-hover:text-wp-action group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
