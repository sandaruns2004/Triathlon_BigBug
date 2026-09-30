import test from "node:test";
import assert from "node:assert/strict";
import {seedMobileTestData} from "../scripts/seed-mobile-test";
import {db} from "../lib/db/firebase";
import {randomUUID} from "node:crypto";
const origin=process.env.MOBILE_HTTP_ORIGIN??"http://127.0.0.1:3000",password="local-emulator-only";
async function browserLogin(id:string){
  const csrf=await fetch(origin+"/api/auth/csrf");const data=await csrf.json() as any;
  const cookie=csrf.headers.getSetCookie().map(v=>v.split(";")[0]).join("; ");
  const response=await fetch(origin+"/api/auth/callback/credentials",{method:"POST",redirect:"manual",
    headers:{"Content-Type":"application/x-www-form-urlencoded",Cookie:cookie,Origin:origin},
    body:new URLSearchParams({email:id+"@emulator.waypoint.test",password,csrfToken:data.csrfToken,callbackUrl:origin,json:"true"})});
  const combined=[cookie,...response.headers.getSetCookie().map(v=>v.split(";")[0])].join("; ");
  const session=await fetch(origin+"/api/auth/session",{headers:{Cookie:combined}});const s=await session.json() as any;
  assert.equal(s.user?.id,id,"Shared browser credentials must work.");return combined;
}
test("real HTTP adapters: web/native identity, origin guards, scopes and revocation",async()=>{
  await seedMobileTestData();
  assert.equal((await fetch(origin+"/api/mobile/v1/me")).status,401);
  const login=await fetch(origin+"/api/mobile/v1/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({email:"test-driver@emulator.waypoint.test",password})});
  assert.equal(login.status,200);const bridge=await login.json() as any;
  const exchange=await fetch("http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=fake-emulator-api-key",
    {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:bridge.customToken,returnSecureToken:true})});
  const {idToken}=await exchange.json() as any;
  assert.equal((await fetch(origin+"/api/mobile/v1/me",{headers:{Authorization:"Bearer "+idToken}})).status,200);
  assert.equal((await fetch(origin+"/api/mobile/v1/store/orders/TEST-ORDER-1",{headers:{Authorization:"Bearer "+idToken}})).status,403);
  const cookies:Record<string,string>={};
  for(const id of ["test-driver","test-store","test-loader","test-dispatcher"])cookies[id]=await browserLogin(id);
  assert.equal((await fetch(origin+"/api/driver/trip",{headers:{Cookie:cookies["test-driver"]}})).status,200);
  assert.equal((await fetch(origin+"/api/store/orders/TEST-ORDER-2",{headers:{Cookie:cookies["test-store"]}})).status,403);
  assert.equal((await fetch(origin+"/api/orders/TEST-ORDER-2",{headers:{Cookie:cookies["test-store"]}})).status,403);
  const loading=await fetch(origin+"/api/loader/stops/TEST-STOP-1/load",{method:"PATCH",headers:{Cookie:cookies["test-loader"],Origin:origin}});
  assert.equal(loading.status,200,await loading.text());
  const browserOrder = {operationId:randomUUID(),schemaVersion:1,type:"store_order_created",observedAt:new Date().toISOString(),
    concurrency:{},dependencyIds:[],payload:{}};
  const catalogueResponse=await fetch(origin+"/api/web/v1/store/catalogue",{headers:{Cookie:cookies["test-store"]}});
  const catalogue=await catalogueResponse.json() as any;
  browserOrder.payload={requestedDate:catalogue.serviceOptions.serviceDates[0],catalogueRevision:catalogue.revision,
    serviceOptionsVersion:catalogue.serviceOptions.version,note:"Browser contract",lines:[{productId:"MILK-CASE",quantity:2,unit:"case"}]};
  for(const status of ["accepted","already_applied"]){
    const submitted=await fetch(origin+"/api/web/v1/sync/operations",{method:"POST",headers:{Cookie:cookies["test-store"],Origin:origin,"Content-Type":"application/json"},body:JSON.stringify({operations:[browserOrder]})});
    assert.equal(submitted.status,200);assert.equal(((await submitted.json()) as any).results[0].status,status);
  }
  const planId="TEST-HTTP-PLAN-"+randomUUID();
  await db.collection("plans").doc(planId).set({planId,depot:"Peliyagoda",status:"allocated"});
  await db.collection("trips").doc("TEST-TRIP-1").update({planId});
  await db.collection("orders").doc("TEST-ORDER-1").update({planId});
  for(let i=0;i<2;i++){
    const published=await fetch(origin+"/api/plans/"+planId+"/publish",{method:"PATCH",headers:{Cookie:cookies["test-dispatcher"],Origin:origin}});
    assert.equal(published.status,200,await published.text());
  }
  assert.equal((await db.collection("domain_events").doc("publish-"+planId+"-TEST-ORDER-1").get()).exists,true);
  assert.equal((await fetch(origin+"/api/operations",{method:"POST",headers:{Cookie:cookies["test-dispatcher"],Origin:"https://other.invalid","Content-Type":"application/json"},body:"{}"})).status,403);
  await db.collection("users").doc("test-driver").update({authVersion:1,enabled:false});
  assert.equal((await fetch(origin+"/api/mobile/v1/me",{headers:{Authorization:"Bearer "+idToken}})).status,401);
  assert.equal((await fetch(origin+"/api/driver/trip",{headers:{Cookie:cookies["test-driver"]}})).status,401);
});
