"use client";

import { useEffect, useState } from "react";
import { TripCard } from "@/components/loader/TripCard";
import { PackageOpen } from "lucide-react";

export default function LoadBoardPage() {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-wp-muted">Loading trips...</div>;
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-wp-ink">Load Board</h1>
        <p className="text-wp-muted mt-2 text-sm md:text-base">
          Trips pending loading at your depot today. Select a trip to scan items and mark it ready to depart.
        </p>
      </div>

      {trips.length === 0 ? (
        <div className="card-panel p-12 flex flex-col items-center justify-center text-wp-muted text-center border-dashed border-2">
          <PackageOpen size={48} className="mb-4 text-wp-border" />
          <h2 className="text-xl font-bold text-wp-ink mb-2">No trips to load</h2>
          <p className="max-w-md">There are no planned trips waiting for loading at the moment. Wait for the dispatcher to publish a new plan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {trips.map(trip => (
            <TripCard key={trip.tripId} trip={trip} />
          ))}
        </div>
      )}
    </div>
  );
}
