import { webRoute } from "@/lib/mobile/web";
import { db } from "@/lib/db/firebase";

export const POST = webRoute(async (_req, params, principal) => {
  if (principal.role !== "dispatcher") {
    throw new Error("Forbidden");
  }
  
  const exceptionId = params.id;
  const exceptionRef = db.collection("exceptions").doc(exceptionId);
  const exceptionDoc = await exceptionRef.get();
  
  if (!exceptionDoc.exists) {
    throw new Error("Exception not found");
  }

  // Mark the exception as resolved
  await exceptionRef.update({
    resolved: true,
    resolvedAt: new Date().toISOString(),
    resolvedBy: principal.userId
  });

  return { success: true };
});
