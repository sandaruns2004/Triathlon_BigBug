"use client";

import { useState } from "react";
import { Truck, MapPin, Navigation, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Trip } from "@/lib/allocation/engine";

interface RouteCanvasProps {
  trips: any[];
  selectedTripId: string | null;
  setSelectedTripId: (id: string) => void;
}

export function RouteCanvas({ trips, selectedTripId, setSelectedTripId }: RouteCanvasProps) {
  if (trips.length === 0) {
    return (
      <div className="card-panel h-full flex flex-col items-center justify-center p-8 text-center bg-wp-canvas border-dashed border-2 border-wp-border">
        <Navigation size={48} className="text-wp-border mb-4" />
        <h3 className="text-lg font-semibold text-wp-ink mb-2">No trips planned yet</h3>
        <p className="text-sm text-wp-muted max-w-sm">
          Use the <strong>Auto-suggest</strong> button below to let the allocation engine build optimal routes, or drag orders here to plan manually.
        </p>
      </div>
    );
  }

  const selectedTrip = trips.find(t => t.tripId === selectedTripId) || trips[0];
  if (!selectedTripId && trips.length > 0) {
    setSelectedTripId(trips[0].tripId);
  }

  return (
    <div className="card-panel h-full flex flex-col overflow-hidden">
      {/* Trip Tabs */}
      <div className="flex overflow-x-auto border-b border-wp-border bg-wp-canvas hide-scrollbar">
        {trips.map((trip) => (
          <button
            key={trip.tripId}
            onClick={() => setSelectedTripId(trip.tripId)}
            className={cn(
              "flex-shrink-0 px-4 py-3 text-sm font-semibold border-r border-wp-border transition-colors",
              selectedTripId === trip.tripId
                ? "bg-white text-wp-action border-b-2 border-b-wp-action"
                : "text-wp-muted hover:bg-wp-pale"
            )}
          >
            {trip.tripId}
          </button>
        ))}
      </div>

      {/* Canvas Area */}
      <div className="flex-1 bg-white p-6 overflow-auto">
        {selectedTrip && (
          <div className="max-w-xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-bold text-wp-ink flex items-center gap-2">
                  <Truck size={24} className="text-wp-action" />
                  {selectedTrip.vehicleId}
                </h2>
                <div className="text-sm text-wp-muted mt-1">
                  {selectedTrip.brand} • {selectedTrip.district} • {selectedTrip.orders?.length || selectedTrip.stopCount} stops
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-wp-ink flex items-center justify-end gap-1">
                  <Clock size={14} className="text-wp-muted" />
                  {selectedTrip.timeBudgetUsed ? Math.round(selectedTrip.timeBudgetUsed / 60) : 4}h {selectedTrip.timeBudgetUsed ? selectedTrip.timeBudgetUsed % 60 : 30}m
                </div>
                <div className="text-xs text-wp-muted mt-1">Est. duration</div>
              </div>
            </div>

            {/* Stops Timeline */}
            <div className="relative pl-6 space-y-6 before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-wp-border">
              {/* Depot Start */}
              <div className="relative flex items-center gap-4">
                <div className="absolute left-[-24px] w-6 h-6 rounded-full bg-wp-ink border-4 border-white flex items-center justify-center z-10" />
                <div className="text-sm font-bold text-wp-ink">Depart {selectedTrip.depot} Depot</div>
              </div>

              {/* Orders */}
              {(selectedTrip.orders || Array.from({length: selectedTrip.stopCount})).map((order: any, idx: number) => (
                <div key={order?.orderId || idx} className="relative flex items-start gap-4">
                  <div className="absolute left-[-24px] mt-1 w-6 h-6 rounded-full bg-white border-2 border-wp-action text-wp-action flex items-center justify-center text-xs font-bold z-10">
                    {idx + 1}
                  </div>
                  <div className="bg-white border border-wp-border rounded-card p-4 w-full shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-bold text-wp-ink">{order?.outletId || "Store"}</div>
                      <div className="text-xs text-wp-muted">{order?.orderWeightKg || "0"} kg</div>
                    </div>
                    <div className="text-sm text-wp-muted flex items-center gap-1">
                      <MapPin size={14} /> {order?.district || "District"}
                    </div>
                  </div>
                </div>
              ))}

              {/* Depot Return */}
              <div className="relative flex items-center gap-4">
                <div className="absolute left-[-24px] w-6 h-6 rounded-full bg-wp-ink border-4 border-white flex items-center justify-center z-10" />
                <div className="text-sm font-bold text-wp-ink">Return to Depot</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
