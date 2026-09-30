"use client";
import {useEffect,useRef,useState} from "react";
import {useParams,useRouter} from "next/navigation";
import {api,envelope,submit,uploadPhoto} from "@/lib/mobile/browser";
export default function DriverStopPage(){
  const {id}=useParams(),router=useRouter();
  const [stop,setStop]=useState<any>(),[trip,setTrip]=useState<any>(),[outcome,setOutcome]=useState("full"),
    [qty,setQty]=useState<Record<string,number>>({}),[reason,setReason]=useState(""),[recipient,setRecipient]=useState(""),
    [photos,setPhotos]=useState<{file:File;id:string}[]>([]),[parked,setParked]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
  const request=useRef<any>();
  useEffect(()=>{api("driver/stops/"+id).then(async s=>{
    setStop(s);setQty(Object.fromEntries(s.lines.map((l:any)=>[l.lineId,l.quantity])));
    setTrip(await api("driver/trips/"+s.tripId));
  }).catch(e=>setMessage(e.message));},[id]);
  async function complete(){
    if(busy||!parked||!stop||!trip)return;setBusy(true);
    try{
      if(!request.current){
        if(["full","partial"].includes(outcome)&&(!recipient.trim()||photos.length===0))throw Error("Enter the recipient and retain at least one photo.");
        const evidenceIds=[];for(const p of photos)evidenceIds.push(await uploadPhoto(p.file,p.id,{tripId:trip.tripId,stopId:stop.stopId,orderId:stop.orderId}));
        request.current=envelope("delivery_recorded",{proofId:crypto.randomUUID(),outcome,parkedAcknowledged:true,recipientName:recipient.trim(),
          reason,note:"",lines:stop.lines.map((l:any)=>({lineId:l.lineId,unit:l.unit,deliveredQty:qty[l.lineId],reason:qty[l.lineId]!==l.quantity?reason:""})),evidenceIds},
          {tripId:trip.tripId,stopId:stop.stopId,orderId:stop.orderId},{assignmentVersion:trip.assignmentVersion,stopManifestRevision:stop.stopManifestRevision,
            stopDeliveryVersion:stop.stopDeliveryVersion,orderFulfillmentVersions:{[stop.orderId]:stop.orderFulfillmentVersion}});
      }
      await submit(request.current);router.push("/driver");
    }catch(e){setMessage((e as Error).message);}finally{setBusy(false);}
  }
  return <main className="p-5 space-y-4"><h1 className="text-xl font-bold">{stop?.name??"Stop proof"}</h1><p role="status">{message}</p>
    <p>{stop?.address} · {stop?.window}</p>
    <label className="block"><input type="checkbox" checked={parked} onChange={e=>setParked(e.target.checked)}/> I am safely parked</label>
    {parked&&<><label className="block">Outcome <select disabled={busy||!!request.current} value={outcome} onChange={e=>{setOutcome(e.target.value);if(["failed","refused","skipped"].includes(e.target.value))setQty(Object.fromEntries(stop.lines.map((l:any)=>[l.lineId,0])));}} className="border p-2">
      {["full","partial","failed","refused","skipped"].map(o=><option key={o}>{o}</option>)}</select></label>
      {stop?.lines.map((l:any)=><label className="block" key={l.lineId}>{l.name} · approved {l.quantity} {l.unit}
        <input disabled={busy||!!request.current} type="number" min={0} max={l.quantity} step={1} value={qty[l.lineId]??0} onChange={e=>setQty({...qty,[l.lineId]:Number(e.target.value)})} className="border p-2 w-24"/></label>)}
      <label className="block">Reason for exception / difference<textarea disabled={busy||!!request.current} maxLength={500} value={reason} onChange={e=>setReason(e.target.value)} className="border p-2 w-full"/></label>
      {["full","partial"].includes(outcome)&&<label className="block">Recipient<input disabled={busy||!!request.current} maxLength={120} value={recipient} onChange={e=>setRecipient(e.target.value)} className="border p-2 w-full"/></label>}
      <label className="block">Delivery photos (up to three, 2 MB each)<input disabled={busy||!!request.current} type="file" accept="image/jpeg,image/png" multiple onChange={e=>setPhotos(Array.from(e.target.files??[]).slice(0,3).map(file=>({file,id:crypto.randomUUID()})))}/></label>
      <p>Native Flutter saves encrypted evidence offline. This browser form requires a connection; retain this tab and the original photos during retry.</p>
      <button disabled={busy} onClick={complete} className="btn btn-primary">{busy?"Submitting":"Reviewed · submit proof"}</button>
      {request.current&&<button disabled={busy} onClick={()=>{if(window.confirm("Check Activity/operations before correcting. A lost response may already have been accepted.")){request.current=undefined;setMessage("Original IDs remain on the server; review quantities before saving a correction.");}}} className="btn">Review correction</button>}
    </>}
  </main>;
}
