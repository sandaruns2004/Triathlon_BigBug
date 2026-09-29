"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Play, MapPin, CheckCircle2, Navigation, AlertCircle } from "lucide-react";
import { StatusChip } from "@/components/shared/StatusChip";
import { cn } from "@/lib/utils";

export default function DriverTodayPage() {
  const [trip, setTrip] = useState<any>(null);
  const [stops, setStops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrip = () => {
    fetch("/api/driver/trip")
      .then(res => res.json())
      .then(data => {
        setTrip(data.trip);
        setStops(data.stops || []);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTrip();
  }, []);

  const handleStartRoute = async () => {
    if (!trip) return;
    try {
      await fetch(`/api/driver/trips/${trip.tripId}/start`, { method: "POST" });
      fetchTrip();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="p-8 text-center text-wp-muted">Loading route...</div>;

  if (!trip) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="w-16 h-16 bg-wp-pale rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 size={32} className="text-wp-green" />
        </div>
        <h2 className="text-xl font-bold text-wp-ink mb-2">No Active Route</h2>
        <p className="text-wp-muted">You have no pending trips for today. Take a break!</p>
      </div>
    );
  }

  const isReady = trip.status === "ready_to_depart";
  const isOnRoute = trip.status === "on_route";

  return (
    <div className="flex flex-col h-full bg-wp-pale pb-20">
      {/* Hero Section */}
      <div className="bg-wp-ink text-white p-6 pb-8 rounded-b-3xl shadow-md">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold">{trip.vehicleId}</h1>
            <p className="text-white/70 text-sm mt-1">{trip.brand} • {trip.district}</p>
          </div>
          <StatusChip status={trip.status} />
        </div>

        <div className="flex justify-between items-center bg-white/10 p-4 rounded-xl">
          <div className="text-center">
            <div className="text-2xl font-bold">{trip.stopsCompleted}</div>
            <div className="text-[10px] uppercase text-white/70 font-semibold tracking-wide">Done</div>
          </div>
          <div className="text-white/30 text-2xl font-light">/</div>
          <div className="text-center">
            <div className="text-2xl font-bold">{trip.stopCount}</div>
            <div className="text-[10px] uppercase text-white/70 font-semibold tracking-wide">Stops</div>
          </div>
          <div className="text-white/30 text-2xl font-light">/</div>
          <div className="text-center">
            <div className="text-2xl font-bold">{trip.weightKg}</div>
            <div className="text-[10px] uppercase text-white/70 font-semibold tracking-wide">Kg</div>
          </div>
        </div>

        {isReady && (
          <button 
            onClick={handleStartRoute}
            className="w-full mt-6 bg-wp-action text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-lg active:scale-95"
          >
            <Play size={20} fill="currentColor" />
            START ROUTE
          </button>
        )}
      </div>

      {/* Route List */}
      <div className="flex-1 px-4 pt-6">
        <h2 className="text-sm font-bold text-wp-muted uppercase tracking-wider mb-4 px-2">Delivery Sequence</h2>
        
        <div className="space-y-3">
          {stops.map((stop) => {
            const isCompleted = stop.status === "delivered" || stop.status === "failed";
            
            return (
              <Link 
                key={stop.stopId}
                href={isOnRoute && !isCompleted ? `/driver/stop/${stop.stopId}` : "#"}
                className={cn(
                  "block bg-white p-4 rounded-xl border border-wp-border shadow-sm transition-transform",
                  !isOnRoute && "opacity-60 pointer-events-none",
                  isCompleted && "opacity-50",
                  isOnRoute && !isCompleted && "active:scale-[0.98] border-wp-action/30"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5",
                    isCompleted ? "bg-wp-green/20 text-wp-green" : "bg-wp-ink text-white"
                  )}>
                    {isCompleted ? <CheckCircle2 size={16} /> : stop.stopOrder}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className={cn("font-bold text-base mb-1", isCompleted ? "line-through text-wp-muted" : "text-wp-ink")}>
                      {stop.outletName}
                    </h3>
                    <p className="text-xs text-wp-muted flex items-center gap-1 mb-2">
                      <MapPin size={12} /> {stop.address || "Address not provided"}
                    </p>
                    <div className="flex gap-2">
                      <span className="text-[10px] font-bold bg-wp-pale text-wp-muted px-2 py-0.5 rounded">
                        {stop.expectedKg} kg
                      </span>
                      {stop.status === "failed" && (
                        <span className="text-[10px] font-bold bg-red-50 text-red-600 px-2 py-0.5 rounded flex items-center gap-1">
                          <AlertCircle size={10} /> FAILED
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {isOnRoute && !isCompleted && (
                    <div className="text-wp-action mt-2">
                      <Navigation size={20} />
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
