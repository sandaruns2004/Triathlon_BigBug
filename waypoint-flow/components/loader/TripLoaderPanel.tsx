"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Shield, Check } from "lucide-react";

export function TripLoaderPanel({ tripId, onUpdate }: { tripId: string, onUpdate: () => void }) {
  const [trip, setTrip] = useState<any>(null);
  const [stops, setStops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [shortfallStopId, setShortfallStopId] = useState("");
  const [shortfallReason, setShortfallReason] = useState("");
  
  // Loading manifest state
  const [loadChecked, setLoadChecked] = useState<Record<string, boolean>>({});
  
  // Pre-departure checks state
  const [checks, setChecks] = useState<boolean[]>([false, false, false, false]);

  const fetchTripDetails = () => {
    fetch(`/api/loader/trips/${tripId}`)
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Unable to load manifest.");
        return data;
      })
      .then(data => {
        setTrip(data.trip);
        setStops(data.stops || []);
        
        // Auto-check stops that are already loaded
        const checked: Record<string, boolean> = {};
        (data.stops || []).forEach((s: any) => {
          if (s.loadingState === "loaded" && !s.shortfallOpen) {
            checked[s.stopId] = true;
          }
        });
        setLoadChecked(checked);
        setLoading(false);
      })
      .catch(e => {
        setMessage((e as Error).message);
        setLoading(false);
      });
  };

  useEffect(() => {
    setLoading(true);
    setTrip(null);
    setMessage("");
    setChecks([false, false, false, false]);
    setReporting(false);
    fetchTripDetails();
  }, [tripId]);

  const handleToggleLoad = async (stopId: string, isChecked: boolean) => {
    if (isChecked && !busy && !loadChecked[stopId]) {
      setBusy(true);
      setMessage("");
      try {
        const response = await fetch(`/api/loader/stops/${stopId}/load`, { method: "PATCH" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to mark as loaded.");
        fetchTripDetails();
        onUpdate();
      } catch (e) {
        setMessage((e as Error).message);
      } finally {
        setBusy(false);
      }
    }
  };

  const handleToggleCheck = (index: number) => {
    setChecks(prev => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const handleReadyToDepart = async () => {
    if (busy) return;
    setBusy(true);
    setMessage("");
    // Release the vehicle
    try {
      const res = await fetch(`/api/loader/trips/${tripId}/release`, { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({checks}) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to release.");
      onUpdate();
      fetchTripDetails();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleReportShortfall = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy || !shortfallStopId || !shortfallReason.trim()) return;
    setBusy(true);
    setMessage("");
    try {
    const res = await fetch("/api/exceptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "shortfall",
        title: "Loading Shortfall",
        detail: shortfallReason.trim(),
        stopId: shortfallStopId,
        vehicleId: trip.vehicleId,
        tripId: trip.tripId,
        severity: "high",
        depot: trip.depot,
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to report shortfall.");
    setReporting(false);
    setMessage("Shortfall reported to Dispatcher. Departure is held until approval.");
    fetchTripDetails();
    onUpdate();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-[#8a968c]">Loading manifest...</div>;
  if (!trip) return <p role="alert">{message || "Manifest unavailable."}</p>;

  const isShortfall = trip.held || trip.status === "loading_issue";
  const allStopsChecked = stops.length > 0 && stops.every(s => loadChecked[s.stopId]);
  const allChecksDone = checks.every(Boolean);

  const checkLabels = [
    "Vehicle clean · Temperature 2–4°C",
    "Item counts match the manifest",
    "No damaged goods",
    "Load secured and final seal checked"
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-[22px] mt-[22px]">
      {/* Loading Manifest Panel */}
      <section className="bg-white border border-[#dce5df] rounded-[10px] overflow-hidden">
        <div className="p-[19px_20px] flex items-center justify-between gap-[10px] border-b border-[#edf0ed]">
          <div>
            <h2 className="text-[16px] tracking-[-0.35px] font-[650] m-0">{trip.vehicleId} · Loading manifest</h2>
            <p className="text-[10px] text-[#63716a] m-[5px_0_0]">Trip {trip.tripNumber} · {trip.brand} · {trip.district}</p>
          </div>
          <button disabled={busy || trip.released} onClick={() => { setReporting(true); setShortfallStopId(stops[0]?.stopId || ""); setShortfallReason(""); }} className="bg-white border border-[#dce5df] rounded-[7px] p-[6px_10px] text-[12px] font-[600] flex items-center gap-[8px] hover:bg-[#f0f5f2]">
            <AlertTriangle size={16} /> Report shortfall
          </button>
        </div>
        
        <div className="p-[22px]">
          {message && <p role="status" className="mb-4 text-sm">{message}</p>}
          {reporting && <form onSubmit={handleReportShortfall} className="mb-4 space-y-3 border rounded p-4">
            <label className="block">Affected stop
              <select aria-label="Affected stop" value={shortfallStopId} onChange={e => setShortfallStopId(e.target.value)} required disabled={busy} className="block w-full border rounded p-2">
                {stops.map(s => <option key={s.stopId} value={s.stopId}>Stop {s.stopOrder} · {s.outletName}</option>)}
              </select>
            </label>
            <label className="block">Shortfall details
              <textarea aria-label="Shortfall details" value={shortfallReason} onChange={e => setShortfallReason(e.target.value)} required maxLength={1000} disabled={busy} className="block w-full border rounded p-2" />
            </label>
            <button disabled={busy || !shortfallReason.trim()} type="submit" className="btn btn-primary">Escalate to Dispatcher</button>
            <button type="button" disabled={busy} onClick={() => setReporting(false)} className="btn">Cancel</button>
          </form>}
          <div className="border border-[#d3e7da] bg-[#f1f9f4] text-[#146b45] rounded-[7px] p-[13px] text-[11px] leading-[1.6] mb-[15px]">
            Load Stop {stops.length} first → Stop 1 last. Deliver in the opposite sequence.
          </div>
          
          <div className="flex flex-col">
            {/* Reverse stops so they load LIFO */}
            {[...stops].sort((a, b) => b.stopOrder - a.stopOrder).map((s) => (
              <label key={s.stopId} className="flex items-start gap-[10px] p-[15px_0] border-b border-[#dce5df] last:border-0 text-[13px] cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={loadChecked[s.stopId] || false}
                  disabled={busy || loadChecked[s.stopId] || s.shortfallOpen || trip.released}
                  onChange={(e) => handleToggleLoad(s.stopId, e.target.checked)}
                  className="w-[18px] h-[18px] accent-[#146b45] mt-1 cursor-pointer"
                />
                <span>
                  <strong className="font-[650] text-[#17221d]">0{s.stopOrder} · {s.outletName}</strong><br />
                  <span className="text-[#63716a] text-[11px]">
                    {s.expectedKg} kg · {trip.brand === "Fresh" ? "Chilled 2–4°C" : "Ambient"} · 
                    {loadChecked[s.stopId] ? " Checked" : " Awaiting manual check"}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </div>
      </section>

      {/* Pre-departure Checks Panel */}
      <section className="bg-white border border-[#dce5df] rounded-[10px] overflow-hidden">
        <div className="p-[19px_20px] flex items-center justify-between gap-[10px] border-b border-[#edf0ed]">
          <h2 className="text-[16px] tracking-[-0.35px] font-[650] m-0">Pre-departure checks</h2>
          <Shield size={19} className="text-[#687e6d]" />
        </div>
        
        <div className="p-[22px]">
          {checkLabels.map((label, i) => (
            <label key={i} className="flex items-center gap-[10px] p-[15px_0] border-b border-[#dce5df] text-[13px] cursor-pointer">
              <input 
                type="checkbox" 
                checked={checks[i]}
                onChange={() => handleToggleCheck(i)}
                className="w-[18px] h-[18px] accent-[#146b45] cursor-pointer"
              />
              {label}
            </label>
          ))}
          
          <p className="text-[#63716a] text-[11px] mt-[15px] mb-[15px]">
            All goods and checks must be confirmed before release.
          </p>
          
          {isShortfall && (
            <div className="border border-[#e7dfc7] bg-[#fffaf0] text-[#94712f] rounded-[7px] p-[13px] text-[11px] leading-[1.6] mb-[15px]">
              Loading shortfall unresolved. Dispatcher approval required before departure.
            </div>
          )}
          
          <button 
            disabled={busy || !allStopsChecked || !allChecksDone || isShortfall || trip.released}
            onClick={handleReadyToDepart}
            className="w-full bg-[#146b45] disabled:opacity-45 disabled:cursor-not-allowed hover:bg-[#105737] text-white border-0 rounded-[7px] p-[10px_14px] font-[600] flex justify-center items-center gap-[8px]"
          >
            <Check size={18} />
            {trip.released ? "Vehicle Released" : "Ready to depart"}
          </button>
        </div>
      </section>
    </div>
  );
}
