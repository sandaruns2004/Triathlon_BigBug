"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, PackageCheck, AlertTriangle, ArrowDownToLine, Loader2, X, Camera } from "lucide-react";
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
  
  // Shortfall Panel State
  const [shortfallStop, setShortfallStop] = useState<{ id: string, name: string } | null>(null);
  const [shortfallReason, setShortfallReason] = useState("");
  const [shortfallPhotos, setShortfallPhotos] = useState<{file: File; id: string; url: string}[]>([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"info"|"error"|"success">("info");

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
        setMessageType("error");
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
      setMessage("Stop marked as loaded successfully.");
      setMessageType("success");
      fetchTripDetails();
    } catch (e) {
      setMessage((e as Error).message);
      setMessageType("error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReportShortfall = (stopId: string, outletName: string) => {
    setShortfallStop({ id: stopId, name: outletName });
    setShortfallReason("");
    setShortfallPhotos([]);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 3 - shortfallPhotos.length);
    const newPhotos = files.map(file => ({
      file,
      id: crypto.randomUUID(),
      url: URL.createObjectURL(file)
    }));
    setShortfallPhotos(prev => [...prev, ...newPhotos]);
  };

  const removePhoto = (id: string) => {
    setShortfallPhotos(prev => prev.filter(p => p.id !== id));
  };

  const submitShortfall = async () => {
    if(!shortfallStop || !shortfallReason.trim() || actionLoading) return;
    const stopId = shortfallStop.id;
    const detail = shortfallReason.trim();
    setActionLoading(`shortfall-${stopId}`);
    try {
      const evidenceIds = [];
      for(const photo of shortfallPhotos) {
        evidenceIds.push(await uploadPhoto(photo.file, photo.id, { tripId: trip.tripId, stopId }));
      }
      const res = await fetch("/api/exceptions", {
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
      if(!res.ok) throw Error((await res.json()).error);
      
      setMessage("Shortfall reported successfully.");
      setMessageType("success");
      setShortfallStop(null);
      fetchTripDetails();
    } catch (e) {
      setMessage((e as Error).message);
      setMessageType("error");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-10 h-10 text-wp-green animate-spin" />
    </div>
  );
  
  if (!trip) return (
    <div className="p-8 text-center text-red-600 font-bold">Trip not found.</div>
  );

  const allLoaded = trip.released === true && !trip.held;
  const loadedWeight = stops.filter(s => s.status === "loaded" || s.status === "delivered").reduce((sum, s) => sum + (s.expectedKg || 0), 0);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto w-full relative">
      
      {/* ── Messages ── */}
      {message && !shortfallStop && (
        <div className={`mb-6 p-4 rounded-card flex items-start gap-3 text-sm ${
          messageType === "error" ? "bg-red-50 border border-red-200 text-red-700" :
          messageType === "success" ? "bg-green-50 border border-green-200 text-green-800" :
          "bg-blue-50 border border-blue-200 text-blue-800"
        }`}>
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <p className="flex-1">{message}</p>
          <button onClick={() => setMessage("")}><X size={16}/></button>
        </div>
      )}

      <button 
        onClick={() => router.push("/loader")}
        className="text-wp-muted hover:text-wp-ink flex items-center gap-1 mb-6 text-sm font-semibold transition-colors w-fit"
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
                    className="px-4 py-3 bg-red-50 border border-red-100 text-red-600 rounded-md font-semibold hover:bg-red-100 transition-colors flex items-center gap-2"
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

      {/* ── Shortfall Slide-over Panel ── */}
      {shortfallStop && (
        <>
          <div 
            className="fixed inset-0 bg-wp-ink/30 z-40 transition-opacity" 
            onClick={() => setShortfallStop(null)} 
          />
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-wp-canvas shadow-2xl z-50 flex flex-col border-l border-wp-border animate-in slide-in-from-right">
            
            <div className="flex items-center justify-between p-6 border-b border-wp-border bg-white">
              <h2 className="text-xl font-bold text-wp-ink flex items-center gap-2">
                <AlertTriangle className="text-amber-500" /> Report Shortfall
              </h2>
              <button 
                onClick={() => setShortfallStop(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-wp-muted hover:text-wp-ink transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {message && (
                <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  <p>{message}</p>
                </div>
              )}

              <div className="bg-amber-50 border border-amber-200 rounded-card p-4">
                <p className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-1">Impact Alert</p>
                <p className="text-sm text-amber-900">
                  This holds departure until Dispatcher approves the manifest. The outlet <strong>{shortfallStop.name}</strong> will receive a partial delivery.
                </p>
                <p className="text-xs text-amber-700 mt-2 font-medium">STOP ID: {shortfallStop.id}</p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-wp-ink">Damage or missing goods detail</label>
                <textarea 
                  maxLength={1000} 
                  value={shortfallReason} 
                  onChange={e => setShortfallReason(e.target.value)} 
                  placeholder="E.g. Missing 2 cases of milk, or damage observed at dock..."
                  className="w-full border border-wp-border rounded-md p-3 text-sm min-h-[100px] focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-wp-ink">Evidence Photos (Optional)</label>
                <p className="text-xs text-wp-muted mb-2">Up to 3 images, max 2MB each.</p>
                
                <div className="grid grid-cols-3 gap-3">
                  {shortfallPhotos.map(photo => (
                    <div key={photo.id} className="relative aspect-square rounded-md border border-wp-border overflow-hidden group bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo.url} alt="Evidence" className="object-cover w-full h-full" />
                      <button 
                        onClick={() => removePhoto(photo.id)}
                        className="absolute inset-0 bg-wp-ink/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        <X size={24} className="text-white" />
                      </button>
                    </div>
                  ))}
                  
                  {shortfallPhotos.length < 3 && (
                    <label className="aspect-square rounded-md border-2 border-dashed border-wp-border flex flex-col items-center justify-center text-wp-muted hover:text-wp-ink hover:bg-slate-50 hover:border-wp-muted transition-colors cursor-pointer">
                      <Camera size={24} className="mb-1" />
                      <span className="text-xs font-medium">Add Photo</span>
                      <input 
                        type="file" 
                        accept="image/jpeg,image/png" 
                        multiple 
                        capture="environment" 
                        disabled={!!actionLoading} 
                        onChange={handlePhotoSelect}
                        className="hidden" 
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-wp-border bg-slate-50 flex gap-3">
              <button 
                disabled={!!actionLoading} 
                onClick={() => setShortfallStop(null)} 
                className="flex-1 btn bg-white border border-wp-border text-wp-ink hover:bg-slate-100"
              >
                Cancel
              </button>
              <button 
                disabled={!!actionLoading || !shortfallReason.trim()} 
                onClick={submitShortfall} 
                className="flex-[2] btn bg-amber-600 hover:bg-amber-700 text-white border-none flex items-center justify-center gap-2"
              >
                {actionLoading?.startsWith("shortfall") ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <AlertTriangle size={16} />
                )}
                Submit Shortfall
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
