"use client";

import Link from "next/link";
import { Truck, MapPin, ChevronRight, PackageCheck, User } from "lucide-react";
import { CapacityBar } from "@/components/shared/CapacityBar";
import { StatusChip } from "@/components/shared/StatusChip";

export function TripCard({ trip }: { trip: any }) {
  // Mocking loaded amounts based on stopsCompleted for UI purposes if missing
  const loadedWeight = trip.loadedWeightKg ?? Math.round(trip.weightKg * (trip.stopsCompleted / trip.stopCount));
  const loadedVolume = trip.loadedVolumeM3 ?? Number((trip.volumeM3 * (trip.stopsCompleted / trip.stopCount)).toFixed(1));

  return (
    <Link href={`/loader/trip/${trip.tripId}`} className="block">
      <div className="card-panel p-5 hover:border-wp-action transition-all cursor-pointer active:scale-[0.99] group h-full flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-wp-ink flex items-center gap-2 mb-1">
              <Truck size={20} className="text-wp-action" />
              {trip.vehicleId}
            </h3>
            <div className="text-sm text-wp-muted flex items-center gap-1.5">
              <User size={14} />
              {trip.driverName || "Unassigned"}
            </div>
          </div>
          <StatusChip status={trip.status} />
        </div>

        <div className="flex items-center gap-3 text-sm text-wp-ink mb-6 p-3 bg-wp-pale rounded-md border border-wp-border">
          <div className="flex-1">
            <div className="font-semibold">{trip.brand}</div>
            <div className="text-xs text-wp-muted flex items-center gap-1">
              <MapPin size={12} /> {trip.district}
            </div>
          </div>
          <div className="text-right border-l border-wp-border pl-3">
            <div className="font-bold text-xl">{trip.stopCount}</div>
            <div className="text-[10px] text-wp-muted uppercase">Stops</div>
          </div>
        </div>

        <div className="space-y-4 flex-1">
          <CapacityBar 
            label="Weight Loaded" 
            used={loadedWeight} 
            total={trip.weightKg} 
            unit="kg" 
          />
          <CapacityBar 
            label="Volume Loaded" 
            used={loadedVolume} 
            total={trip.volumeM3} 
            unit="m³" 
          />
        </div>

        <div className="mt-6 pt-4 border-t border-wp-border flex items-center justify-between text-wp-action font-semibold group-hover:text-wp-ink transition-colors">
          <span className="flex items-center gap-2">
            <PackageCheck size={18} />
            Start Loading
          </span>
          <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
}
