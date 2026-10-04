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
  return (
    <div className="flex-1 overflow-y-auto px-[22px] pt-[10px] pb-[24px]">
      <div className="flex items-center gap-[8px] mt-[4px] mb-[23px]">
        <h1 className="text-[28px] leading-[1.2] tracking-[-1px] font-[650] my-[8px]">{stop?.name ?? "Stop proof"}</h1>
      </div>
      
      {message && <p role="status" className="text-[#ae483a] text-[13px] mb-[15px]">{message}</p>}
      
      <p className="text-[13px] text-[#6b7870] mb-[23px]">
        {stop?.address}<br/>
        <span className="inline-block mt-1">Window: {stop?.window}</span>
      </p>

      <label className="flex items-start gap-[10px] text-[14px] leading-[1.6] min-h-[48px] my-[15px] cursor-pointer">
        <input type="checkbox" checked={parked} onChange={e=>setParked(e.target.checked)} className="w-[20px] h-[20px] accent-[#146b45] flex-shrink-0 mt-1"/> 
        <span className="font-medium">I am safely parked</span>
      </label>

      {parked && <>
        <label className="block text-[13px] font-[650] my-[18px]">
          Outcome 
          <select 
            disabled={busy||!!request.current} 
            value={outcome} 
            onChange={e=>{
              setOutcome(e.target.value);
              if(["failed","refused","skipped"].includes(e.target.value)) setQty(Object.fromEntries(stop.lines.map((l:any)=>[l.lineId,0])));
            }} 
            className="block w-full mt-[8px] min-h-[48px] px-[12px] border border-[#cedbd1] rounded-[9px] bg-white text-[#17221d] font-normal text-[16px]"
          >
            {["full","partial","failed","refused","skipped"].map(o=><option key={o}>{o}</option>)}
          </select>
        </label>

        {stop?.lines.map((l:any)=>(
          <label className="block text-[13px] font-[650] my-[18px]" key={l.lineId}>
            <div className="mb-[8px]">{l.name} <span className="text-[#6b7870] font-normal ml-1">· approved {l.quantity} {l.unit}</span></div>
            <input 
              disabled={busy||!!request.current} 
              type="number" min={0} max={l.quantity} step={1} 
              value={qty[l.lineId]??0} 
              onChange={e=>setQty({...qty,[l.lineId]:Number(e.target.value)})} 
              className="block w-full min-h-[48px] px-[12px] border border-[#cedbd1] rounded-[9px] bg-white text-[#17221d] font-normal text-[16px]"
            />
          </label>
        ))}

        <label className="block text-[13px] font-[650] my-[18px]">
          Reason for exception / difference
          <textarea 
            disabled={busy||!!request.current} 
            maxLength={500} 
            value={reason} 
            onChange={e=>setReason(e.target.value)} 
            className="block w-full mt-[8px] min-h-[85px] p-[12px] border border-[#cedbd1] rounded-[9px] bg-white text-[#17221d] font-normal text-[16px] resize-y"
          />
        </label>

        {["full","partial"].includes(outcome) && (
          <label className="block text-[13px] font-[650] my-[18px]">
            Recipient
            <input 
              disabled={busy||!!request.current} 
              maxLength={120} 
              value={recipient} 
              onChange={e=>setRecipient(e.target.value)} 
              className="block w-full mt-[8px] min-h-[48px] px-[12px] border border-[#cedbd1] rounded-[9px] bg-white text-[#17221d] font-normal text-[16px]"
            />
          </label>
        )}

        <label className="block text-[13px] font-[650] my-[18px]">
          Delivery photos <span className="text-[#6b7870] font-normal ml-1">(up to three, 2 MB each)</span>
          <input 
            disabled={busy||!!request.current} 
            type="file" accept="image/jpeg,image/png" multiple 
            onChange={e=>setPhotos(Array.from(e.target.files??[]).slice(0,3).map(file=>({file,id:crypto.randomUUID()})))}
            className="block w-full mt-[8px] text-[14px] text-[#6b7870] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[14px] file:font-semibold file:bg-[#eaf6ef] file:text-[#146b45] hover:file:bg-[#d5f0df]"
          />
        </label>

        <div className="p-[14px] rounded-[10px] bg-[#eaf6ef] border border-[#d6e9dd] text-[#146b45] text-[13px] leading-[1.6] my-[22px]">
          Native Flutter saves encrypted evidence offline. This browser form requires a connection; retain this tab and the original photos during retry.
        </div>

        <div className="grid gap-[10px] mt-[22px]">
          <button 
            disabled={busy} 
            onClick={complete} 
            className="w-full min-h-[48px] px-[16px] border border-[#146b45] rounded-[12px] bg-[#146b45] text-white font-[600] text-[14px] flex items-center justify-center hover:bg-[#105b3a] disabled:opacity-45 disabled:cursor-not-allowed"
          >
            {busy ? "Submitting" : "Reviewed · submit proof"}
          </button>
          
          {request.current && (
            <button 
              disabled={busy} 
              onClick={()=>{
                if(window.confirm("Check Activity/operations before correcting. A lost response may already have been accepted.")){
                  request.current=undefined;
                  setMessage("Original IDs remain on the server; review quantities before saving a correction.");
                }
              }} 
              className="w-full min-h-[48px] px-[16px] border border-[#dce5df] rounded-[12px] bg-white text-[#17221d] font-[600] text-[14px] flex items-center justify-center hover:bg-[#f0f6f1] disabled:opacity-45 disabled:cursor-not-allowed"
            >
              Review correction
            </button>
          )}
        </div>
      </>}
    </div>
  );
}
