import { db } from "@/lib/db/firebase";
import { allocate, type Order, type Vehicle } from "@/lib/allocation/engine";
import { webRoute } from "@/lib/mobile/web";
import { identifier } from "@/lib/mobile/errors";
import { businessDate, digest, ensure, requireRole, evidencePolicy } from "@/lib/mobile/domain";
const DISTRICTS={Colombo:{depotToDistrictFreeflowMin:20,interStopFreeflowMin:15},Gampaha:{depotToDistrictFreeflowMin:30,interStopFreeflowMin:20},Kandy:{depotToDistrictFreeflowMin:10,interStopFreeflowMin:12}};
const ALLOWANCES={"Fresh:street":10,"Fresh:rear_dock":15,"Fresh:mall_bay":20,"Style:street":15,"Style:rear_dock":20,"Style:mall_bay":25,"Tech:street":20,"Tech:rear_dock":25,"Tech:mall_bay":30};
export const POST=webRoute(async(_req,params,p)=>{
  requireRole(p,"dispatcher");const planId=identifier(params.id),today=businessDate();
  const [ordersSnap,vehiclesSnap,outletsSnap]=await Promise.all([
    db.collection("orders").where("depot","==",p.depot).where("planDate","==",today).where("tripId","==",null).where("status","in",["pending","deferred"]).get(),
    db.collection("vehicles").where("depot","==",p.depot).where("available","==",true).get(),
    db.collection("outlets").where("depot","==",p.depot).get(),
  ]);
  const orders=ordersSnap.docs.map(d=>({...d.data(),orderId:d.id})) as (Order&Record<string,any>)[];
  const vehicles=vehiclesSnap.docs.map(d=>({...d.data(),vehicleId:d.id})) as Vehicle[];
  ensure(orders.length>0,409,"no_orders","No eligible orders for this service date.");
  const {trips,deferred}=await allocate(orders,vehicles,DISTRICTS,ALLOWANCES);
  ensure(trips.length+orders.length*2+deferred.length<450,422,"plan_too_large","Split this depot plan into a bounded allocation.");
  const ref=db.collection("plans").doc(planId);
  await db.runTransaction(async tx=>{
    const plan=await tx.get(ref);
    ensure(plan.exists&&plan.data()!.depot===p.depot&&plan.data()!.planDate===today,403,"forbidden","Plan belongs to another depot or service date.");
    ensure(plan.data()!.status==="draft",409,"plan_already_allocated","This plan is already allocated. Existing delivery work is preserved.");
    const current=await Promise.all(ordersSnap.docs.map(d=>tx.get(d.ref)));
    ensure(current.every((d,i)=>d.exists&&digest(d.data())===digest(ordersSnap.docs[i].data())),409,"orders_changed","Orders changed. Refresh before allocation.");
    const currentVehicles=await Promise.all(vehiclesSnap.docs.map(d=>tx.get(d.ref)));
    ensure(currentVehicles.every((d,i)=>d.exists&&digest(d.data())===digest(vehiclesSnap.docs[i].data())),409,"fleet_changed","Fleet availability changed. Refresh.");
    const priorTrips=await tx.get(db.collection("trips").where("depot","==",p.depot).where("serviceDate","==",today));
    ensure(!priorTrips.docs.some(d=>vehicles.some(v=>v.vehicleId===d.data().vehicleId)),409,"vehicle_already_planned","A selected vehicle already has work today. Preserve its existing trips.");
    for(const trip of trips){
      const tripId=planId+"-"+trip.tripId,vehicle=vehicles.find(v=>v.vehicleId===trip.vehicleId)!;
      const earlier=trips.find(t=>t.vehicleId===trip.vehicleId&&t.tripNumber===trip.tripNumber-1);
      tx.create(db.collection("trips").doc(tripId),{tripId,planId,vehicleId:trip.vehicleId,tripNumber:trip.tripNumber,
        previousTripId:earlier?planId+"-"+earlier.tripId:null,driverId:null,driverName:"Unassigned",assignmentVersion:0,assignmentHistory:[],
        releaseVersion:0,routeRevision:1,progressVersion:0,released:false,held:false,evidencePolicy,brand:trip.brand,district:trip.district,depot:p.depot,
        status:"planned",stopCount:trip.orders.length,stopsCompleted:0,resolvedCount:0,
        weightKg:trip.orders.reduce((n,o)=>n+o.orderWeightKg,0),volumeM3:trip.orders.reduce((n,o)=>n+o.orderVolumeM3,0),
        weightCapKg:vehicle.weightCapKg,volumeCapM3:vehicle.volumeCapM3,planDate:today,serviceDate:today,
        etaDeparture:today+(trip.brand==="Fresh"?"T03:30:00+05:30":"T09:00:00+05:30"),
        etaReturn:today+(trip.brand==="Fresh"?"T08:00:00+05:30":"T17:00:00+05:30"),finish:trip.brand==="Fresh"?"08:00":"17:00"});
      trip.orders.forEach((o,index)=>{
        const order=orders.find(row=>row.orderId===o.orderId)!,outlet=outletsSnap.docs.find(d=>d.id===o.outletId)?.data();
        ensure(outlet,409,"outlet_missing","Outlet receiving instructions are missing.");
        const stopId=tripId+"-"+(index+1);
        tx.create(db.collection("trip_stops").doc(stopId),{stopId,tripId,orderId:o.orderId,outletId:o.outletId,outletName:outlet!.name,
          stopOrder:index+1,status:"needs_planning",loadingState:"pending",shortfallOpen:false,stopManifestRevision:1,stopDeliveryVersion:0,
          expectedKg:o.orderWeightKg,lines:order.lines,address:outlet!.address??"",latitude:outlet!.latitude??null,longitude:outlet!.longitude??null,
          window:(outlet!.windowOpenTime??"")+"–"+(outlet!.windowCloseTime??""),instruction:outlet!.instruction??"Follow the receiving instructions."});
        tx.update(db.collection("orders").doc(o.orderId),{tripId,stopId,planId,status:"planned",fulfillmentVersion:(order.fulfillmentVersion??0)+1});
        const eventId=digest([planId,o.orderId,"order_planned"]);
        tx.create(db.collection("domain_events").doc(eventId),{eventId,type:"order_planned",entityId:o.orderId,depot:p.depot,outletId:o.outletId,driverId:null,published:false,createdAt:new Date().toISOString()});
      });
    }
    for(const order of deferred)tx.update(db.collection("orders").doc(order.orderId),{status:"needs_deferral",deferralSuggestion:"Demand exceeds capacity"});
    tx.update(ref,{tripCount:trips.length,deferredCount:deferred.length,status:"allocated"});
  });
  return {success:true,tripsGenerated:trips.length,ordersDeferred:deferred.length};
});
