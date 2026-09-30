"use client";
import {useEffect,useRef,useState} from "react";
import {useParams} from "next/navigation";
import {api,envelope,submit} from "@/lib/mobile/browser";
export default function StoreOrderPage(){
  const {id}=useParams(),request=useRef<any>();
  const [order,setOrder]=useState<any>(),[note,setNote]=useState<any>(),[qty,setQty]=useState<Record<string,number>>({}),
    [reason,setReason]=useState(""),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
  async function refresh(){try{const o=await api("store/orders/"+id);setOrder(o);setQty(Object.fromEntries((o.deliveredLines??[]).map((l:any)=>[l.lineId,l.deliveredQty])));
    if(o.receiptId)setNote(await api("store/orders/"+id+"/delivery-note"));
  }catch(e){setMessage((e as Error).message);}}
  useEffect(()=>{refresh();},[id]);
  async function receipt(){if(busy)return;setBusy(true);try{
    request.current??=envelope("receipt_recorded",{lines:order.deliveredLines.map((l:any)=>({lineId:l.lineId,unit:l.unit,receivedQty:qty[l.lineId],reason:qty[l.lineId]!==l.deliveredQty?reason:""})),note:reason,evidenceIds:[]},
      {orderId:id},{receiptVersion:order.receiptVersion??0,proofVersion:order.proofVersion});
    await submit(request.current);await refresh();
  }catch(e){setMessage((e as Error).message);}finally{setBusy(false);}}
  async function update(type:string){if(busy)return;setBusy(true);try{
    const payload=type==="store_issue"?{category:"business_impact",reason,lineIds:[],evidenceIds:[]}:{};
    await submit(envelope(type,payload,{orderId:id},type==="update_acknowledged"?{updateVersion:order.updateVersion??0}:{}));setMessage("Server accepted the update.");await refresh();
  }catch(e){setMessage((e as Error).message);}finally{setBusy(false);}}
  return <main className="max-w-3xl mx-auto space-y-4"><h1 className="text-2xl font-bold">Order {String(id)}</h1>
    <p role="status">{message}</p><p>{order?.status} · requested {order?.requestedDate??order?.planDate}</p>
    {order?.tracking&&<p>Trip: {order.tracking.status} · vehicle {order.tracking.vehicleId}{order.tracking.held?" · operations hold":""}</p>}
    {order?.status==="deferred"&&<section className="card-panel p-5 bg-amber-50"><h2>Capacity deferral</h2><p>Sorry, this request could not travel as planned.</p>
      <p>{order.deferralReason} · proposed date {order.proposedDate??order.revisedDate}</p><button disabled={busy} onClick={()=>update("update_acknowledged")} className="btn btn-primary">Acknowledge update</button></section>}
    {(order?.lines??[]).map((l:any)=><p key={l.lineId}>{l.name}: ordered {l.quantity} {l.unit}</p>)}
    {(order?.deliveredLines??[]).map((l:any)=><label className="block" key={l.lineId}>{l.lineId}: delivered {l.deliveredQty} {l.unit}
      <input disabled={busy||!!order.receiptId||!!request.current} type="number" step={1} min={0} max={l.deliveredQty} value={qty[l.lineId]??0} onChange={e=>setQty({...qty,[l.lineId]:Number(e.target.value)})} className="border p-2 w-24"/></label>)}
    <label className="block">Receipt difference / business impact<textarea maxLength={1000} value={reason} onChange={e=>setReason(e.target.value)} className="border p-2 w-full"/></label>
    {order?.proofId&&!order.receiptId&&["delivered","partial"].includes(order.status)&&<button disabled={busy} onClick={receipt} className="btn btn-primary">Review and confirm receipt</button>}
    <button disabled={busy||!reason.trim()} onClick={()=>update("store_issue")} className="btn">Report business impact</button>
    <button onClick={refresh} className="btn">Refresh status</button>
    {note&&<section className="card-panel p-5"><h2 className="font-bold">Digital delivery note {note.reference}</h2>
      {["orderedLines","approvedLines","deliveredLines","acceptedLines"].map(key=><div key={key}><h3>{key.replace("Lines","")}</h3>{(note[key]??[]).map((l:any)=><p key={l.lineId}>{l.lineId}: {l.quantity??l.deliveredQty??l.receivedQty} {l.unit}</p>)}</div>)}
      <p>Issued {note.issuedAt} · revision {note.revision}{note.discrepancy?" · discrepancy reported":""}</p></section>}
  </main>;
}
