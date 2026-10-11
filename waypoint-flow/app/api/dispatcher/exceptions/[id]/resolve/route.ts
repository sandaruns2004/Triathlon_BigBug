import { webRoute } from "@/lib/mobile/web";
import { db } from "@/lib/db/firebase";
import {ensure, requireRole} from "@/lib/mobile/domain";
import {identifier} from "@/lib/mobile/errors";
import {writeAudit} from "@/lib/mobile/audit";

export const POST = webRoute(async (_req, params, principal) => {
  requireRole(principal, "dispatcher");
  
  const exceptionId = identifier(params.id);
  const exceptionRef = db.collection("exceptions").doc(exceptionId);
  await db.runTransaction(async tx => {
    const doc = await tx.get(exceptionRef);
    ensure(doc.exists,404,"not_found","Exception not found.");
    const exception = doc.data()!;
    ensure(exception.depot === principal.depot,403,"forbidden","This exception belongs to another depot.");
    ensure(!["shortfall","breakdown"].includes(exception.type),409,"review_required","Review the affected manifest or route in Operations Control before resolving this exception.");
    if (exception.resolved) return;
    tx.update(exceptionRef,{resolved:true,resolvedAt:new Date().toISOString(),resolvedBy:principal.userId});
    writeAudit(tx,principal,{action:"exception_resolved",entityType:"exception",entityId:exceptionId,depot:exception.depot});
  });

  return { success: true };
});
