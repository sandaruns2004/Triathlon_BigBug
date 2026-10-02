export class BrowserApiError extends Error {
  constructor(message:string, readonly httpStatus:number, readonly code?:string) { super(message); }
}
export async function api(path:string,init?:RequestInit){
  const res=await fetch("/api/web/v1/"+path,{...init,headers:{"Content-Type":"application/json",...init?.headers}});
  const data=await res.json();if(!res.ok)throw new BrowserApiError(typeof data.error==="string"?data.error:data.error?.message??"Server unavailable. Retain your original work.",res.status,data.error?.code);
  return data;
}
export function envelope(type:string,payload:Record<string,unknown>,ids:Record<string,unknown>={},concurrency:Record<string,unknown>={}){
  return {operationId:crypto.randomUUID(),schemaVersion:1,type,observedAt:new Date().toISOString(),payload,concurrency,dependencyIds:[],...ids};
}
export async function submit(request:Record<string,unknown>){
  const response=await api("sync/operations",{method:"POST",body:JSON.stringify({operations:[request]})});
  const receipt=response.results[0];
  if(!["accepted","already_applied"].includes(receipt.status))throw new BrowserApiError(receipt.message??"The server did not accept this operation.",receipt.httpStatus??503,receipt.code);
  return receipt;
}
export async function uploadPhoto(file:File,evidenceId:string,scope:Record<string,string>){
  if(!["image/png","image/jpeg"].includes(file.type)||file.size>2097152)throw Error("Use a JPEG or PNG up to 2 MB.");
  const bytes=await file.arrayBuffer(),sha256=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",bytes))).map(b=>b.toString(16).padStart(2,"0")).join("");
  const session=await api("media/upload-sessions",{method:"POST",body:JSON.stringify({evidenceId,mime:file.type,bytes:file.size,sha256,...scope})});
  if(session.status!=="finalized"){
    const res=await fetch(session.uploadPath?"/api/web/v1/"+session.uploadPath:session.uploadUrl,{method:"PUT",body:file,headers:{"Content-Type":file.type},credentials:session.uploadPath?"same-origin":"omit"});
    if(!res.ok)throw Error("Photo upload failed. Keep the photo and retry.");
    const done=await api("media/"+evidenceId+"/finalize",{method:"POST",body:"{}"});
    if(done.status!=="finalized"||done.sha256!==sha256)throw Error("Photo verification failed.");
  }
  return evidenceId;
}
