"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, envelope, submit } from "@/lib/mobile/browser";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, AlertCircle, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function StoreOrderPage() {
  const { id } = useParams(), request = useRef<any>();
  const router = useRouter();
  const [order, setOrder] = useState<any>();
  const [note, setNote] = useState<any>();
  const [qty, setQty] = useState<Record<string, number>>({});
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [isContacting, setIsContacting] = useState(false);
  const [contactReason, setContactReason] = useState("");
  const [exceptions, setExceptions] = useState<any[]>([]);
  
  async function refresh() {
    try {
      const data = await api("store/orders/" + id); 
      setOrder(data.order);
      setExceptions(data.exceptions || []);
      setQty(Object.fromEntries((data.order.deliveredLines ?? []).map((l: any) => [l.lineId, l.deliveredQty])));
      if (data.order.receiptId) setNote(await api("store/orders/" + id + "/delivery-note"));
    } catch (e) { 
      setMessage((e as Error).message); 
    }
  }
  
  useEffect(() => { refresh(); }, [id]);
  
  async function receipt() {
    if (busy) return; 
    setBusy(true); 
    try {
      request.current ??= envelope("receipt_recorded", { 
        lines: order.deliveredLines.map((l: any) => ({ 
          lineId: l.lineId, 
          unit: l.unit, 
          receivedQty: qty[l.lineId], 
          reason: qty[l.lineId] !== l.deliveredQty ? reason : "" 
        })), 
        note: reason, 
        evidenceIds: [] 
      }, { orderId: id }, { receiptVersion: order.receiptVersion ?? 0, proofVersion: order.proofVersion });
      await submit(request.current); 
      await refresh();
    } catch (e) { 
      setMessage((e as Error).message); 
    } finally { 
      setBusy(false); 
    }
  }
  
  async function update(type: string) {
    if (busy) return; 
    setBusy(true); 
    try {
      const payload = type === "store_issue" ? { category: "business_impact", reason, lineIds: [], evidenceIds: [] } : {};
      await submit(envelope(type, payload, { orderId: id }, type === "update_acknowledged" ? { updateVersion: order.updateVersion ?? 0 } : {})); 
      setMessage("Server accepted the update."); 
      await refresh();
    } catch (e) { 
      setMessage((e as Error).message); 
    } finally { 
      setBusy(false); 
    }
  }

  const isDelivered = ["delivered", "partial"].includes(order?.status);
  const isReceiptConfirmed = !!order?.receiptId;

  return (
    <div className="flex flex-col h-full bg-[#f6f8f7] px-[22px] pt-[10px]">
      {message && <p role="status" className="py-2 text-[13px] text-[#ae483a]">{message}</p>}
      
      <div className="flex items-center gap-[8px] mb-[18px]">
        <Link href="/store" className="bg-transparent border-none p-2 -ml-[12px] text-[#17221d]">
          <ArrowLeft size={24} strokeWidth={2.5} />
        </Link>
        <h1 className="text-[22px] font-[650] tracking-tight m-0">Order {String(id).split("-")[0]}-{String(id).split("-")[1]?.substring(0, 6).toUpperCase()}</h1>
      </div>

      {!order ? (
        <div className="p-8 text-center text-[#6b7870]">Loading order details...</div>
      ) : (
        <>
          <span className="inline-flex self-start items-center gap-[5px] rounded-[6px] px-[8px] py-[5px] text-[10px] font-[650] bg-[#eaf6ef] text-[#146b45] whitespace-nowrap mb-[10px]">
            <CheckCircle2 size={12} /> {isReceiptConfirmed ? "Receipt confirmed" : order.status}
          </span>
          
          <h1 className="text-[25px] font-[650] tracking-tight my-[10px] leading-[1.2]">
            {isReceiptConfirmed ? "All received." : isDelivered ? "Your delivery is here." : "Your order is processing."}
          </h1>
          <p className="text-[13px] text-[#6b7870] leading-[1.5]">
            Fresh · Nugegoda · {order.requestedDate ?? order.planDate} <br/>
            {isDelivered && "Delivered to rear receiving bay"}
            {order.tracking && !isDelivered && `Trip: ${order.tracking.status} · vehicle ${order.tracking.vehicleId}`}
          </p>

          {order.status === "deferred" && (
            <div className="p-[14px] rounded-[12px] bg-[#fff7e8] border border-[#efdfbe] text-[#92611a] my-[15px]">
              <h2 className="text-[14px] font-[650] mb-[5px]">Capacity deferral</h2>
              <p className="text-[12px] mb-[10px]">Sorry, this request could not travel as planned.</p>
              <p className="text-[12px] mb-[15px]">{order.deferralReason} · proposed date {order.proposedDate ?? order.revisedDate}</p>
              <button 
                disabled={busy} 
                onClick={() => update("update_acknowledged")} 
                className="w-full bg-white text-[#92611a] border border-[#efdfbe] font-semibold text-[13px] h-[40px] rounded-[9px]"
              >
                Acknowledge update
              </button>
            </div>
          )}

          <div className="bg-white border border-[#dce5df] rounded-[14px] p-[20px] mt-[20px] mb-[15px]">
            <div className="flex flex-col gap-[20px]">
              <div className="flex gap-[15px] relative">
                <div className="absolute left-[5px] top-[10px] bottom-0 w-[2px] bg-[#eaf6ef]"></div>
                <div className="w-[12px] h-[12px] rounded-full bg-[#146b45] z-10 shrink-0 mt-[2px]"></div>
                <div>
                  <h3 className="text-[14px] font-[650]">Submitted</h3>
                  <p className="text-[12px] text-[#6b7870] mt-[2px]">{order.requestedDate ?? order.planDate}</p>
                </div>
              </div>
              <div className="flex gap-[15px] relative">
                <div className="absolute left-[5px] top-[10px] bottom-0 w-[2px] bg-[#eaf6ef]"></div>
                <div className={cn("w-[12px] h-[12px] rounded-full z-10 shrink-0 mt-[2px]", order.tracking || isDelivered ? "bg-[#146b45]" : "bg-[#dce5df]")}></div>
                <div>
                  <h3 className="text-[14px] font-[650]">Planned</h3>
                  <p className="text-[12px] text-[#6b7870] mt-[2px]">{order.tracking ? "Allocated to trip" : "Pending"}</p>
                </div>
              </div>
              <div className="flex gap-[15px]">
                <div className={cn("w-[12px] h-[12px] rounded-full z-10 shrink-0 mt-[2px]", isDelivered ? "bg-[#146b45]" : "bg-[#dce5df]")}></div>
                <div>
                  <h3 className="text-[14px] font-[650]">Delivered</h3>
                  <p className="text-[12px] text-[#6b7870] mt-[2px]">{isDelivered ? "Delivery recorded" : "Waiting"}</p>
                </div>
              </div>
            </div>
          </div>

          {order.proofId && !order.receiptId && isDelivered && (
            <>
              <h2 className="text-[19px] font-[650] mt-[10px] tracking-[-0.5px]">Everything as expected?</h2>
              <p className="text-[13px] text-[#6b7870] mt-[5px] mb-[15px]">Compare quantities and check the condition of your goods.</p>
              
              <div className="bg-white border border-[#dce5df] rounded-[14px] p-[20px] mb-[20px] overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr>
                      <th className="pb-[12px] font-[600] text-[#6b7870] text-[11px] uppercase tracking-wide">Item</th>
                      <th className="pb-[12px] font-[600] text-[#6b7870] text-[11px] uppercase tracking-wide px-2">Ordered</th>
                      <th className="pb-[12px] font-[600] text-[#6b7870] text-[11px] uppercase tracking-wide px-2">Delivered</th>
                      <th className="pb-[12px] font-[600] text-[#6b7870] text-[11px] uppercase tracking-wide px-2">Received</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(order.deliveredLines ?? []).map((l: any) => (
                      <tr key={l.lineId} className="border-t border-[#dce5df]">
                        <td className="py-[14px] font-[600]">{l.name || l.lineId}</td>
                        <td className="py-[14px] px-2 text-[#6b7870]">{l.deliveredQty}</td>
                        <td className="py-[14px] px-2 text-[#6b7870]">{l.deliveredQty}</td>
                        <td className="py-[14px] px-2">
                          <input 
                            disabled={busy || !!order.receiptId || !!request.current} 
                            type="number" step={1} min={0} max={l.deliveredQty} 
                            value={qty[l.lineId] ?? 0} 
                            onChange={e => setQty({ ...qty, [l.lineId]: Number(e.target.value) })} 
                            className="w-[60px] p-[8px] border border-[#dce5df] rounded-[6px] text-center" 
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <label className="block text-[13px] font-[650] mb-[20px]">
                Receipt difference / business impact
                <textarea 
                  maxLength={1000} 
                  value={reason} 
                  onChange={e => setReason(e.target.value)} 
                  placeholder="Optional notes or discrepancy details"
                  className="w-full mt-[8px] min-h-[85px] p-[12px] border border-[#dce5df] rounded-[9px] font-normal text-[16px] resize-y" 
                />
              </label>

              <div className="grid gap-[10px] mb-[20px]">
                <button 
                  disabled={busy} 
                  onClick={receipt} 
                  className="w-full bg-[#146b45] text-white font-semibold text-[14px] h-[48px] rounded-[12px]"
                >
                  Confirm all items received
                </button>
                <button 
                  disabled={busy || !reason.trim()} 
                  onClick={() => update("store_issue")} 
                  className="w-full bg-white text-[#17221d] border border-[#dce5df] font-semibold text-[14px] h-[48px] rounded-[12px] flex items-center justify-center gap-2"
                >
                  <AlertCircle size={18} /> Report an issue
                </button>
              </div>
            </>
          )}

          {note && (
            <div className="bg-white border border-[#dce5df] rounded-[14px] p-[20px] mt-[10px] mb-[20px]">
              <h2 className="text-[16px] font-[650] mb-[15px]">Digital delivery note {note.reference}</h2>
              <p className="text-[13px] text-[#6b7870] mb-[15px]">Issued {note.issuedAt} · revision {note.revision}{note.discrepancy ? " · discrepancy reported" : ""}</p>
              
              {["orderedLines", "approvedLines", "deliveredLines", "acceptedLines"].map(key => (
                (note[key] && note[key].length > 0) ? (
                  <div key={key} className="mb-[15px] last:mb-0">
                    <h3 className="text-[12px] font-[700] uppercase tracking-wide text-[#6b7870] mb-[8px]">{key.replace("Lines", "")}</h3>
                    {(note[key] ?? []).map((l: any) => (
                      <div key={l.lineId} className="flex justify-between py-[8px] border-b border-[#f0f3f1] last:border-0 text-[13px]">
                        <span>{l.lineId}</span>
                        <strong className="font-[650]">{l.quantity ?? l.deliveredQty ?? l.receivedQty} {l.unit}</strong>
                      </div>
                    ))}
                  </div>
                ) : null
              ))}
            </div>
          )}

          {exceptions.length > 0 && (
            <div className="bg-white border border-[#dce5df] rounded-[14px] p-[20px] mt-[10px] mb-[20px]">
              <h2 className="text-[16px] font-[650] mb-[15px] flex items-center gap-[8px]">
                <HelpCircle size={18} className="text-[#8a968c]" />
                Messages sent to operations
              </h2>
              <div className="flex flex-col gap-[15px]">
                {exceptions.map((ex) => (
                  <div key={ex.exceptionId} className="border-b border-[#f0f3f1] last:border-0 pb-[15px] last:pb-0">
                    <p className="text-[14px] leading-[1.5] text-[#17221d] mb-[5px]">{ex.detail}</p>
                    <div className="flex items-center justify-between text-[11px] font-[650]">
                      <span className="text-[#6b7870]">{new Date(ex.createdAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}</span>
                      <span className={`px-[6px] py-[3px] rounded-[4px] uppercase tracking-wider ${ex.resolved ? 'bg-[#eaf6ef] text-[#146b45]' : 'bg-[#fcf2df] text-[#92611a]'}`}>
                        {ex.resolved ? "Resolved" : "Pending review"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!order.proofId && (
            <div className="grid gap-[10px] mt-[10px] mb-[20px]">
              <button onClick={refresh} className="w-full bg-white text-[#17221d] border border-[#dce5df] font-semibold text-[14px] h-[48px] rounded-[12px] hover:bg-black/5 transition-colors">
                Refresh status
              </button>
              
              {isContacting ? (
                <div className="bg-white border border-[#dce5df] rounded-[14px] p-[16px] animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <label className="block text-[13px] font-[650] mb-[8px] text-[#146b45]">
                    Message to operations
                  </label>
                  <textarea 
                    autoFocus
                    maxLength={500} 
                    value={contactReason} 
                    onChange={e => setContactReason(e.target.value)} 
                    placeholder="e.g., Where is my truck?"
                    className="w-full min-h-[80px] p-[12px] bg-[#f6f8f7] border-none rounded-[9px] font-normal text-[14px] resize-none outline-none focus:ring-2 focus:ring-[#146b45]/20 transition-all mb-[12px]" 
                  />
                  <div className="flex gap-[8px]">
                    <button 
                      onClick={() => { setIsContacting(false); setContactReason(""); }}
                      className="flex-1 bg-transparent text-[#6b7870] font-semibold text-[13px] h-[40px] rounded-[9px] hover:bg-black/5 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      disabled={busy || !contactReason.trim()}
                      onClick={async () => {
                        if (busy || !contactReason.trim()) return; 
                        setBusy(true); 
                        try {
                          await submit(envelope("store_issue", { category: "business_impact", reason: contactReason, lineIds: [], evidenceIds: [] }, { orderId: id }, {})); 
                          setMessage("Message sent to operations."); 
                          setIsContacting(false);
                          setContactReason("");
                          await refresh();
                        } catch (e) { 
                          setMessage((e as Error).message); 
                        } finally { 
                          setBusy(false); 
                        }
                      }}
                      className="flex-1 bg-[#146b45] text-white font-semibold text-[13px] h-[40px] rounded-[9px] hover:bg-[#105b3a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {busy ? "Sending..." : "Send message"}
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setIsContacting(true)}
                  className="w-full bg-transparent text-[#146b45] border-transparent font-semibold text-[14px] h-[48px] rounded-[12px] flex items-center justify-center gap-2 hover:bg-[#146b45]/5 transition-colors"
                >
                  <HelpCircle size={18} /> Contact operations
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
