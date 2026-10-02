import {db} from "@/lib/db/firebase";
import {webRoute} from "@/lib/mobile/web";
import {ensure,requireRole} from "@/lib/mobile/domain";
import {identifier} from "@/lib/mobile/errors";
export const GET=webRoute(async(_req,params,p)=>{
  requireRole(p,"loader");const tripId=identifier(params.id);
  const tripDoc=await db.collection("trips").doc(tripId).get();
  ensure(tripDoc.exists,404,"not_found","Trip not found.");
  const trip=tripDoc.data()!;ensure(trip.depot===p.depot,403,"forbidden","This trip belongs to another depot.");
  const stops=await db.collection("trip_stops").where("tripId","==",tripId).get();
  return {trip:{...trip,tripId},stops:stops.docs.filter(d=>d.data().active!==false).map(d=>({...d.data(),stopId:d.id}))
    .sort((a:any,b:any)=>b.stopOrder-a.stopOrder)};
});
