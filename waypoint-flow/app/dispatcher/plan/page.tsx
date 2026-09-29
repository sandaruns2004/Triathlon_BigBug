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

  const fetchData = async () => {
    try {
      // Find today's plan
      const res = await fetch("/api/plans");
      const { plans } = await res.json();
      
      let currentPlanId = plans.length > 0 ? plans[0].planId : null;
      let currentStatus = plans.length > 0 ? plans[0].status : "draft";

      // If no plan exists, create one
      if (!currentPlanId) {
        const createRes = await fetch("/api/plans", { method: "POST" });
        const data = await createRes.json();
        currentPlanId = data.plan.planId;
      }

      setPlanId(currentPlanId);
      setStatus(currentStatus);

      // Fetch plan details
      const detailRes = await fetch(`/api/plans/${currentPlanId}`);
      const detail = await detailRes.json();
      setOrders(detail.unassignedOrders || []);
      setVehicles(detail.vehicles || []);
      setTrips(detail.trips || []);
      
      if (detail.trips?.length > 0 && !selectedTripId) {
        setSelectedTripId(detail.trips[0].tripId);
      }
    } catch (error) {
      console.error("Error loading plan:", error);
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
    try {
      const res = await fetch(`/api/plans/${planId}/allocate`, { method: "POST" });
      if (res.ok) await fetchData(); // Reload to get new trips and orders state
    } catch (e) {
      console.error(e);
    } finally {
      setIsAllocating(false);
    }
  };

  const handlePublish = async () => {
    if (!planId) return;
    setIsPublishing(true);
    try {
      const res = await fetch(`/api/plans/${planId}/publish`, { method: "PATCH" });
      if (res.ok) setStatus("published");
    } catch (e) {
      console.error(e);
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
