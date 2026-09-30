"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, PackageCheck, AlertTriangle, ArrowDownToLine, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CapacityBar } from "@/components/shared/CapacityBar";
import { StatusChip } from "@/components/shared/StatusChip";
import { uploadPhoto } from "@/lib/mobile/browser";

export default function LoaderTripPage() {
  const params = useParams();
  const router = useRouter();
  const [trip, setTrip] = useState<any>(null);
  const [stops, setStops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [shortfallStop, setShortfallStop] = useState<string | null>(null);
  const [shortfallReason, setShortfallReason] = useState("");
  const [shortfallPhotos, setShortfallPhotos] = useState<{file:File;id:string}[]>([]);
  const [message, setMessage] = useState("");

  const fetchTripDetails = () => {
    fetch(`/api/loader/trips/${params.id}`)
      .then(res => res.json())
      .then(data => {
        setTrip(data.trip);
        setStops(data.stops || []);
        setLoading(false);
      })
      .catch(e => {
        setMessage((e as Error).message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTripDetails();
  }, [params.id]);

  const handleScanItem = async (stopId: string) => {
    setActionLoading(`load-${stopId}`);
    try {
      const res = await fetch(`/api/loader/stops/${stopId}/load`, { method: "PATCH" });
      if(!res.ok) throw Error((await res.json()).error);
      fetchTripDetails();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReportShortfall = async (stopId: string, outletName: string) => {
    setShortfallStop(stopId);setShortfallReason("");setShortfallPhotos([]);
  };
  const submitShortfall = async () => {
    if(!shortfallStop || !shortfallReason.trim() || actionLoading)return;
    const stopId=shortfallStop,detail=shortfallReason.trim();
    setActionLoading(`shortfall-${stopId}`);
    try {
      const evidenceIds=[];
      for(const photo of shortfallPhotos)evidenceIds.push(await uploadPhoto(photo.file,photo.id,{tripId:trip.tripId,stopId}));
      const res=await fetch("/api/exceptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "shortfall",
          title: "Loading Shortfall",
          detail,
          evidenceIds,
          vehicleId: trip.vehicleId,
          tripId: trip.tripId,
          stopId,
          severity: "high",
          depot: trip.depot,
        })
      });
      if(!res.ok)throw Error((await res.json()).error);
      setShortfallStop(null);
      fetchTripDetails();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading trip data...</div>;
  if (!trip) return <div className="p-8 text-center text-red-600">Trip not found.</div>;

  const allLoaded = trip.released === true && !trip.held;
  const loadedWeight = stops.filter(s => s.status === "loaded" || s.status === "delivered").reduce((sum, s) => sum + (s.expectedKg || 0), 0);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto w-full">
      <p role="status">{message}</p>
      {shortfallStop && <aside role="dialog" aria-label="Report loading shortfall" className="card-panel p-5 mb-5 space-y-3 bg-amber-50">
        <h2 className="font-bold">Report shortfall · {shortfallStop}</h2>
        <p>This holds departure until Dispatcher approves the manifest.</p>
        <label className="block">Damage or missing goods<textarea maxLength={1000} value={shortfallReason} onChange={e=>setShortfallReason(e.target.value)} className="border p-2 w-full"/></label>
        <label className="block">Photos (optional, up to three JPEG/PNG, 2 MB each)<input type="file" accept="image/jpeg,image/png" multiple capture="environment" disabled={!!actionLoading} onChange={e=>setShortfallPhotos(Array.from(e.target.files??[]).slice(0,3).map(file=>({file,id:crypto.randomUUID()})))}/></label>
        <button disabled={!!actionLoading||!shortfallReason.trim()} onClick={submitShortfall} className="btn btn-primary">Submit shortfall and hold</button>
        <button disabled={!!actionLoading} onClick={()=>setShortfallStop(null)} className="btn">Cancel</button>
      </aside>}
      <button 
        onClick={() => router.push("/loader")}
        className="text-wp-muted hover:text-wp-ink flex items-center gap-1 mb-6 text-sm font-semibold transition-colors"
      >
        <ChevronLeft size={16} /> Back to Load Board
      </button>

      <div className="card-panel p-6 mb-8 bg-wp-ink text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 mb-1">
              <ArrowDownToLine className="text-wp-green" />
              Loading {trip.vehicleId}
            </h1>
            <p className="text-white/70 text-sm">
              {trip.driverName || "Unassigned"} • {trip.brand} • {trip.district}
            </p>
          </div>
          <StatusChip status={trip.status} />
        </div>

        <CapacityBar 
          label="Weight Loaded (kg)" 
          used={loadedWeight} 
          total={trip.weightKg} 
          unit="kg" 
          invertColors={true}
        />
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-wp-ink">Reverse Loading Sequence</h2>
        <span className="text-xs font-semibold text-wp-muted bg-wp-pale px-2 py-1 rounded">
          Last Stop Loaded First (LIFO)
        </span>
      </div>

      <div className="space-y-4">
        {stops.map((stop) => {
          const isLoaded = ["loaded", "delivered", "shortfall_reported"].includes(stop.status);
          return (
            <div 
              key={stop.stopId} 
              className={cn(
                "card-panel p-5 transition-all border-l-4",
                isLoaded ? "border-l-wp-green bg-wp-pale/50 opacity-70" : "border-l-wp-action",
                stop.status === "shortfall_reported" && "border-l-amber-500 bg-amber-50"
              )}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-wp-ink text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                      STOP {stop.stopOrder}
                    </span>
                    <h3 className="font-bold text-wp-ink text-lg">{stop.outletName}</h3>
                  </div>
                  <p className="text-sm text-wp-muted">{stop.expectedKg} kg</p>
                </div>
                <div>
                  <StatusChip status={stop.status === "needs_planning" ? "loading" : stop.status} />
                </div>
              </div>

              {!isLoaded && (
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-wp-border">
                  <button 
                    onClick={() => handleScanItem(stop.stopId)}
                    disabled={actionLoading !== null}
                    className="flex-1 btn btn-primary py-3 flex items-center justify-center gap-2"
                  >
                    {actionLoading === `load-${stop.stopId}` ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <PackageCheck size={18} />
                    )}
                    Scan & Mark Loaded
                  </button>
                  <button 
                    onClick={() => handleReportShortfall(stop.stopId, stop.outletName)}
                    disabled={actionLoading !== null}
                    className="px-4 py-3 bg-red-50 text-red-600 rounded-md font-semibold hover:bg-red-100 transition-colors flex items-center gap-2"
                  >
                    <AlertTriangle size={18} />
                    <span className="hidden sm:inline">Report Shortfall</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {allLoaded && (
        <div className="mt-8 p-6 bg-wp-green/10 border border-wp-green rounded-lg text-center">
          <PackageCheck size={32} className="text-wp-green mx-auto mb-3" />
          <h3 className="text-xl font-bold text-wp-ink mb-2">Loading Complete!</h3>
          <p className="text-wp-muted mb-4">All orders have been loaded or flagged. The vehicle is ready for departure.</p>
          <button 
            onClick={() => router.push("/loader")}
            className="btn bg-wp-green text-white hover:bg-wp-green/90 px-8"
          >
            Return to Load Board
          </button>
        </div>
      )}
    </div>
  );
}
