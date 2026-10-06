"use client";

import { useEffect, useState, useRef } from "react";
import { envelope } from "@/lib/mobile/browser";
import Link from "next/link";
import { Play, Navigation, AlertCircle, RefreshCw, CheckCircle2, Shield, ChevronRight, Clock, MapPin, Truck } from "lucide-react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

export default function DriverTodayPage() {
  const { data: session } = useSession();
  const userName = (session?.user as any)?.name || "Driver";
  
  const [trip, setTrip] = useState<any>(null);
  const [stops, setStops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [starting, setStarting] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
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
    const timer = setInterval(fetchTrip, 30000);
    return () => clearInterval(timer);
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

  if (loading) return <div className="p-8 text-center text-[#6b7870]">Loading route...</div>;

  return (
    <div className="flex flex-col min-h-full bg-[#f6f8f7] px-[22px] pt-[10px] pb-[20px]">
      {message && <p role="status" className="py-2 text-sm text-[#ae483a]">{message}</p>}
      
      <div className="flex items-center justify-between mb-[7px]">
        <span className="text-[10px] tracking-[1.6px] uppercase font-[700] text-[#6b7870]">Tuesday, 21 April</span>
        <Link href="/driver/sync" className="bg-transparent border-none p-0 min-h-[48px] flex items-center justify-center">
          <span className="inline-flex items-center gap-[5px] rounded-[6px] px-[8px] py-[5px] text-[10px] font-[650] bg-[#fcf2df] text-[#92611a] whitespace-nowrap">
            <RefreshCw size={12} /> 0 queued
          </span>
        </Link>
      </div>
      
      <div className="mb-[23px]">
        <div className="text-[10px] tracking-[1.6px] uppercase font-[700] text-[#6b7870]">YOUR DAY, AT A GLANCE</div>
        <h1 className="text-[28px] leading-[1.2] tracking-[-1px] font-[650] my-[8px]">Good morning, {userName.split(' ')[0]}</h1>
        <p className="text-[13px] text-[#6b7870] leading-[1.55]">Peliyagoda depot · Morning shift</p>
      </div>

      {!trip ? (
        <div className="bg-white border border-[#dce5df] rounded-[14px] p-[32px] text-center mb-[15px]">
          <div className="w-[140px] h-[110px] mx-auto mb-4 bg-[#f2f6ef] rounded-[10px] flex items-center justify-center">
             <CheckCircle2 size={48} className="text-[#146b45] opacity-50" />
          </div>
          <h2 className="text-[19px] tracking-[-0.5px] font-[650]">That's a day well delivered.</h2>
          <p className="text-[14px] text-[#6b7870] mt-3">All stops recorded. Check your activity for any records waiting to sync.</p>
        </div>
      ) : (
        <>
          {/* ── Trip Hero ── */}
          <section className="relative overflow-hidden rounded-[18px] bg-[#146b45] text-white p-[22px] mb-[15px]">
            <div className="pointer-events-none absolute -right-[56px] top-[50px] w-[205px] h-[205px] rounded-full border border-white/10 shadow-[0_0_0_30px_rgba(255,255,255,0.015),0_0_0_60px_rgba(255,255,255,0.01)]" />
            
            <div className="relative z-10">
              <div className="flex justify-between items-center w-full">
                <span className="text-[#acd0bb] text-[10px] font-bold uppercase tracking-[1.6px]">YOUR CURRENT TRIP</span>
                <span className="inline-flex items-center gap-[5px] rounded-[6px] px-[8px] py-[5px] text-[10px] font-[650] bg-white/10 text-[#e8f5e9] border border-white/20 whitespace-nowrap">
                  <CheckCircle2 size={12} /> {["on_route", "returning"].includes(trip.status) ? "On route" : !trip.held ? "Ready to depart" : "Awaiting loading"}
                </span>
              </div>
              
              <div className="flex items-center gap-[12px] min-h-[82px] mt-[12px]">
                <h2 className="flex-1 min-w-0 m-0 text-[27px] leading-[1.2] font-[650] tracking-tight">
                  {trip.vehicleId} <span className="text-[13px] text-[#b7d6c4] font-[400] tracking-normal">/ Trip 1</span>
                </h2>
              </div>
              
              <p className="text-[#c0ddcb] text-[12px] mt-[6px]">
                Peliyagoda → {trip.district}
              </p>
              
              <div className="flex my-[23px] gap-[28px]">
                <div>
                  <strong className="block text-[23px] font-semibold">{trip.stopCount}</strong>
                  <small className="block text-[10px] text-[#b9d7c6] font-bold uppercase tracking-[1.6px] mt-1">delivery stops</small>
                </div>
                <div className="w-px bg-white/20"></div>
                <div>
                  <strong className="block text-[23px] font-semibold">{trip.stopsCompleted}</strong>
                  <small className="block text-[10px] text-[#b9d7c6] font-bold uppercase tracking-[1.6px] mt-1">completed</small>
                </div>
                <div className="w-px bg-white/20"></div>
                <div>
                  <strong className="block text-[23px] font-semibold">{trip.weightKg}</strong>
                  <small className="block text-[10px] text-[#b9d7c6] font-bold uppercase tracking-[1.6px] mt-1">Kg</small>
                </div>
              </div>

              {!["on_route", "returning"].includes(trip.status) ? (
                <button 
                  onClick={handleStartRoute}
                  disabled={trip.held}
                  className="w-full bg-white disabled:bg-white/90 disabled:text-[#146b45]/50 text-[#146b45] font-semibold text-[14px] h-[48px] rounded-[9px] flex items-center justify-center gap-[9px] hover:bg-[#f0f6f1] transition-colors"
                >
                  <Truck size={20} />
                  {!trip.held ? "Start trip" : "Waiting for loader"}
                  <ChevronRight size={18} />
                </button>
              ) : (
                <div className="w-full bg-white text-[#146b45] font-semibold text-[14px] h-[48px] rounded-[9px] flex items-center justify-center gap-[9px] opacity-90 cursor-default">
                  <Navigation size={20} className="-rotate-45" />
                  Trip in progress
                </div>
              )}

              <div className="mt-[13px] text-center text-[#c9e2d2] text-[10px] flex justify-center items-center gap-[5px]">
                ❄ Refrigerated · Maintain 2–4°C
              </div>
            </div>
          </section>

          {/* ── Ready Card ── */}
          <div className="flex items-start gap-[12px] p-[17px] bg-[#eff5ed] border border-[#dce8d7] rounded-[12px] mb-[15px] flex-col sm:flex-row">
            <div className="flex gap-[12px] w-full">
              <Shield size={20} className="text-[#146b45] mt-0.5 shrink-0" />
              <div className="flex-1">
                <h3 className="text-[12px] font-[650] mb-[5px] text-[#17221d]">
                  {!trip.held ? "Checked, loaded, ready." : "Your loading team is preparing this trip."}
                </h3>
                <p className="text-[11px] text-[#6b7870] mb-[5px]">
                  {!trip.held ? "Manifest verified by Sanath. Vehicle temperature confirmed." : "Departure stays locked until the loader releases your vehicle."}
                </p>
                <button 
                  onClick={() => setShowNotes(!showNotes)}
                  className="bg-transparent border-none text-[#146b45] text-[12px] p-0 min-h-[auto] flex items-center font-[650] mt-1 hover:underline focus:outline-none"
                >
                  {showNotes ? "Hide loading notes" : "View loading notes"} <ChevronRight size={14} className={cn("transition-transform", showNotes && "rotate-90")} />
                </button>
                
                {showNotes && (
                  <div className="mt-[12px] p-[12px] bg-white rounded-[8px] border border-[#dce8d7] text-[12px] text-[#17221d]">
                    <strong>Handling instructions:</strong>
                    <p className="mt-1 text-[#6b7870]">{trip.handling || "No specific instructions provided."}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-[25px] mb-[12px]">
            <h2 className="text-[17px] font-[650] tracking-[-0.5px]">All stops</h2>
            <span className="text-[13px] text-[#6b7870]">{trip.stopsCompleted} / {trip.stopCount} done</span>
          </div>
          
          <div className="bg-white border border-[#dce5df] rounded-[14px] p-[22px] mb-[15px]">
            {stops.map((stop, index) => {
              const isCompleted = ["delivered","partial","failed","refused","skipped"].includes(stop.status);
              
              return (
                <div key={stop.stopId} className="flex gap-[13px] py-[17px] border-b border-[#e7ede5] last:border-0">
                  <div className={`w-[32px] h-[32px] rounded-[10px] flex-shrink-0 grid place-items-center text-[12px] font-[700] mt-0.5
                    ${isCompleted ? "bg-[#edf0ed] text-[#8b988e]" : "bg-[#eaf6ef] text-[#146b45]"}
                  `}>
                    {isCompleted ? <CheckCircle2 size={16} /> : `0${stop.stopOrder}`}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link 
                          href={!isCompleted && ["on_route", "returning"].includes(trip.status) ? `/driver/stop/${stop.stopId}` : "#"}
                          className={cn(
                            "text-[14px] font-[650] block truncate",
                            isCompleted ? "text-[#6b7870]" : "text-[#17221d]",
                            (isCompleted || !["on_route", "returning"].includes(trip.status)) && "pointer-events-none"
                          )}
                        >
                          {stop.outletName}
                        </Link>
                        <p className="text-[12px] text-[#6b7870] mt-1">
                          {isCompleted ? "Delivery recorded" : stop.address || "Address not provided"}
                        </p>
                      </div>
                      
                      {!isCompleted && ["on_route", "returning"].includes(trip.status) && (
                        <Link href={`/driver/stop/${stop.stopId}`} className="shrink-0">
                          <ChevronRight size={20} className="text-[#146b45]" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-[25px] mb-[12px]">
            <h2 className="text-[17px] font-[650] tracking-[-0.5px]">Later today</h2>
            <span className="inline-flex items-center gap-[5px] rounded-[6px] px-[8px] py-[5px] text-[10px] font-[650] bg-[#edf1ed] text-[#6b7870] whitespace-nowrap">
              <i className="w-[5px] h-[5px] rounded-full bg-current"></i> Trip 2
            </span>
          </div>

          <div className="bg-white border border-[#dce5df] rounded-[14px] p-[18px] mb-[15px]">
            <div className="flex items-center gap-[10px]">
              <Clock size={19} className="text-[#6b7870]" strokeWidth={1.8} />
              <div>
                <h3 className="text-[13px] font-[650]">Your next assignment</h3>
                <p className="text-[11px] leading-[1.5] text-[#6b7870]">Available after Trip 1 completion.</p>
              </div>
            </div>
          </div>

          <p className="text-[11px] leading-[1.5] text-[#6b7870] text-center mb-[20px]">
            A steady day starts with a safe departure.
          </p>
        </>
      )}
    </div>
  );
}

