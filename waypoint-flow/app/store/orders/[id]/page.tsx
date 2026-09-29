"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Truck, Package, Clock, Calendar, CheckCircle2, MapPin } from "lucide-react";
import { StatusChip } from "@/components/shared/StatusChip";
import { cn } from "@/lib/utils";

export default function StoreOrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [trip, setTrip] = useState<any>(null);
  const [vehicle, setVehicle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/store/orders/${params.id}`)
      .then(res => res.json())
      .then(data => {
        setOrder(data.order);
        setTrip(data.trip);
        setVehicle(data.vehicle);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, [params.id]);

  if (loading) return <div className="p-8 text-center">Loading order details...</div>;
  if (!order) return <div className="p-8 text-center text-red-600">Order not found.</div>;

  // Determine progress step
  // 1: Order Placed (pending)
  // 2: Planned (trip assigned, status planned/loading)
  // 3: On Route (trip ready_to_depart, on_route)
  // 4: Arriving Soon (if trip on_route and next stop is this store) or Delivered
  
  let currentStep = 1;
  if (order.status === "delivered") currentStep = 4;
  else if (trip) {
    if (["ready_to_depart", "on_route"].includes(trip.status)) currentStep = 3;
    else currentStep = 2;
  }

  const steps = [
    { num: 1, label: "Order Placed" },
    { num: 2, label: "Planned" },
    { num: 3, label: "On Route" },
    { num: 4, label: "Delivered" },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <button 
        onClick={() => router.push("/store")}
        className="text-wp-muted hover:text-wp-ink flex items-center gap-1 mb-6 text-sm font-semibold transition-colors"
      >
        <ChevronLeft size={16} /> Back to Dashboard
      </button>

      <div className="card-panel overflow-hidden mb-8">
        <div className="bg-wp-ink p-6 md:p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="text-white/60 text-sm font-bold tracking-wider mb-1 uppercase">Order Ref</div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-3">
              {order.orderId}
            </h1>
            <div className="flex items-center gap-4 text-sm text-white/80">
              <span className="flex items-center gap-1.5"><Calendar size={16} /> {order.planDate}</span>
              <span className="flex items-center gap-1.5"><Package size={16} /> {order.orderWeightKg} kg</span>
            </div>
          </div>
          
          <div className="text-right">
            <StatusChip status={order.status} className="mb-2 inline-flex shadow-lg" />
            {trip?.etaDeparture && (
              <p className="text-sm text-white/70">
                ETA: {new Date(trip.etaDeparture).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="p-6 md:p-8 bg-white border-b border-wp-border">
          <div className="relative">
            <div className="absolute top-5 left-8 right-8 h-1 bg-wp-pale rounded-full z-0 overflow-hidden">
              <div 
                className="h-full bg-wp-green transition-all duration-1000 ease-in-out" 
                style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
              />
            </div>
            
            <div className="relative z-10 flex justify-between">
              {steps.map((step) => {
                const isCompleted = step.num <= currentStep;
                const isCurrent = step.num === currentStep;
                return (
                  <div key={step.num} className="flex flex-col items-center">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm transition-colors duration-500",
                      isCompleted ? "bg-wp-green text-white" : "bg-white border-2 border-wp-pale text-wp-muted"
                    )}>
                      {isCompleted ? <CheckCircle2 size={20} /> : step.num}
                    </div>
                    <span className={cn(
                      "mt-3 text-xs md:text-sm font-bold text-center w-24",
                      isCurrent ? "text-wp-ink" : "text-wp-muted"
                    )}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Col: Items */}
        <div className="card-panel p-6">
          <h2 className="text-lg font-bold text-wp-ink flex items-center gap-2 mb-4 pb-4 border-b border-wp-border">
            <Package size={20} className="text-wp-action" />
            Order Items
          </h2>
          
          {order.items && order.items.length > 0 ? (
            <div className="space-y-4">
              {order.items.map((item: any, i: number) => (
                <div key={i} className="flex justify-between items-start text-sm">
                  <div>
                    <div className="font-semibold text-wp-ink">{item.name}</div>
                    <div className="text-wp-muted text-xs">{item.category}</div>
                  </div>
                  <div className="font-bold text-wp-ink">
                    Qty: {item.qty}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-wp-muted text-sm text-center py-6">Item breakdown not available for this legacy order.</p>
          )}
        </div>

        {/* Right Col: Logistics */}
        <div className="space-y-6">
          <div className="card-panel p-6">
            <h2 className="text-lg font-bold text-wp-ink flex items-center gap-2 mb-4 pb-4 border-b border-wp-border">
              <Truck size={20} className="text-wp-action" />
              Logistics
            </h2>
            
            {trip ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-wp-pale flex items-center justify-center flex-shrink-0">
                    <Truck size={16} className="text-wp-ink" />
                  </div>
                  <div>
                    <div className="text-xs text-wp-muted uppercase font-bold tracking-wider mb-0.5">Vehicle</div>
                    <div className="font-semibold text-wp-ink">{trip.vehicleId} • {vehicle?.type || 'Truck'}</div>
                    <div className="text-sm text-wp-muted mt-0.5">Driver: {trip.driverName || 'Unassigned'}</div>
                  </div>
                </div>
                
                {trip.status === "on_route" && vehicle?.lat && vehicle?.lng && (
                  <div className="mt-4 pt-4 border-t border-wp-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-wp-ink flex items-center gap-2">
                        <MapPin size={16} className="text-wp-action" /> Current Location
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-wp-muted font-bold">
                        <span className="w-2 h-2 rounded-full bg-wp-green animate-pulse"></span>
                        Live
                      </span>
                    </div>
                    {/* Placeholder for map - in the actual hackathon we'd embed Leaflet here */}
                    <div className="h-32 bg-wp-pale rounded-lg border border-wp-border flex items-center justify-center relative overflow-hidden group cursor-pointer hover:border-wp-action transition-colors">
                       <MapPin size={24} className="text-wp-action absolute z-10 animate-bounce" />
                       <div className="absolute inset-0 opacity-20 bg-[url('https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png')] bg-repeat opacity-10"></div>
                       <span className="relative z-10 text-xs font-bold text-wp-ink bg-white/80 px-2 py-1 rounded shadow-sm mt-8">View Map</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-wp-pale rounded-full flex items-center justify-center mx-auto mb-3">
                  <Clock size={20} className="text-wp-muted" />
                </div>
                <h3 className="font-bold text-wp-ink mb-1">Awaiting Assignment</h3>
                <p className="text-sm text-wp-muted">This order is pending allocation by the dispatcher.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
