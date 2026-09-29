"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { AlertTriangle, Clock, MapPin, Store, Truck, Snowflake } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CapacityDeferralPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Fetch the specific order details
    fetch(`/api/orders/${params.orderId}`)
      .then(res => res.json())
      .then(data => {
        setOrder(data.order);
        if (data.order?.deferralReason) setReason(data.order.deferralReason);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, [params.orderId]);

  const handleConfirm = async () => {
    if (!reason) return;
    setIsSubmitting(true);
    try {
      await fetch(`/api/orders/${params.orderId}/defer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      router.push("/dispatcher/plan");
    } catch (e) {
      console.error(e);
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-8">Loading deferral details...</div>;
  if (!order) return <div className="p-8 text-red-600">Order not found.</div>;

  return (
    <div className="h-full flex flex-col max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-wp-ink flex items-center gap-3">
            <AlertTriangle className="text-amber-500" />
            Capacity Deferral Review
          </h1>
          <p className="text-wp-muted mt-1">Review auto-deferred order {order.orderId}</p>
        </div>
        <button onClick={() => router.back()} className="btn btn-outline">
          ← Back to Plan
        </button>
      </div>

      <div className="flex-1 grid grid-cols-3 gap-6 min-h-0">
        {/* Left: Why this can't be assigned */}
        <div className="card-panel p-6 flex flex-col">
          <h2 className="text-section-title text-wp-ink mb-4 border-b border-wp-border pb-2">Allocation Constraints</h2>
          
          <div className="space-y-4 text-sm text-wp-ink flex-1">
            <p className="text-wp-muted mb-4">The engine could not assign this order due to the following hard constraints:</p>
            
            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-md">
              <Truck size={18} className="text-red-500 mt-0.5" />
              <div>
                <strong className="block text-red-700">Volume Capacity Exceeded</strong>
                <span className="text-red-600/80">Order volume ({order.orderVolumeM3} m³) exceeds remaining capacity on all eligible vehicles for {order.district}.</span>
              </div>
            </div>

            {["chilled", "frozen"].includes(order.tempRequirement) && (
              <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-md">
                <Snowflake size={18} className="text-amber-600 mt-0.5" />
                <div>
                  <strong className="block text-amber-700">Reefer Shortage</strong>
                  <span className="text-amber-700/80">No refrigerated vehicles are currently available at {order.depot} Depot.</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Centre: Store Impact */}
        <div className="card-panel p-6 flex flex-col">
          <h2 className="text-section-title text-wp-ink mb-4 border-b border-wp-border pb-2">Store Impact</h2>
          
          <div className="flex items-center gap-3 mb-6 p-4 bg-wp-pale rounded-md border border-wp-border">
            <Store size={24} className="text-wp-green" />
            <div>
              <div className="font-bold text-wp-ink">{order.outletName}</div>
              <div className="text-xs text-wp-muted">{order.district} District</div>
            </div>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px before:h-full before:w-0.5 before:bg-wp-border">
            <div className="relative flex items-center gap-4">
              <div className="absolute left-[-24px] w-6 h-6 rounded-full bg-wp-border flex items-center justify-center z-10" />
              <div className="text-sm font-medium text-wp-muted line-through">Today: Planned Delivery</div>
            </div>
            
            <div className="relative flex items-center gap-4">
              <div className="absolute left-[-24px] w-6 h-6 rounded-full bg-amber-500 border-4 border-white flex items-center justify-center z-10" />
              <div className="text-sm font-bold text-amber-600">Defer to Tomorrow</div>
            </div>
          </div>

          {order.deferredYesterday && (
            <div className="mt-8 p-3 bg-red-100 text-red-700 rounded text-sm font-bold flex items-center gap-2">
              <AlertTriangle size={16} />
              CRITICAL: This order was already deferred yesterday!
            </div>
          )}
        </div>

        {/* Right: Reason & Notification */}
        <div className="card-panel p-6 flex flex-col">
          <h2 className="text-section-title text-wp-ink mb-4 border-b border-wp-border pb-2">Confirm Deferral</h2>
          
          <div className="mb-6 flex-1">
            <label className="block text-sm font-semibold text-wp-ink mb-2">Mandatory Reason Code</label>
            <select 
              value={reason} 
              onChange={(e) => setReason(e.target.value)}
              className="field-input mb-2"
            >
              <option value="">-- Select a reason --</option>
              <option value="Demand exceeds capacity">Demand exceeds capacity</option>
              <option value="Vehicle breakdown">Vehicle breakdown</option>
              <option value="Reefer unavailable">Refrigerated vehicle unavailable</option>
              <option value="Time window missed">Store time window cannot be met</option>
            </select>
            <p className="text-xs text-wp-muted">This reason will be visible to the Store Manager.</p>
          </div>

          <div className="bg-wp-canvas border border-wp-border rounded p-4 mb-6 relative">
            <div className="absolute -top-3 left-4 bg-wp-canvas px-2 text-[10px] font-bold text-wp-muted uppercase">Notification Preview</div>
            <div className="flex items-center gap-2 mb-2 text-wp-ink font-semibold">
              <MapPin size={16} className="text-amber-500" />
              Delivery Deferred
            </div>
            <div className="text-sm text-wp-muted">
              Your {order.brand} order has been rescheduled to tomorrow. 
              <br/><br/>
              <strong>Reason:</strong> {reason || "..."}
            </div>
          </div>

          <button 
            onClick={handleConfirm}
            disabled={!reason || isSubmitting}
            className="btn btn-primary w-full"
          >
            {isSubmitting ? "Confirming..." : "Confirm Deferral & Notify Store"}
          </button>
        </div>
      </div>
    </div>
  );
}
