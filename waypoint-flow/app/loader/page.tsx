"use client";

import { useEffect, useState } from "react";
import { TripCard } from "@/components/loader/TripCard";
import { PackageOpen, AlertCircle, CheckCircle2, Truck } from "lucide-react";
import Link from "next/link";
import { TripLoaderPanel } from "@/components/loader/TripLoaderPanel";

export default function LoadBoardPage() {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = () => {
    fetch("/api/loader/trips")
      .then(res => res.json())
      .then(data => {
        setTrips(data.trips || []);
        setLoading(false);
      })
      .catch(e => {
        console.error("Failed to load trips:", e);
        setLoading(false);
      });
  };

  if (loading) {
    return <div className="p-8 text-center text-[#63716a]">Loading trips...</div>;
  }

  const scheduled = trips.filter(t => t.status === "planned");
  const loadingLanes = trips.filter(t => t.status === "loading" && !t.held);
  const issues = trips.filter(t => t.held || t.status === "loading_issue");
  const ready = trips.filter(t => t.status === "ready_to_depart");

  return (
    <div className="p-[20px] md:p-[30px] lg:px-[34px] w-full max-w-[1800px] mx-auto bg-[#f6f8f7] min-h-screen">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-[27px] gap-[15px]">
        <div>
          <div className="text-[10px] font-[700] uppercase tracking-[1.4px] text-[#63716a]">DISTRIBUTION WORKSPACE</div>
          <h1 className="text-[28px] font-[650] tracking-[-1px] my-[5px] text-[#17221d]">Load board</h1>
          <p className="text-[12px] text-[#63716a]">Peliyagoda · Morning shift · Load safely, hand over with confidence.</p>
        </div>
        <div className="text-[10px] font-[600] px-[7px] py-[4px] rounded-[4px] bg-[#eff2f1] text-[#697873] whitespace-nowrap flex items-center gap-[5px]">
          {issues.length > 0 ? (
            <span className="text-[#b6443c] bg-[#fceeea] px-[7px] py-[4px] rounded-[4px] -m-[4px] mr-1">{issues.length} vehicle{issues.length !== 1 ? 's' : ''} blocked</span>
          ) : (
            <span>{loadingLanes.length} vehicles loading · {ready.length} ready</span>
          )}
        </div>
      </div>

      {trips.length === 0 ? (
        <div className="bg-white border border-[#dce5df] rounded-[10px] p-[32px] text-center text-[#63716a] flex flex-col items-center justify-center">
          <PackageOpen size={48} className="mb-4 opacity-50" />
          <h3 className="text-[14px] font-[650] mb-[8px] text-[#17221d]">No trips to load</h3>
          <p className="max-w-md">There are no planned trips waiting for loading at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[14px] mb-[22px]">
          {/* Scheduled Lane */}
          <div className="bg-[#edf2ee] border border-[#dfe7e0] p-[14px] rounded-[9px]">
            <h3 className="text-[11px] font-[650] text-[#63716a] mb-[13px] uppercase tracking-wide">Scheduled</h3>
            <div className="flex flex-col gap-[10px]">
              {scheduled.length === 0 && <div className="text-[11px] text-[#8a968f] italic px-2">No scheduled trips</div>}
              {scheduled.map(trip => <CompactTripCard key={trip.tripId} trip={trip} badge="❄ Refrigerated" badgeClass="bg-[#eff2f1] text-[#697873]" selected={selectedTripId === trip.tripId} onClick={() => setSelectedTripId(trip.tripId)} />)}
            </div>
          </div>
          
          {/* Loading Lane */}
          <div className="bg-[#edf2ee] border border-[#dfe7e0] p-[14px] rounded-[9px]">
            <h3 className="text-[11px] font-[650] text-[#63716a] mb-[13px] uppercase tracking-wide">Loading</h3>
            <div className="flex flex-col gap-[10px]">
              {loadingLanes.length === 0 && <div className="text-[11px] text-[#8a968f] italic px-2">No active loading</div>}
              {loadingLanes.map(trip => <CompactTripCard key={trip.tripId} trip={trip} badge="❄ Refrigerated" badgeClass="bg-[#eff2f1] text-[#697873]" selected={selectedTripId === trip.tripId} onClick={() => setSelectedTripId(trip.tripId)} />)}
            </div>
          </div>
          
          {/* Loading issue Lane */}
          <div className="bg-[#edf2ee] border border-[#dfe7e0] p-[14px] rounded-[9px]">
            <h3 className="text-[11px] font-[650] text-[#63716a] mb-[13px] uppercase tracking-wide">Loading issue</h3>
            <div className="flex flex-col gap-[10px]">
              {issues.length === 0 && <div className="text-[11px] text-[#8a968f] italic px-2">No reported issues</div>}
              {issues.map(trip => <CompactTripCard key={trip.tripId} trip={trip} badge="⚠️ Issue reported" badgeClass="bg-[#fceeea] text-[#b6443c]" selected={selectedTripId === trip.tripId} onClick={() => setSelectedTripId(trip.tripId)} />)}
            </div>
          </div>
          
          {/* Ready to depart Lane */}
          <div className="bg-[#edf2ee] border border-[#dfe7e0] p-[14px] rounded-[9px]">
            <h3 className="text-[11px] font-[650] text-[#63716a] mb-[13px] uppercase tracking-wide">Ready to depart</h3>
            <div className="flex flex-col gap-[10px]">
              {ready.length === 0 && <div className="text-[11px] text-[#8a968f] italic px-2">No trips ready</div>}
              {ready.map(trip => <CompactTripCard key={trip.tripId} trip={trip} badge="✓ Checked" badgeClass="bg-[#eaf6ef] text-[#146b45]" selected={selectedTripId === trip.tripId} onClick={() => setSelectedTripId(trip.tripId)} />)}
            </div>
          </div>
        </div>
      )}

      {selectedTripId && (
        <TripLoaderPanel tripId={selectedTripId} onUpdate={fetchTrips} />
      )}
    </div>
  );
}

function CompactTripCard({ trip, badge, badgeClass, selected, onClick }: { trip: any, badge: string, badgeClass: string, selected: boolean, onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`bg-white border ${selected ? 'border-[#146b45] shadow-[0_0_0_1px_#146b45]' : 'border-[#dce5df] hover:border-[#146b45]'} rounded-[8px] p-[16px] min-h-[116px] transition-all cursor-pointer group`}
    >
      <div className="flex justify-between items-center gap-[12px]">
        <h3 className={`text-[14px] font-[650] m-0 transition-colors ${selected ? 'text-[#146b45]' : 'group-hover:text-[#146b45] text-[#17221d]'}`}>
          {trip.vehicleId}
        </h3>
        <Truck size={19} strokeWidth={1.7} className={selected ? "text-[#146b45]" : "text-[#63716a]"} />
      </div>
      <p className="text-[11px] text-[#63716a] my-[8px]">{trip.stopCount} stops · Depart {(trip as any).estimatedDeparture || "08:30"}</p>
      <span className={`inline-flex items-center gap-[5px] text-[10px] font-[600] px-[7px] py-[4px] rounded-[4px] whitespace-nowrap mt-[2px] ${badgeClass}`}>
        {badge}
      </span>
    </div>
  );
}

