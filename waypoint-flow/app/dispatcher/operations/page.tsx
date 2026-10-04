"use client";
import { useEffect, useState } from "react";
import { 
  Users, AlertTriangle, Truck, RefreshCw, CalendarClock, PackageOpen, FileText, CheckCircle2, ChevronRight, MessageSquareWarning, ShieldCheck, MapPin
} from "lucide-react";

type Row = Record<string, any>;

export default function OperationsPage() {
  const [data, setData] = useState<Row>();
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"info"|"error"|"success">("info");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    try {
      const res = await fetch("/api/operations");
      const d = await res.json();
      if (!res.ok) throw Error(d.error);
      setData(d);
    } catch (e) {
      setMessage((e as Error).message);
      setMessageType("error");
    }
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 30000);
    return () => clearInterval(id);
  }, []);

  async function action(kind: string, id: string, payload: Row) {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: kind, entityId: id, payload })
      });
      const result = await res.json();
      if (!res.ok) throw Error(result.error);
      setMessage(`Successfully applied action: ${kind}`);
      setMessageType("success");
      await refresh();
    } catch (e) {
      setMessage((e as Error).message);
      setMessageType("error");
    } finally {
      setBusy(false);
    }
  }

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-wp-green border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-wp-muted text-sm">Loading operations control…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-wp-ink flex items-center gap-2">
            Operations Control
          </h1>
          <p className="text-wp-muted mt-1 text-sm max-w-2xl">
            Assign enabled Drivers, resolve loading shortfalls and review preserved evidence. Updates come from committed server state.
          </p>
        </div>
        <button 
          onClick={refresh} 
          disabled={busy}
          className="btn border border-wp-border text-wp-ink hover:bg-slate-50 flex items-center gap-2"
        >
          <RefreshCw size={16} className={busy ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-card flex items-start gap-3 text-sm ${
          messageType === "error" ? "bg-red-50 border border-red-200 text-red-700" :
          messageType === "success" ? "bg-green-50 border border-green-200 text-green-800" :
          "bg-blue-50 border border-blue-200 text-blue-800"
        }`}>
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <p>{message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
        
        {/* ── Unassigned Trips / Trip Holds ── */}
        <div className="space-y-4">
          <h2 className="font-bold text-wp-ink flex items-center gap-2 border-b border-wp-border pb-2">
            <Truck size={18} /> Fleet Assignment
          </h2>
          {data.trips.length === 0 && <p className="text-sm text-wp-muted italic p-4 text-center border-2 border-dashed rounded-card">No trips require assignment</p>}
          {data.trips.map((trip: Row) => (
            <section key={trip.tripId} className="card-panel overflow-hidden">
              <div className="p-4 border-b border-wp-border bg-slate-50">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-wp-ink text-sm">{trip.tripId}</h3>
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-slate-200 text-slate-700">
                    {trip.status}
                  </span>
                </div>
                <p className="text-xs text-wp-muted mt-1">Vehicle: {trip.vehicleId} · Driver: {trip.driverName ?? "None"}</p>
              </div>
              <div className="p-4 space-y-3">
                <form 
                  onSubmit={e => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    action("assign", trip.tripId, { driverId: f.get("driverId"), reason: f.get("reason") });
                  }} 
                  className="space-y-3"
                >
                  <label className="block">
                    <span className="text-xs font-medium text-wp-muted mb-1 block">Assign Driver</span>
                    <select required name="driverId" aria-label="Driver" className="w-full border border-wp-border rounded-md p-2 text-sm focus:ring-2 focus:ring-wp-green outline-none bg-white">
                      <option value="">Select a driver...</option>
                      {data.drivers.map((d: Row) => <option key={d.userId} value={d.userId}>{d.name}</option>)}
                    </select>
                  </label>
                  <input name="reason" required maxLength={500} placeholder="Assignment reason" className="w-full border border-wp-border rounded-md p-2 text-sm focus:ring-2 focus:ring-wp-green outline-none" />
                  <button disabled={busy} className="btn btn-primary w-full text-sm py-1.5 flex justify-center gap-2">
                    <Users size={16} /> Update Assignment
                  </button>
                </form>

                {trip.held && trip.status === "held" && (
                  <form 
                    onSubmit={e => {
                      e.preventDefault();
                      action("resolve_hold", trip.tripId, { reason: new FormData(e.currentTarget).get("reason") });
                    }} 
                    className="mt-4 pt-4 border-t border-wp-border space-y-3"
                  >
                    <div className="flex items-center gap-2 text-amber-700 mb-2">
                      <AlertTriangle size={16} />
                      <span className="text-sm font-semibold">Operations Hold Active</span>
                    </div>
                    <input name="reason" required maxLength={1000} placeholder="Resolution notes" className="w-full border border-wp-border rounded-md p-2 text-sm focus:ring-2 focus:ring-wp-green outline-none" />
                    <button disabled={busy} className="btn w-full text-sm py-1.5 bg-amber-600 hover:bg-amber-700 text-white border-none flex justify-center gap-2">
                      <ShieldCheck size={16} /> Resume Held Trip
                    </button>
                  </form>
                )}
              </div>
            </section>
          ))}
        </div>

        {/* ── Capacity Deferrals & Exceptions ── */}
        <div className="space-y-4">
          <h2 className="font-bold text-wp-ink flex items-center gap-2 border-b border-wp-border pb-2">
            <CalendarClock size={18} /> Orders & Shortfalls
          </h2>
          
          {/* Deferred Orders */}
          {data.orders.map((o: Row) => (
            <section className="card-panel overflow-hidden border-amber-200" key={o.orderId}>
              <div className="p-4 bg-amber-50 border-b border-amber-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-amber-900 text-sm flex items-center gap-2">
                    {o.orderId}
                  </h3>
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-amber-200 text-amber-800">
                    {o.status}
                  </span>
                </div>
                <p className="text-xs text-amber-800 mt-1 font-medium">{o.deferralReason ?? o.deferralSuggestion}</p>
              </div>
              <form 
                className="p-4 space-y-3" 
                onSubmit={e => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  action(o.status === "deferred" ? "restore" : "defer", o.orderId, { reason: f.get("reason"), [o.status === "deferred" ? "serviceDate" : "revisedDate"]: f.get("date") });
                }}
              >
                <label className="block text-sm">
                  <span className="text-xs font-medium text-wp-muted mb-1 block">
                    {o.status === "deferred" ? "Return to planning date" : "Proposed revised date"}
                  </span>
                  <input required type="date" name="date" className="w-full border border-wp-border rounded-md p-2 text-sm focus:ring-2 focus:ring-wp-green outline-none" />
                </label>
                <input name="reason" required maxLength={1000} placeholder="Mandatory reason" className="w-full border border-wp-border rounded-md p-2 text-sm focus:ring-2 focus:ring-wp-green outline-none" />
                <button disabled={busy} className="btn w-full text-sm py-1.5 bg-amber-600 hover:bg-amber-700 text-white border-none flex justify-center gap-2">
                  <CheckCircle2 size={16} /> {o.status === "deferred" ? "Restore to planning" : "Confirm capacity deferral"}
                </button>
              </form>
            </section>
          ))}

          {/* Loading Shortfalls */}
          {data.exceptions.filter((ex: Row) => ex.type === "shortfall").map((ex: Row) => {
            const stop = data.trips.flatMap((t: Row) => t.stops).find((s: Row) => s.stopId === ex.stopId);
            return (
              <section key={ex.exceptionId} className="card-panel overflow-hidden border-orange-200">
                <div className="p-4 bg-orange-50 border-b border-orange-200">
                  <h3 className="font-bold text-orange-900 text-sm flex items-center gap-2">
                    <PackageOpen size={16} /> Loading Shortfall
                  </h3>
                  <p className="text-xs text-orange-800 mt-1 font-medium">{ex.stopId} · {ex.detail}</p>
                </div>
                <form 
                  className="p-4 space-y-3"
                  onSubmit={e => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    action("resolve_shortfall", ex.exceptionId, {
                      reason: f.get("reason"),
                      quantities: Object.fromEntries((stop?.lines ?? []).map((l: Row) => [l.lineId, Number(f.get(l.lineId))]))
                    });
                  }} 
                >
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-sm">
                    {(stop?.lines ?? []).map((l: Row) => (
                      <div key={l.lineId} className="flex items-center justify-between gap-3 bg-slate-50 p-2 rounded border border-wp-border">
                        <span className="truncate flex-1 text-xs">{l.name}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-wp-muted">/ {l.quantity} {l.unit}</span>
                          <input name={l.lineId} type="number" min={0} max={l.quantity} step={1} required defaultValue={l.quantity} className="w-16 border border-wp-border rounded px-2 py-1 text-xs text-center focus:ring-2 focus:ring-wp-green outline-none" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <input name="reason" required maxLength={1000} placeholder="Store explanation and resolution" className="w-full border border-wp-border rounded-md p-2 text-sm focus:ring-2 focus:ring-wp-green outline-none" />
                  <button disabled={busy} className="btn w-full text-sm py-1.5 bg-orange-600 hover:bg-orange-700 text-white border-none flex justify-center gap-2">
                    <CheckCircle2 size={16} /> Approve adjusted manifest
                  </button>
                </form>
              </section>
            );
          })}
          
          {data.orders.length === 0 && data.exceptions.length === 0 && (
            <p className="text-sm text-wp-muted italic p-4 text-center border-2 border-dashed rounded-card">No active exceptions</p>
          )}
        </div>

        {/* ── Preserved Proof / Reviews ── */}
        <div className="space-y-4">
          <h2 className="font-bold text-wp-ink flex items-center gap-2 border-b border-wp-border pb-2">
            <FileText size={18} /> Proof Reviews
          </h2>
          {data.reviews.length === 0 && <p className="text-sm text-wp-muted italic p-4 text-center border-2 border-dashed rounded-card">No pending reviews</p>}
          {data.reviews.map((r: Row) => (
            <section key={r.reviewId} className="card-panel overflow-hidden border-blue-200">
              <div className="p-4 bg-blue-50 border-b border-blue-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-blue-900 text-sm flex items-center gap-2">
                    <MapPin size={16} /> {r.stopId}
                  </h3>
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-blue-200 text-blue-800">
                    {r.status}
                  </span>
                </div>
                <p className="text-xs text-blue-800 mt-1 font-medium">{r.reason}</p>
              </div>
              
              <div className="p-4 space-y-4">
                <div className="bg-slate-50 p-3 rounded border border-wp-border text-xs text-wp-muted space-y-1">
                  <p className="font-semibold text-wp-ink mb-2">Original Submission:</p>
                  {(r.operation?.payload?.lines ?? []).map((l: Row) => (
                    <p key={l.lineId}>{l.lineId}: <span className="font-medium text-wp-ink">{l.deliveredQty}</span> {l.unit} {l.reason ? `· ${l.reason}` : ""}</p>
                  ))}
                </div>

                {r.status === "awaiting_operations" && r.canonical && !r.canonical.proofId && (
                  <form className="space-y-3 pt-3 border-t border-wp-border" onSubmit={e => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    const original = r.operation.payload;
                    action("approve_review", r.reviewId, {
                      reason: f.get("reason"), stopManifestRevision: r.canonical.stopManifestRevision, stopDeliveryVersion: r.canonical.stopDeliveryVersion ?? 0,
                      proof: {
                        ...original, proofId: f.get("proofId"), outcome: f.get("outcome"), parkedAcknowledged: true, reason: f.get("reason"),
                        lines: r.canonical.lines.map((l: Row) => ({ lineId: l.lineId, unit: l.unit, deliveredQty: Number(f.get(l.lineId)), reason: String(f.get("reason")) }))
                      }
                    });
                  }}>
                    <div className="text-xs text-wp-muted mb-2">Approve an audited amendment (original remains untouched).</div>
                    <input type="hidden" name="proofId" defaultValue={crypto.randomUUID()} />
                    <select name="outcome" className="w-full border border-wp-border rounded-md p-2 text-sm focus:ring-2 focus:ring-wp-green outline-none bg-white" defaultValue={r.operation.payload.outcome ?? "full"}>
                      <option value="full">Full delivery</option><option value="partial">Partial delivery</option><option value="failed">Failed delivery</option><option value="refused">Refused</option><option value="skipped">Skipped</option>
                    </select>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1 text-sm">
                      {r.canonical.lines.map((l: Row) => (
                        <div key={l.lineId} className="flex items-center justify-between gap-2">
                          <span className="truncate flex-1 text-xs">{l.name}</span>
                          <input type="number" required min={0} max={l.quantity} step={1} name={l.lineId} defaultValue={Math.min(l.quantity, r.operation.payload.lines?.find((p: Row) => p.lineId === l.lineId)?.deliveredQty ?? 0)} className="w-16 border border-wp-border rounded px-2 py-1 text-xs text-center focus:ring-2 focus:ring-wp-green outline-none" />
                        </div>
                      ))}
                    </div>
                    <input name="reason" required maxLength={1000} placeholder="Mandatory amendment reason" className="w-full border border-wp-border rounded-md p-2 text-sm focus:ring-2 focus:ring-wp-green outline-none" />
                    <button disabled={busy} className="btn btn-primary w-full text-sm py-1.5 flex justify-center gap-2">
                      <CheckCircle2 size={16} /> Approve corrected quantities
                    </button>
                  </form>
                )}

                {r.status === "awaiting_operations" && (
                  <form onSubmit={e => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    action("resolve_review", r.reviewId, { decision: f.get("decision"), reason: f.get("reason") });
                  }} className="pt-3 border-t border-wp-border space-y-3">
                    <select name="decision" className="w-full border border-wp-border rounded-md p-2 text-sm focus:ring-2 focus:ring-wp-green outline-none bg-white">
                      <option value="retain_for_audit">Retain for audit</option>
                      <option value="request_followup">Request follow-up</option>
                    </select>
                    <input name="reason" required maxLength={1000} placeholder="Decision reason" className="w-full border border-wp-border rounded-md p-2 text-sm focus:ring-2 focus:ring-wp-green outline-none" />
                    <button disabled={busy} className="btn w-full border border-wp-border text-wp-ink hover:bg-slate-50 text-sm py-1.5 flex justify-center gap-2">
                      <MessageSquareWarning size={16} /> Record decision
                    </button>
                  </form>
                )}
              </div>
            </section>
          ))}
        </div>

      </div>
    </div>
  );
}
