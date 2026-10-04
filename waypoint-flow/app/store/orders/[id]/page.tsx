"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, envelope, submit } from "@/lib/mobile/browser";
import { 
  ArrowLeft, CheckCircle2, Clock, Truck, Package, AlertTriangle, 
  FileText, MessageSquareWarning, SearchX, CalendarClock, ChevronRight
} from "lucide-react";

const STATUS_ORDER = ["pending", "planned", "loading", "on_route", "delivered", "receipted"];
const STATUS_LABELS: Record<string, string> = {
  pending: "Submitted",
  planned: "Planned",
  loading: "Loading",
  on_route: "On route",
  delivered: "Delivered",
  partial: "Partial delivery",
  receipted: "Receipt confirmed",
  deferred: "Deferred",
};

export default function StoreOrderPage() {
  const { id } = useParams();
  const router = useRouter();
  const request = useRef<any>();
  
  const [order, setOrder] = useState<any>();
  const [note, setNote] = useState<any>();
  const [qty, setQty] = useState<Record<string, number>>({});
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "info" | "success">("info");
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const o = await api("store/orders/" + id);
      setOrder(o);
      setQty(Object.fromEntries((o.deliveredLines ?? []).map((l: any) => [l.lineId, l.deliveredQty])));
      if (o.receiptId) setNote(await api("store/orders/" + id + "/delivery-note"));
      setLoading(false);
    } catch (e) {
      setMessage((e as Error).message);
      setMessageType("error");
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, [id]);

  async function receipt() {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      request.current ??= envelope(
        "receipt_recorded",
        {
          lines: order.deliveredLines.map((l: any) => ({
            lineId: l.lineId,
            unit: l.unit,
            receivedQty: qty[l.lineId],
            reason: qty[l.lineId] !== l.deliveredQty ? reason : "",
          })),
          note: reason,
          evidenceIds: [],
        },
        { orderId: id },
        { receiptVersion: order.receiptVersion ?? 0, proofVersion: order.proofVersion }
      );
      await submit(request.current);
      setMessage("Receipt confirmed successfully.");
      setMessageType("success");
      await refresh();
    } catch (e) {
      setMessage((e as Error).message);
      setMessageType("error");
    } finally {
      setBusy(false);
    }
  }

  async function update(type: string) {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const payload = type === "store_issue" ? { category: "business_impact", reason, lineIds: [], evidenceIds: [] } : {};
      await submit(envelope(type, payload, { orderId: id }, type === "update_acknowledged" ? { updateVersion: order.updateVersion ?? 0 } : {}));
      setMessage("Server accepted the update.");
      setMessageType("success");
      if (type === "store_issue") setReason("");
      await refresh();
    } catch (e) {
      setMessage((e as Error).message);
      setMessageType("error");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-wp-green border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-wp-muted text-sm">Loading order details…</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <SearchX size={40} className="mx-auto mb-4 text-wp-muted" />
          <p className="text-wp-ink font-medium">Order not found</p>
          <button onClick={() => router.push("/store")} className="text-wp-green text-sm hover:underline mt-2">
            Return to dashboard
          </button>
        </div>
      </div>
    );
  }

  const isDeferred = order.status === "deferred";
  const needsReceipt = order.proofId && !order.receiptId && ["delivered", "partial"].includes(order.status);
  const isReceipted = !!order.receiptId;
  const currentStatusIndex = STATUS_ORDER.indexOf(order.status === "partial" ? "delivered" : order.status);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-wp-canvas">
      {/* ── Page header ── */}
      <div className="px-8 py-6 border-b border-wp-border bg-white sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto flex flex-col gap-4">
          <button onClick={() => router.push("/store")} className="flex items-center gap-1.5 text-sm text-wp-muted hover:text-wp-ink w-fit transition-colors">
            <ArrowLeft size={16} /> Back to dashboard
          </button>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-wp-ink">{String(id)}</h1>
                <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                  isDeferred ? "bg-amber-100 text-amber-800" :
                  isReceipted ? "bg-green-100 text-green-800" :
                  needsReceipt ? "bg-blue-100 text-blue-800" :
                  "bg-slate-100 text-slate-800"
                }`}>
                  {STATUS_LABELS[order.status] ?? order.status.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-wp-muted">
                {order.outletName} · {order.brand} Brand · Requested for {order.requestedDate ?? order.planDate}
              </p>
            </div>
            
            <button className="btn text-sm font-medium border border-wp-border bg-white text-wp-ink hover:bg-slate-50">
              Contact Operations
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-screen-xl w-full mx-auto px-8 py-6 overflow-y-auto space-y-6">
        
        {/* Messages */}
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

        {/* ── Progress timeline ── */}
        {!isDeferred && (
          <div className="card-panel p-6">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-wp-border z-0" />
              {STATUS_ORDER.map((s, idx) => {
                const active = currentStatusIndex >= idx;
                const current = currentStatusIndex === idx;
                return (
                  <div key={s} className="relative z-10 flex flex-col items-center gap-2 bg-white px-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                      active ? "border-wp-green bg-wp-green text-white" : "border-wp-border bg-white text-wp-muted"
                    } ${current && !isReceipted ? "ring-4 ring-green-100" : ""}`}>
                      {active ? <CheckCircle2 size={16} /> : <div className="w-2 h-2 rounded-full bg-wp-border" />}
                    </div>
                    <span className={`text-xs font-medium ${active ? "text-wp-ink" : "text-wp-muted"}`}>
                      {STATUS_LABELS[s]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Deferral alert ── */}
        {isDeferred && (
          <div className="card-panel p-6 bg-amber-50 border border-amber-200">
            <div className="flex items-start gap-4">
              <CalendarClock size={24} className="text-amber-600 mt-1 shrink-0" />
              <div className="flex-1">
                <h2 className="text-lg font-bold text-amber-900">Capacity Deferral</h2>
                <p className="text-sm text-amber-800 mt-1">
                  Sorry, this request could not travel as planned. 
                  <span className="font-semibold block mt-1">Reason: {order.deferralReason}</span>
                </p>
                <div className="flex items-center gap-4 mt-4">
                  <p className="text-sm font-medium text-amber-900">Proposed date: {order.proposedDate ?? order.revisedDate}</p>
                  <button 
                    disabled={busy} 
                    onClick={() => update("update_acknowledged")} 
                    className="btn bg-amber-600 text-white hover:bg-amber-700 border-none text-sm"
                  >
                    Acknowledge update
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Main content - Line items */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Delivery Card */}
            {order.tracking && (
              <div className="card-panel p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <Truck size={24} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-wp-ink">Delivery on Route</h3>
                  <p className="text-sm text-wp-muted mt-1">
                    Vehicle {order.tracking.vehicleId} · {order.tracking.status}
                    {order.tracking.held ? <span className="text-amber-600 font-medium ml-2">⚠️ Operations hold</span> : ""}
                  </p>
                </div>
              </div>
            )}

            {/* Line Items Table */}
            <div className="card-panel overflow-hidden">
              <div className="px-5 py-4 border-b border-wp-border bg-slate-50 flex items-center justify-between">
                <h3 className="font-bold text-wp-ink flex items-center gap-2">
                  <Package size={18} /> Order Contents
                </h3>
              </div>
              <div className="divide-y divide-wp-border">
                {/* When receipting (needsReceipt) or already receipted (isReceipted) -> show delivered lines */}
                {needsReceipt || isReceipted ? (
                  (order.deliveredLines ?? []).map((l: any) => (
                    <div key={l.lineId} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <p className="font-medium text-wp-ink text-sm">{l.name}</p>
                        <p className="text-xs text-wp-muted mt-0.5">Delivered: {l.deliveredQty} {l.unit}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-medium text-wp-muted">Received:</span>
                        <input
                          disabled={busy || isReceipted || !!request.current}
                          type="number"
                          step={1}
                          min={0}
                          max={l.deliveredQty}
                          value={qty[l.lineId] ?? 0}
                          onChange={(e) => setQty({ ...qty, [l.lineId]: Math.max(0, Math.min(l.deliveredQty, Number(e.target.value))) })}
                          className="border border-wp-border rounded-md px-3 py-1.5 w-24 text-sm font-mono text-center focus:ring-2 focus:ring-wp-green focus:outline-none disabled:bg-slate-50 disabled:text-wp-muted"
                        />
                        <span className="text-xs font-medium text-wp-muted w-10">{l.unit}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  /* Pending/planned -> show ordered lines */
                  (order.lines ?? []).map((l: any) => (
                    <div key={l.lineId} className="px-5 py-4 flex items-center justify-between">
                      <p className="font-medium text-wp-ink text-sm">{l.name}</p>
                      <p className="text-sm font-mono text-wp-muted">{l.quantity} {l.unit}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Delivery Note reference */}
            {note && (
              <div className="card-panel p-5 border-l-4 border-wp-green">
                <h3 className="font-bold text-wp-ink flex items-center gap-2 mb-3">
                  <FileText size={18} /> Digital Delivery Note {note.reference}
                </h3>
                <div className="text-sm text-wp-muted space-y-1">
                  <p>Issued: {note.issuedAt}</p>
                  <p>Revision: {note.revision}</p>
                  {note.discrepancy && <p className="text-amber-600 font-medium mt-2">⚠️ Discrepancy reported</p>}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Actions */}
          <div className="space-y-6">
            <div className="card-panel p-5 space-y-4 sticky top-6">
              <h3 className="font-bold text-wp-ink border-b border-wp-border pb-3">Actions</h3>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-wp-ink">Report issue / Discrepancy note</label>
                <textarea
                  maxLength={1000}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Describe missing items, damage, or temperature concerns..."
                  disabled={busy || (isReceipted && !reason.trim())}
                  className="w-full border border-wp-border rounded-card p-3 text-sm focus:ring-2 focus:ring-wp-green focus:outline-none min-h-[100px] resize-none disabled:bg-slate-50"
                />
              </div>

              {needsReceipt && (
                <button
                  disabled={busy}
                  onClick={receipt}
                  className="btn btn-primary w-full flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={16} /> Confirm Receipt
                </button>
              )}

              <button
                disabled={busy || !reason.trim()}
                onClick={() => update("store_issue")}
                className="btn w-full flex items-center justify-center gap-2 border-amber-200 text-amber-700 hover:bg-amber-50 disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <MessageSquareWarning size={16} /> Report Business Impact
              </button>

              <button
                disabled={busy}
                onClick={refresh}
                className="btn w-full border-wp-border text-wp-ink hover:bg-slate-50"
              >
                Refresh Status
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
