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
  const overview = await fetch(origin+"/api/dispatcher/overview",{headers:{Cookie:cookies["test-dispatcher"]}});
  assert.equal(overview.status,200);
  const overviewData = await overview.json() as any;
  assert.equal(overviewData.metrics.tripsPlanned,overviewData.trips.length,"Metrics must reflect canonical trips without a seeded daily_metrics document.");
  assert.equal(overviewData.metrics.fleetTotal,1);
  assert.equal(overviewData.metrics.driversIn,1);
  const foreignException = "TEST-FOREIGN-"+randomUUID(), heldException = "TEST-HELD-"+randomUUID();
  await db.collection("exceptions").doc(foreignException).set({depot:"Kandy",type:"delay",resolved:false});
  await db.collection("exceptions").doc(heldException).set({depot:"Peliyagoda",type:"shortfall",resolved:false});
  const dismiss = (id:string) => fetch(origin+"/api/dispatcher/exceptions/"+id+"/resolve",{method:"POST",headers:{Cookie:cookies["test-dispatcher"],Origin:origin}});
  assert.equal((await dismiss(foreignException)).status,403);
  assert.equal((await dismiss(heldException)).status,409);
  assert.equal((await db.collection("exceptions").doc(heldException).get()).data()!.resolved,false);
  for (const [id, wrong, home] of [
    ["test-dispatcher", "/store", "/dispatcher"], ["test-loader", "/dispatcher", "/loader"],
    ["test-driver", "/store", "/driver"], ["test-store", "/driver", "/store"],
  ]) {
    const guarded = await fetch(origin+wrong,{headers:{Cookie:cookies[id]},redirect:"manual"});
    assert.equal(guarded.status,307);
    assert.equal(new URL(guarded.headers.get("location")!, origin).href,origin+home);
  }
  assert.equal((await fetch(origin+"/api/seed")).status,405);
  assert.equal((await fetch(origin+"/api/seed",{method:"POST",headers:{Origin:origin}})).status,401);
  assert.equal((await fetch(origin+"/api/seed",{method:"POST",headers:{Origin:origin,Cookie:cookies["test-store"]}})).status,403);
  assert.equal((await fetch(origin+"/api/seed",{method:"POST",headers:{Origin:origin,Cookie:cookies["test-dispatcher"],"x-seed-secret":"incorrect"}})).status,403);
  assert.equal((await fetch(origin+"/api/driver/trip",{headers:{Cookie:cookies["test-driver"]}})).status,200);
  assert.equal((await fetch(origin+"/api/store/orders/TEST-ORDER-2",{headers:{Cookie:cookies["test-store"]}})).status,403);
  assert.equal((await fetch(origin+"/api/orders/TEST-ORDER-2",{headers:{Cookie:cookies["test-store"]}})).status,403);
  const release = (checks=[true,true,true,true]) => fetch(origin+"/api/loader/trips/TEST-TRIP-1/release", {method:"POST",headers:{Cookie:cookies["test-loader"],Origin:origin,"Content-Type":"application/json"},body:JSON.stringify({checks})});
  assert.equal((await release()).status,409,"An unchecked manifest must not be released.");
  const loading=await fetch(origin+"/api/loader/stops/TEST-STOP-1/load",{method:"PATCH",headers:{Cookie:cookies["test-loader"],Origin:origin}});
  assert.equal(loading.status,200,await loading.text());
  assert.equal((await release()).status,409,"One loaded stop cannot release a two-stop manifest.");
  assert.equal((await fetch(origin+"/api/loader/stops/TEST-STOP-2/load",{method:"PATCH",headers:{Cookie:cookies["test-loader"],Origin:origin}})).status,200);
  assert.equal((await db.collection("trips").doc("TEST-TRIP-1").get()).data()!.released,false);
  assert.equal((await release([true,true,false,true])).status,422,"Every departure check must be confirmed.");
  assert.equal((await release()).status,200);
  const releaseVersion = (await db.collection("trips").doc("TEST-TRIP-1").get()).data()!.releaseVersion;
  assert.equal((await release()).status,200);
  assert.equal((await db.collection("trips").doc("TEST-TRIP-1").get()).data()!.releaseVersion,releaseVersion,"Release retries retain their canonical version.");
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
  await db.collection("users").doc("test-dispatcher").update({authVersion:1,enabled:false});
  assert.equal((await fetch(origin+"/api/dispatcher/overview",{headers:{Cookie:cookies["test-dispatcher"]}})).status,401);
});
