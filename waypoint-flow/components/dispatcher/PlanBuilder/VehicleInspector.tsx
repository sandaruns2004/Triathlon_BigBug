"use client";

import { CapacityBar } from "@/components/shared/CapacityBar";
import { Snowflake, Truck } from "lucide-react";
import type { Vehicle } from "@/lib/allocation/engine";

interface VehicleInspectorProps {
  vehicle?: Vehicle | null;
  trip?: any; // To get the current used weight/volume
}

export function VehicleInspector({ vehicle, trip }: VehicleInspectorProps) {
  if (!vehicle) {
    return (
      <div className="card-panel h-full p-4 flex flex-col items-center justify-center text-wp-muted text-sm text-center">
        <Truck size={32} className="mb-2 text-wp-border" />
        Select a trip to view vehicle constraints
      </div>
    );
  }

  const usedWeight = trip?.weightKg || trip?.orders?.reduce((sum: number, o: any) => sum + o.orderWeightKg, 0) || 0;
  const usedVolume = trip?.volumeM3 || trip?.orders?.reduce((sum: number, o: any) => sum + o.orderVolumeM3, 0) || 0;

  return (
    <div className="card-panel h-full flex flex-col">
      <div className="p-4 border-b border-wp-border">
        <h2 className="text-sm font-semibold text-wp-ink flex items-center justify-between">
          Vehicle Inspector
          {vehicle.temp === "reefer" && (
            <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              <Snowflake size={12} /> Reefer
            </span>
          )}
        </h2>
      </div>

      <div className="p-4 space-y-6">
        <div>
          <div className="text-lg font-bold text-wp-ink flex items-center gap-2 mb-1">
            <Truck size={20} className="text-wp-action" />
            {vehicle.vehicleId}
          </div>
          <div className="text-xs text-wp-muted capitalize">
            {vehicle.type} • {vehicle.depot} Depot
          </div>
        </div>

        <div className="space-y-4">
          <CapacityBar 
            label="Weight Capacity" 
            used={usedWeight} 
            total={vehicle.weightCapKg} 
            unit="kg" 
          />
          <CapacityBar 
            label="Volume Capacity" 
            used={usedVolume} 
            total={vehicle.volumeCapM3} 
            unit="m³" 
          />
        </div>

        <div className="pt-4 border-t border-wp-border">
          <h3 className="text-xs font-semibold text-wp-muted uppercase tracking-wider mb-3">Operating Constraints</h3>
          <ul className="space-y-2 text-sm text-wp-ink">
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-wp-green" />
              Depot restricted to {vehicle.depot}
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-wp-green" />
              {vehicle.temp === "reefer" ? "Chilled & Frozen capable" : "Ambient cargo only"}
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-wp-green" />
              {vehicle.type === "van" ? "Access to van-only zones" : "Standard dock access"}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
