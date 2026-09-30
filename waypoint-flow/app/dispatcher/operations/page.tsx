"use client";
import {useEffect,useState} from "react";
type Row=Record<string,any>;
export default function OperationsPage(){
  const [data,setData]=useState<Row>(),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
  async function refresh(){try{const res=await fetch("/api/operations");const d=await res.json();if(!res.ok)throw Error(d.error);setData(d);}catch(e){setMessage((e as Error).message);}}
  useEffect(()=>{refresh();const id=setInterval(refresh,30000);return()=>clearInterval(id);},[]);
  async function action(kind:string,id:string,payload:Row){if(busy)return;setBusy(true);try{
    const res=await fetch("/api/operations",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:kind,entityId:id,payload})});
    const result=await res.json();if(!res.ok)throw Error(result.error);setMessage("Server accepted the decision.");await refresh();
  }catch(e){setMessage((e as Error).message);}finally{setBusy(false);}}
  return <div className="space-y-5"><h1 className="text-2xl font-bold">Operations control</h1>
    <p>Assign enabled Drivers, resolve loading shortfalls and review preserved evidence. Updates come from committed server state.</p>
    <p role="status">{message}</p><button className="btn btn-primary" onClick={refresh}>Refresh</button>
    {data?.trips.map((trip:Row)=><section key={trip.tripId} className="card-panel p-5 space-y-3">
      <h2 className="font-bold">{trip.tripId} · {trip.vehicleId}</h2><p>{trip.status} · {trip.driverName??"Unassigned"}</p>
      <form onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);action("assign",trip.tripId,{driverId:f.get("driverId"),reason:f.get("reason")});}} className="flex gap-3 flex-wrap">
        <select required name="driverId" aria-label="Driver" className="border rounded p-2"><option value="">Choose Driver</option>{data.drivers.map((d:Row)=><option key={d.userId} value={d.userId}>{d.name}</option>)}</select>
        <input name="reason" required maxLength={500} placeholder="Assignment reason" aria-label="Assignment reason" className="border p-2 rounded"/>
        <button disabled={busy} className="btn btn-primary">Assign</button></form>
      {trip.held&&trip.status==="held"&&<form onSubmit={e=>{e.preventDefault();action("resolve_hold",trip.tripId,{reason:new FormData(e.currentTarget).get("reason")});}}>
        <input name="reason" required maxLength={1000} placeholder="Approved recovery reason" aria-label="Approved recovery reason" className="border p-2"/>
        <button disabled={busy} className="btn btn-primary">Resume held trip</button></form>}
    </section>)}
    {data?.orders.map((o:Row)=><section className="card-panel p-5 bg-amber-50" key={o.orderId}>
      <h2 className="font-bold">{o.orderId} · {o.status}</h2><p>{o.deferralReason??o.deferralSuggestion}</p>
      <form className="space-y-3" onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);action(o.status==="deferred"?"restore":"defer",o.orderId,
        {reason:f.get("reason"),[o.status==="deferred"?"serviceDate":"revisedDate"]:f.get("date")});}}>
        <label className="block">{o.status==="deferred"?"Return to planning date":"Proposed revised date"}<input required type="date" name="date" className="border p-2"/></label>
        <input name="reason" required maxLength={1000} placeholder="Mandatory reason" aria-label="Deferral or restoration reason" className="border p-2"/>
        <button disabled={busy} className="btn btn-primary">{o.status==="deferred"?"Restore to planning":"Confirm capacity deferral"}</button>
      </form></section>)}
    {data?.exceptions.filter((ex:Row)=>ex.type==="shortfall").map((ex:Row)=>{
      const stop=data.trips.flatMap((t:Row)=>t.stops).find((s:Row)=>s.stopId===ex.stopId);
      return <section key={ex.exceptionId} className="card-panel p-5"><h2 className="font-bold">Loading shortfall · {ex.stopId}</h2><p>{ex.detail}</p>
        <form onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);action("resolve_shortfall",ex.exceptionId,{reason:f.get("reason"),
          quantities:Object.fromEntries((stop?.lines??[]).map((l:Row)=>[l.lineId,Number(f.get(l.lineId))]))});}} className="space-y-3">
          {(stop?.lines??[]).map((l:Row)=><label key={l.lineId} className="block">{l.name} · approved {l.quantity} {l.unit}
            <input name={l.lineId} type="number" min={0} max={l.quantity} step={1} required defaultValue={l.quantity} className="border p-2 ml-3"/></label>)}
          <input name="reason" required maxLength={1000} placeholder="Store explanation and resolution" aria-label="Shortfall resolution" className="border p-2"/>
          <button disabled={busy} className="btn btn-primary">Approve adjusted manifest</button></form></section>;
    })}
    {data?.reviews.map((r:Row)=><section key={r.reviewId} className="card-panel p-5 space-y-3">
      <h2 className="font-bold">Preserved proof · {r.stopId}</h2><p>{r.reason} · {r.status}</p>
      {(r.operation?.payload?.lines??[]).map((l:Row)=><p key={l.lineId}>{l.lineId}: {l.deliveredQty} {l.unit} · {l.reason}</p>)}
      <p>Review preserves the original operation. It never overwrites another Driver's canonical proof.</p>
      {r.status==="awaiting_operations"&&r.canonical&&!r.canonical.proofId&&<form className="space-y-2" onSubmit={e=>{
        e.preventDefault();const f=new FormData(e.currentTarget),original=r.operation.payload;
        action("approve_review",r.reviewId,{reason:f.get("reason"),stopManifestRevision:r.canonical.stopManifestRevision,stopDeliveryVersion:r.canonical.stopDeliveryVersion??0,
          proof:{...original,proofId:f.get("proofId"),outcome:f.get("outcome"),parkedAcknowledged:true,reason:f.get("reason"),
            lines:r.canonical.lines.map((l:Row)=>({lineId:l.lineId,unit:l.unit,deliveredQty:Number(f.get(l.lineId)),reason:String(f.get("reason"))}))}});
      }}>
        <h3 className="font-bold">Approve a separate corrected proof</h3>
        <p>Original proof remains unchanged. This creates an audited amendment only when the current stop has no accepted proof.</p>
        <input type="hidden" name="proofId" defaultValue={crypto.randomUUID()}/>
        <select name="outcome" aria-label="Amended outcome" className="border p-2" defaultValue={r.operation.payload.outcome??"full"}>{["full","partial","failed","refused","skipped"].map(o=><option key={o}>{o}</option>)}</select>
        {r.canonical.lines.map((l:Row)=><label className="block" key={l.lineId}>{l.name} · approved {l.quantity} {l.unit}
          <input type="number" required min={0} max={l.quantity} step={1} name={l.lineId} defaultValue={Math.min(l.quantity,r.operation.payload.lines?.find((p:Row)=>p.lineId===l.lineId)?.deliveredQty??0)} className="border p-2 w-24"/></label>)}
        <input name="reason" required maxLength={1000} placeholder="Mandatory amendment reason" aria-label="Amendment reason" className="border p-2"/>
        <button disabled={busy} className="btn btn-primary">Approve corrected quantities</button>
      </form>}
      {r.status==="awaiting_operations"&&<form onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);action("resolve_review",r.reviewId,{decision:f.get("decision"),reason:f.get("reason")});}}>
        <select name="decision" aria-label="Review decision" className="border p-2"><option value="retain_for_audit">Retain for audit</option><option value="request_followup">Request follow-up</option></select>
        <input name="reason" required maxLength={1000} placeholder="Decision reason" aria-label="Review reason" className="border p-2"/>
        <button disabled={busy} className="btn btn-primary">Record decision</button></form>}
    </section>)}
  </div>;
}
