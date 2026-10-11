"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { api, envelope, submit, BrowserApiError } from "@/lib/mobile/browser";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Minus, Plus, Search, Snowflake } from "lucide-react";
import { cn } from "@/lib/utils";

export default function NewOrderPage() {
  const router = useRouter(), request = useRef<any>();
  const {data: session} = useSession();
  const user = session?.user as {id?: string; role?: string; outletId?: string; authVersion?: number} | undefined;
  const draftKey = user?.role === "store_manager" && user.id && user.outletId
    ? "waypoint.store.cart.v1:" + JSON.stringify([process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, user.id, user.outletId, user.authVersion ?? 0]) : "";
  const [loadedDraftKey, setLoadedDraftKey] = useState("");
  const [draftWritable, setDraftWritable] = useState(true);
  const [catalogue, setCatalogue] = useState<any>();
  const [cart, setCart] = useState<Record<string, number>>({});
  const [date, setDate] = useState("");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [canCorrect, setCanCorrect] = useState(false);
  
  useEffect(() => { 
    api("store/catalogue").then(d => { 
      setCatalogue(d); 
      setDate(d.serviceOptions.serviceDates[0] ?? ""); 
    }).catch(e => setMessage(e.message)); 
  }, []);

  useEffect(() => {
    if (!draftKey || !catalogue) return;
    request.current = undefined;
    setCanCorrect(false);
    setCart({});
    setDraftWritable(true);
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft.schemaVersion !== 1 || draft.scope !== draftKey) throw Error("Draft scope changed");
        const restored: Record<string, number> = {};
        for (const product of catalogue.products) {
          const quantity = draft.cart?.[product.productId];
          if (Number.isInteger(quantity) && quantity > 0 && quantity <= (product.maxQuantity ?? 1000)) restored[product.productId] = quantity;
        }
        setCart(restored);
        if (catalogue.serviceOptions.serviceDates.includes(draft.date)) setDate(draft.date);
        else { setDate(catalogue.serviceOptions.serviceDates[0] ?? ""); setMessage("The saved delivery date expired. Review the available date before submitting."); }
        if (draft.operation?.type === "store_order_created" && typeof draft.operation.operationId === "string") {
          request.current = draft.operation;
          setCanCorrect(draft.rejected === true);
          setMessage("An earlier submission is retained. Retry uses the original request ID; review a rejected request before correcting it.");
        }
      }
    } catch {
      setDraftWritable(false);
      setMessage("The saved draft could not be opened. It is retained; draft autosave is paused.");
    }
    setLoadedDraftKey(draftKey);
  }, [draftKey, catalogue]);

  function persistDraft(rejected = canCorrect) {
    if (!draftKey || loadedDraftKey !== draftKey) throw Error("Wait for your outlet workspace to load.");
    localStorage.setItem(draftKey, JSON.stringify({schemaVersion:1, scope:draftKey, cart, date, operation:request.current, rejected}));
  }
  useEffect(() => {
    if (!draftKey || loadedDraftKey !== draftKey || !draftWritable) return;
    try { persistDraft(); } catch { setDraftWritable(false); setMessage("Draft autosave is unavailable. Keep this page open and retry saving before submitting."); }
  }, [cart, date, draftKey, loadedDraftKey, draftWritable, canCorrect]);

  async function save() {
    if (busy) return; 
    setBusy(true); 
    try {
      request.current ??= envelope("store_order_created", {
        requestedDate: date, 
        catalogueRevision: catalogue.revision, 
        serviceOptionsVersion: catalogue.serviceOptions.version,
        note: "", 
        lines: catalogue.products.filter((p: any) => cart[p.productId] > 0).map((p: any) => ({ productId: p.productId, quantity: cart[p.productId], unit: p.unit }))
      });
      persistDraft(false); // Preserve the UUID before any potentially uncertain network response.
      const receipt = await submit(request.current); 
      try { localStorage.removeItem(draftKey); } catch { /* A retained retry still uses this accepted UUID. */ }
      router.push("/store/orders/" + receipt.orderId);
    } catch (e) { 
      const rejected = e instanceof BrowserApiError && (e.httpStatus === 422 || (e.httpStatus === 409 && e.code === "catalogue_changed"));
      setCanCorrect(rejected);
      try { persistDraft(rejected); } catch { /* Keep the current request in memory. */ }
      setMessage((e as Error).message); 
    } finally { 
      setBusy(false); 
    }
  }

  const updateCart = (productId: string, delta: number, max: number = 1000) => {
    setCart(prev => {
      const current = prev[productId] || 0;
      const next = Math.max(0, Math.min(max, current + delta));
      return { ...prev, [productId]: next };
    });
  };

  const totalItems = Object.values(cart).reduce((n, q) => n + q, 0);
  if (!catalogue || !draftKey || loadedDraftKey !== draftKey) return <div className="p-8 text-center">{message || "Loading your outlet catalogue…"}</div>;

  return (
    <div className="flex flex-col h-full bg-[#f6f8f7] px-[22px] pt-[10px]">
      {message && <p role="status" className="py-2 text-[13px] text-[#ae483a]">{message}</p>}
      
      <div className="flex items-center gap-[8px] mb-[18px]">
        <Link href="/store" className="bg-transparent border-none p-2 -ml-[12px] text-[#17221d]">
          <ArrowLeft size={24} strokeWidth={2.5} />
        </Link>
        <h1 className="text-[22px] font-[650] tracking-tight m-0">Create an order</h1>
      </div>

      <div className="p-[14px] rounded-[10px] bg-[#eaf6ef] border border-[#d6e9dd] text-[#146b45] text-[13px] leading-[1.6] my-[14px]">
        Order by {catalogue?.serviceOptions?.cutoff || "4:00 PM"}. Requested delivery is subject to fleet planning.
      </div>

      <label className="block text-[13px] font-[650] my-[18px]">
        Delivery date
        <select 
          disabled={busy || !!request.current} 
          value={date} 
          onChange={e => setDate(e.target.value)} 
          className="block w-full mt-[8px] min-h-[48px] p-[12px] border border-[#cedbd1] rounded-[9px] bg-white text-[#17221d] font-[400] text-[16px]"
        >
          {catalogue?.serviceOptions?.serviceDates?.map((d: string) => <option key={d}>{d}</option>)}
        </select>
      </label>
      
      <p className="block text-[13px] font-[650] my-[18px]">Receiving window: {catalogue.serviceOptions.window} · {catalogue.serviceOptions.timeZone}</p>

      <div className="relative my-[15px]">
        <Search className="absolute left-[14px] top-[14px] text-[#8a968c]" size={20} />
        <input 
          placeholder="Search your outlet catalogue"
          aria-label="Search catalogue" 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          className="w-full border border-[#dce5df] bg-white rounded-[11px] p-[14px] pl-[42px] text-[16px]" 
        />
      </div>

      <div className="flex flex-col gap-[15px] mt-[5px]">
        {catalogue?.products.filter((p: any) => p.name.toLowerCase().includes(search.toLowerCase())).map((p: any) => (
          <div key={p.productId} className="bg-white border border-[#dce5df] rounded-[14px] p-[16px]">
            <h3 className="text-[14px] font-[650]">{p.name}</h3>
            <p className="text-[12px] text-[#6b7870] mt-[4px]">{p.unit} {p.maxQuantity ? `(Max: ${p.maxQuantity})` : ''}</p>
            
            <div className="flex items-center justify-between mt-[15px]">
              <span className="inline-flex items-center gap-[5px] rounded-[6px] px-[8px] py-[5px] text-[10px] font-[650] bg-[#eaf6ef] text-[#146b45] whitespace-nowrap">
                {["reefer", "chilled", "frozen"].includes(p.temperature) && <Snowflake size={12} />} Handling: {p.temperature ?? "See approved handling"}
              </span>
              
              <div className="flex items-center gap-[2px]">
                <button 
                  disabled={busy || !!request.current}
                  onClick={() => updateCart(p.productId, -1, p.maxQuantity)} 
                  className="w-[48px] h-[48px] p-0 flex items-center justify-center bg-white border border-transparent rounded-[8px] text-[21px] text-[#17221d] active:bg-[#f6f8f7]"
                >
                  <Minus size={20} />
                </button>
                <input 
                  type="number" 
                  min={0} 
                  max={p.maxQuantity ?? 1000} 
                  disabled={busy || !!request.current}
                  value={cart[p.productId] ?? 0}
                  aria-label={`Quantity for ${p.name}`}
                  onChange={e => setCart({ ...cart, [p.productId]: Math.max(0, Math.min(p.maxQuantity ?? 1000, Math.floor(Number(e.target.value) || 0))) })}
                  className="w-[50px] h-[48px] text-center border border-[#dce5df] rounded-[8px] font-semibold text-[16px]" 
                />
                <button 
                  disabled={busy || !!request.current}
                  onClick={() => updateCart(p.productId, 1, p.maxQuantity)} 
                  className="w-[48px] h-[48px] p-0 flex items-center justify-center bg-white border border-transparent rounded-[8px] text-[21px] text-[#17221d] active:bg-[#f6f8f7]"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {catalogue?.products && catalogue.products.filter((p: any) => p.name.toLowerCase().includes(search.toLowerCase())).length === 0 && (
          <div className="p-8 text-center text-[#6b7870]">No products match your search.</div>
        )}
      </div>

      <div className="flex justify-between items-center bg-white p-[18px] border border-[#dce5df] rounded-[14px] mt-[20px] mb-[15px]">
        <strong className="text-[14px] font-[650]">Your order</strong>
        <span className="font-[650] text-[#146b45]">{totalItems} packs</span>
      </div>

      <div className="grid gap-[10px] mt-[10px] mb-[20px]">
        <button 
          disabled={busy || !catalogue || (!request.current && (!date || totalItems === 0))}
          onClick={save}
          className="w-full bg-[#146b45] disabled:bg-[#146b45]/50 text-white font-semibold text-[14px] h-[48px] rounded-[12px] flex items-center justify-center gap-[9px] hover:bg-[#105b3a] transition-colors"
        >
          {busy ? "Submitting…" : request.current ? "Retry original request" : "Submit order request"} <ArrowRight size={18} />
        </button>
        {canCorrect && (
          <button 
            disabled={busy} 
            onClick={() => { request.current = undefined; setCanCorrect(false); setMessage("The server rejected the original request. Review the catalogue/date before creating a new correction."); }} 
            className="w-full bg-white text-[#17221d] border border-[#dce5df] font-semibold text-[14px] h-[48px] rounded-[12px] flex items-center justify-center gap-[9px] hover:bg-[#f0f6f1] transition-colors"
          >
            Review correction
          </button>
        )}
        {!canCorrect && (
          <button disabled={busy} onClick={() => { try { persistDraft(); setDraftWritable(true); setMessage("Draft saved on this browser for your account and outlet."); } catch { setMessage("Cannot save the draft. Keep this page open and check browser storage."); } }} className="w-full bg-transparent text-[#17221d] border-transparent font-semibold text-[14px] h-[48px] rounded-[12px] flex items-center justify-center gap-[9px] hover:bg-black/5 transition-colors">
            Save draft for later
          </button>
        )}
      </div>
      
      {request.current && !canCorrect && <p className="text-[11px] leading-[1.5] text-[#6b7870] text-center mb-[20px]">Retry preserves the original request ID. An uncertain response must not create a second order.</p>}
      <p className="text-[11px] leading-[1.5] text-[#6b7870] text-center mb-[20px]">Your cart is stored on this browser as you make changes.</p>
    </div>
  );
}
