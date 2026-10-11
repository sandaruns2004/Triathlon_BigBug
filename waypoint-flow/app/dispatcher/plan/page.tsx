"use client";

import { useEffect, useState } from "react";
import { UnassignedOrders } from "@/components/dispatcher/PlanBuilder/UnassignedOrders";
import { RouteCanvas } from "@/components/dispatcher/PlanBuilder/RouteCanvas";
import { VehicleInspector } from "@/components/dispatcher/PlanBuilder/VehicleInspector";
import { ImpactTray } from "@/components/dispatcher/PlanBuilder/ImpactTray";
import type { Order, Vehicle } from "@/lib/allocation/engine";

export default function PlanBuilderPage() {
  const [planId, setPlanId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("draft");
  const [orders, setOrders] = useState<Order[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAllocating, setIsAllocating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      setError("");
      // Find today's plan
      const res = await fetch("/api/plans");
      const response = await res.json();
      if (!res.ok) throw Error(response.error || "Unable to load plans.");
      const { plans } = response;
      
      let currentPlanId = plans.length > 0 ? plans[0].planId : null;
      let currentStatus = plans.length > 0 ? plans[0].status : "draft";

      // If no plan exists, create one
      if (!currentPlanId) {
        const createRes = await fetch("/api/plans", { method: "POST" });
        const data = await createRes.json();
        if (!createRes.ok) throw Error(data.error || "Unable to create plan.");
        currentPlanId = data.plan.planId;
      }

      setPlanId(currentPlanId);
      setStatus(currentStatus);

      // Fetch plan details
      const detailRes = await fetch(`/api/plans/${currentPlanId}`);
      const detail = await detailRes.json();
      if (!detailRes.ok) throw Error(detail.error || "Unable to load this plan.");
      setOrders(detail.unassignedOrders || []);
      setVehicles(detail.vehicles || []);
      setTrips(detail.trips || []);
      
      if (detail.trips?.length > 0 && !selectedTripId) {
        setSelectedTripId(detail.trips[0].tripId);
      }
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAllocate = async () => {
    if (!planId) return;
    setIsAllocating(true);
    setError("");
    try {
      const res = await fetch(`/api/plans/${planId}/allocate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw Error(data.error || "Unable to allocate orders.");
      await fetchData();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsAllocating(false);
    }
  };

  const handlePublish = async () => {
    if (!planId) return;
    setIsPublishing(true);
    setError("");
    try {
      const res = await fetch(`/api/plans/${planId}/publish`, { method: "PATCH" });
      const data = await res.json();
      if (!res.ok) throw Error(data.error || "Unable to publish plan.");
      setStatus("published");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsPublishing(false);
    }
  };

  if (isLoading) {
    return <div className="h-full flex items-center justify-center">Loading plan...</div>;
  }

  const selectedTrip = trips.find(t => t.tripId === selectedTripId);
  const selectedVehicle = selectedTrip 
    ? vehicles.find(v => v.vehicleId === selectedTrip.vehicleId)
    : null;

  return (
    <div className="h-full flex flex-col">
      {error && <div role="alert" className="mb-4 p-4 border border-red-200 bg-red-50 rounded text-red-700">{error} <button onClick={fetchData} className="underline">Retry</button></div>}
      <div className="flex-1 grid grid-cols-[300px_1fr_300px] gap-6 min-h-0">
        <div className="min-h-0">
          <UnassignedOrders orders={orders} />
        </div>
        <div className="min-h-0">
          <RouteCanvas 
            trips={trips} 
            selectedTripId={selectedTripId} 
            setSelectedTripId={setSelectedTripId} 
          />
        </div>
        <div className="min-h-0">
          <VehicleInspector vehicle={selectedVehicle} trip={selectedTrip} />
        </div>
      </div>
      
      <ImpactTray 
        unassignedCount={orders.length}
        tripsCount={trips.length}
        planStatus={status}
        onAllocate={handleAllocate}
        onPublish={handlePublish}
        isAllocating={isAllocating}
        isPublishing={isPublishing}
      />
    </div>
  );
}
