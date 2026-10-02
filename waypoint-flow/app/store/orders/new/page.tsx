"use client";
import {useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {api,envelope,submit,BrowserApiError} from "@/lib/mobile/browser";
export default function NewOrderPage(){
  const router=useRouter(),request=useRef<any>();
  const [catalogue,setCatalogue]=useState<any>(),[cart,setCart]=useState<Record<string,number>>({}),[date,setDate]=useState(""),
    [search,setSearch]=useState(""),[busy,setBusy]=useState(false),[message,setMessage]=useState(""),[canCorrect,setCanCorrect]=useState(false);
  useEffect(()=>{api("store/catalogue").then(d=>{setCatalogue(d);setDate(d.serviceOptions.serviceDates[0]??"");}).catch(e=>setMessage(e.message));},[]);
  async function save(){if(busy)return;setBusy(true);try{
    request.current??=envelope("store_order_created",{requestedDate:date,catalogueRevision:catalogue.revision,serviceOptionsVersion:catalogue.serviceOptions.version,
      note:"",lines:catalogue.products.filter((p:any)=>cart[p.productId]>0).map((p:any)=>({productId:p.productId,quantity:cart[p.productId],unit:p.unit}))});
    const receipt=await submit(request.current);router.push("/store/orders/"+receipt.orderId);
  }catch(e){setCanCorrect(e instanceof BrowserApiError&&e.httpStatus===422);setMessage((e as Error).message);}finally{setBusy(false);}}
  return <main className="max-w-3xl mx-auto space-y-4"><h1 className="text-2xl font-bold">Create order</h1><p role="status">{message}</p>
    <p>Server catalogue, receiving dates and units. Cut-off {catalogue?.serviceOptions.cutoff} Asia/Colombo.</p>
    <label className="block">Requested date<select disabled={busy||!!request.current} value={date} onChange={e=>setDate(e.target.value)} className="border p-3">
      {catalogue?.serviceOptions.serviceDates.map((d:string)=><option key={d}>{d}</option>)}</select></label>
    <input placeholder="Search catalogue" aria-label="Search catalogue" value={search} onChange={e=>setSearch(e.target.value)} className="border p-3 w-full"/>
    {catalogue?.products.filter((p:any)=>p.name.toLowerCase().includes(search.toLowerCase())).map((p:any)=><label key={p.productId} className="card-panel p-4 flex justify-between gap-3">
      {p.name} · {p.unit}<input disabled={busy||!!request.current} type="number" min={0} max={p.maxQuantity??10000} step={1} value={cart[p.productId]??0}
        onChange={e=>setCart({...cart,[p.productId]:Number(e.target.value)})} className="border p-2 w-28"/></label>)}
    <p>{Object.values(cart).reduce((n,q)=>n+q,0)} units requested. Quantities are validated and totals calculated by the server.</p>
    <button disabled={busy||!catalogue||!date} className="btn btn-primary" onClick={save}>Reviewed · submit request</button>
    {canCorrect&&<button disabled={busy} onClick={()=>{request.current=undefined;setCanCorrect(false);setMessage("The server rejected the original request. Review the catalogue/date before creating a new correction.");}} className="btn">Review correction</button>}
    {request.current&&!canCorrect&&<p>Retry preserves the original request ID. An uncertain response must not create a second order.</p>}
  </main>;
}
