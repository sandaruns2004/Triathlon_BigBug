"use client";

import { useEffect, useState } from "react";
import { RefreshCw, CloudOff, CheckCircle2, Clock, Package } from "lucide-react";
import { getQueue, syncAll } from "@/lib/offline/queue";

export default function SyncCentrePage() {
  const [online, setOnline] = useState(true);
  const [queued, setQueued] = useState<any[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState("");

  useEffect(() => {
    setOnline(navigator.onLine);
    const handleOnline  = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online",  handleOnline);
    window.addEventListener("offline", handleOffline);
    loadQueued();
    return () => {
      window.removeEventListener("online",  handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  async function loadQueued() {
    try {
      const items = await getQueue();
      setQueued(items || []);
    } catch {
      setQueued([]);
    }
  }

  async function handleSync() {
    if (!online) return;
    setSyncing(true);
    setSyncResult("");
    try {
      const count = await syncAll();
      setSyncResult(`${count} record${count !== 1 ? "s" : ""} synced`);
      loadQueued();
    } catch {
      setSyncResult("Sync failed — please try again");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="p-6 max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-wp-ink">Sync Centre</h1>

      {/* Connection State Card */}
      <div className={`card-panel p-5 flex items-center gap-4 ${online ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}`}>
        {online
          ? <CheckCircle2 size={28} className="text-wp-success shrink-0" />
          : <CloudOff  size={28} className="text-amber-600 shrink-0" />}
        <div>
          <p className="font-semibold text-wp-ink">
            {online ? "Connected" : "You're offline"}
          </p>
          <p className="text-sm text-wp-muted">
            {online
              ? "Your records can be synced now."
              : "Your route and delivery records are available on this phone."}
          </p>
        </div>
      </div>

      {/* Storage Assurance */}
      <div className="card-panel p-4 text-sm text-wp-muted">
        Records are saved on this phone and will sync when you reconnect.
      </div>

      {/* Sync Now Button */}
      <button
        onClick={handleSync}
        disabled={!online || syncing || queued.length === 0}
        className="btn btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40"
      >
        <RefreshCw size={18} className={syncing ? "animate-spin" : ""} />
        {syncing ? "Syncing…" : "Sync now"}
      </button>

      {syncResult && (
        <div className="bg-green-50 border border-green-200 rounded-card px-4 py-3 text-sm text-wp-success font-medium">
          ✓ {syncResult}
        </div>
      )}

      {/* Queued Actions List */}
      <div>
        <h2 className="text-base font-semibold text-wp-ink mb-3">
          {queued.length === 0 ? "No queued records" : `${queued.length} queued record${queued.length !== 1 ? "s" : ""}`}
        </h2>

        {queued.length === 0 ? (
          <div className="card-panel p-8 text-center text-wp-muted border-dashed border-2">
            <CheckCircle2 size={36} className="mx-auto mb-3 text-wp-border" />
            <p>All records synced. Nothing pending.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {queued.map((item: any, i: number) => (
              <div key={i} className="card-panel p-4 flex items-start gap-3">
                <Package size={20} className="text-wp-muted shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-wp-ink truncate">{item.outletName || "Delivery stop"}</p>
                  <p className="text-sm text-wp-muted">{item.type || "Proof of delivery"}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Clock size={12} className="text-wp-muted" />
                    <span className="text-xs text-wp-muted">
                      {item.localTime ? new Date(item.localTime).toLocaleTimeString() : "—"}
                    </span>
                    <span className="ml-2 text-xs font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                      Saved on this phone
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
