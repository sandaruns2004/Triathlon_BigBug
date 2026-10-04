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
  return (
    <div className="flex-1 overflow-y-auto px-[22px] pt-[10px] pb-[24px]">
      <div className="flex items-center gap-[8px] mt-[4px] mb-[23px]">
        <h1 className="text-[28px] leading-[1.2] tracking-[-1px] font-[650] my-[8px]">Sync Centre</h1>
      </div>

      {/* Connection State Card */}
      <div className={`flex items-start gap-[12px] p-[17px] rounded-[12px] border mb-[15px] ${online ? "bg-[#eff5ed] border-[#dce8d7]" : "bg-[#fff3dc] border-[#eddfc4]"}`}>
        {online
          ? <CheckCircle2 size={20} className="text-[#146b45] shrink-0 mt-0.5" />
          : <CloudOff  size={20} className="text-[#845e25] shrink-0 mt-0.5" />}
        <div>
          <h3 className="text-[12px] font-[650] mb-[5px] text-[#17221d]">
            {online ? "Connected" : "You're offline"}
          </h3>
          <p className={`text-[11px] ${online ? "text-[#6b7870]" : "text-[#845e25]"}`}>
            {online
              ? "Your records can be synced now."
              : "Your route and delivery records are available on this phone."}
          </p>
        </div>
      </div>

      {/* Storage Assurance */}
      <div className="bg-white border border-[#dce5df] rounded-[14px] p-[18px] text-[13px] leading-[1.55] mb-[15px]">
        Records are saved on this phone and will sync when you reconnect.
      </div>

      {/* Sync Now Button */}
      <button
        onClick={handleSync}
        disabled={!online || syncing || queued.length === 0}
        className="w-full min-h-[48px] px-[16px] border rounded-[12px] flex items-center justify-center gap-[9px] font-[600] text-[14px] mb-[25px] disabled:opacity-45 disabled:cursor-not-allowed bg-[#146b45] border-[#146b45] text-white hover:bg-[#105b3a]"
      >
        <RefreshCw size={21} className={syncing ? "animate-spin" : ""} strokeWidth={1.8} />
        {syncing ? "Syncing…" : "Sync now"}
      </button>

      {syncResult && (
        <div className="p-[14px] rounded-[10px] bg-[#eaf6ef] border border-[#d6e9dd] text-[#146b45] text-[13px] leading-[1.6] my-[14px]">
          {syncResult}
        </div>
      )}

      {/* Queued Actions List */}
      <div className="mt-[25px]">
        <h2 className="text-[16px] font-[650] mb-[12px]">
          {queued.length === 0 ? "No queued records" : `${queued.length} queued record${queued.length !== 1 ? "s" : ""}`}
        </h2>

        {queued.length === 0 ? (
          <div className="bg-white border border-[#dce5df] border-dashed rounded-[14px] p-[35px] text-center text-[#6b7870] flex flex-col items-center justify-center gap-[15px]">
            <CheckCircle2 size={32} className="text-[#dce5df]" />
            <p className="text-[13px]">All records synced. Nothing pending.</p>
          </div>
        ) : (
          <div className="bg-white border border-[#dce5df] rounded-[14px] overflow-hidden mb-[15px]">
            <div className="px-[17px]">
              {queued.map((item: any, i: number) => {
                const isLast = i === queued.length - 1;
                return (
                  <div key={i} className={`flex gap-[13px] py-[17px] ${!isLast ? 'border-b border-[#e7ede5]' : ''}`}>
                    <div className="w-[32px] h-[32px] rounded-[10px] bg-[#eaf6ef] text-[#146b45] flex-shrink-0 grid place-items-center mt-0.5">
                      <Package size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[14px] font-[650] truncate">{item.outletName || "Delivery stop"}</h3>
                      <p className="text-[12px] text-[#6b7870] mt-[4px]">{item.type || "Proof of delivery"}</p>
                      <div className="flex items-center gap-[8px] font-[11px] text-[#6b7870] mt-[11px]">
                        <Clock size={14} className="text-[#718873]" />
                        <span>{item.localTime ? new Date(item.localTime).toLocaleTimeString() : "—"}</span>
                        <span className="inline-flex items-center gap-[5px] rounded-[6px] px-[8px] py-[5px] text-[10px] font-[650] bg-[#fcf2df] text-[#92611a] whitespace-nowrap ml-2">
                          Saved on this phone
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
