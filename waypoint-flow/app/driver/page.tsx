"use client";

import { useEffect, useState, useRef } from "react";
import { envelope } from "@/lib/mobile/browser";
import Link from "next/link";
import { Play, MapPin, CheckCircle2, Navigation, AlertCircle } from "lucide-react";
import { StatusChip } from "@/components/shared/StatusChip";
import { cn } from "@/lib/utils";

export default function DriverTodayPage() {
  const [trip, setTrip] = useState<any>(null);
  const [stops, setStops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [starting, setStarting] = useState(false);
  const startRequest = useRef<any>();

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
    const timer=setInterval(fetchTrip,30000);
    return()=>clearInterval(timer);
  }, []);

  const handleStartRoute = async () => {
    if (!trip || starting || !window.confirm("Are you safely parked before departure?")) return;
    setStarting(true);
    try {
      startRequest.current ??= envelope("trip_start", {parkedAcknowledged:true}, {tripId:trip.tripId}, {assignmentVersion:trip.assignmentVersion,releaseVersion:trip.releaseVersion});
      const res = await fetch(`/api/driver/trips/${trip.tripId}/start`, { method: "POST", headers:{"Content-Type":"application/json"},body:JSON.stringify(startRequest.current) });
      const result = await res.json();
      if (!res.ok) { if(res.status<500)startRequest.current=undefined; throw Error(result.error); }
      fetchTrip();
    } catch (e) {
      setMessage((e as Error).message);
    } finally { setStarting(false); }
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

  const isReady = ["planned", "loading", "ready_to_depart"].includes(trip.status) && !trip.held;
  const isOnRoute = ["on_route","returning"].includes(trip.status) && !trip.held;

  return (
    <div className="flex flex-col h-full bg-[#f6f8f7]">
      {message && <p role="status" className="px-[22px] py-2 text-sm text-[#ae483a]">{message}</p>}
      
      {/* ── Trip Hero ── */}
      <div className="relative overflow-hidden rounded-[18px] bg-[#146b45] text-white p-[22px] mx-[22px] mt-1 mb-[15px]">
        <div className="pointer-events-none absolute -right-[56px] top-[50px] w-[205px] h-[205px] rounded-full border border-white/10 shadow-[0_0_0_30px_rgba(255,255,255,0.015),0_0_0_60px_rgba(255,255,255,0.01)]" />
        
        <div className="relative z-10">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[#acd0bb] text-[10px] font-bold uppercase tracking-[1.6px]">{trip.status.replace("_", " ")}</div>
              <h2 className="text-[30px] font-[650] tracking-tight mt-3">{trip.vehicleId}</h2>
              <div className="text-[#c0ddcb] text-[12px] mt-1.5">{trip.brand} • {trip.district}</div>
            </div>
          </div>
          
          <div className="flex gap-7 my-[23px]">
            <div>
              <strong className="block text-[23px] font-semibold">{trip.stopsCompleted}</strong>
              <small className="block text-[10px] text-[#b9d7c6] font-bold uppercase tracking-[1.6px] mt-1">Done</small>
            </div>
            <div>
              <strong className="block text-[23px] font-semibold">{trip.stopCount}</strong>
              <small className="block text-[10px] text-[#b9d7c6] font-bold uppercase tracking-[1.6px] mt-1">Stops</small>
            </div>
            <div>
              <strong className="block text-[23px] font-semibold">{trip.weightKg}</strong>
              <small className="block text-[10px] text-[#b9d7c6] font-bold uppercase tracking-[1.6px] mt-1">Kg</small>
            </div>
          </div>

          {isReady && (
            <button 
              onClick={handleStartRoute}
              className="w-full bg-white text-[#146b45] font-semibold text-[14px] h-[48px] rounded-[9px] flex items-center justify-center gap-[9px] hover:bg-[#f0f6f1] transition-colors"
            >
              <Play size={20} fill="currentColor" strokeWidth={1} />
              START ROUTE
            </button>
          )}

          {!isReady && isOnRoute && (
            <div className="mt-[13px] flex items-center justify-center gap-1.5 text-[10px] text-[#c9e2d2]">
              <div className="w-[13px] h-[13px] flex items-center justify-center"><Navigation size={12} className="-rotate-45 fill-current" strokeWidth={1.5} /></div>
              Trip in progress
            </div>
          )}
        </div>
      </div>

      {/* ── Route List ── */}
      <div className="px-[22px]">
        <div className="flex items-center justify-between mt-[25px] mb-[12px]">
          <h2 className="text-[17px] font-[650] tracking-[-0.5px]">Delivery Sequence</h2>
        </div>
        
        <div className="bg-white border border-[#dce5df] rounded-[14px] overflow-hidden mb-[15px]">
          <div className="px-[17px]">
            {stops.map((stop, index) => {
              const isCompleted = ["delivered","partial","failed","refused","skipped"].includes(stop.status);
              const isLast = index === stops.length - 1;
              
              return (
                <div key={stop.stopId} className={`flex gap-[13px] py-[17px] ${!isLast ? 'border-b border-[#e7ede5]' : ''}`}>
                  <div className={`w-[32px] h-[32px] rounded-[10px] flex-shrink-0 grid place-items-center text-[12px] font-[700] mt-0.5
                    ${isCompleted ? "bg-[#edf0ed] text-[#8b988e]" : "bg-[#eaf6ef] text-[#146b45]"}
                  `}>
                    {isCompleted ? <CheckCircle2 size={16} /> : stop.stopOrder}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link 
                          href={isOnRoute && !isCompleted ? `/driver/stop/${stop.stopId}` : "#"}
                          className={cn(
                            "text-[14px] font-[650] block truncate",
                            isCompleted ? "line-through text-[#6b7870]" : "text-[#17221d]",
                            (!isOnRoute || isCompleted) && "pointer-events-none"
                          )}
                        >
                          {stop.outletName}
                        </Link>
                        <p className="text-[12px] text-[#6b7870] mt-1 truncate">
                          {stop.address || "Address not provided"}
                        </p>
                      </div>
                      
                      {isOnRoute && !isCompleted && (
                        <Link href={`/driver/stop/${stop.stopId}`} className="w-[48px] h-[48px] shrink-0 grid place-items-center -my-2 -mr-2 rounded-full hover:bg-[#f6f8f7]">
                          <Navigation size={18} className="text-[#146b45] stroke-[1.8]" />
                        </Link>
                      )}
                    </div>

                    <div className="flex gap-2 mt-2">
                      <span className="text-[10px] font-[650] bg-[#edf1ed] text-[#6b7870] px-2 py-1 rounded-[6px] whitespace-nowrap">
                        {stop.expectedKg} kg
                      </span>
                      {stop.status === "failed" && (
                        <span className="text-[10px] font-[650] bg-[#fcf2df] text-[#92611a] px-2 py-1 rounded-[6px] whitespace-nowrap flex items-center gap-1">
                          <AlertCircle size={10} /> FAILED
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
