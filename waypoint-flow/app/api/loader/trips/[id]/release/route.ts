import { db } from "@/lib/db/firebase";
import { webRoute } from "@/lib/mobile/web";
import { requireRole } from "@/lib/mobile/domain";
import { identifier } from "@/lib/mobile/errors";

export const POST = webRoute(async (_req, params, principal) => {
  requireRole(principal, "loader");
  const tripId = identifier(params.id);
  
  await db.runTransaction(async (tx) => {
    const ref = db.collection("trips").doc(tripId);
    const doc = await tx.get(ref);
    if (!doc.exists) throw new Error("Trip not found");
    
    const trip = doc.data()!;
    if (trip.depot !== principal.depot) {
      throw new Error("This trip belongs to another depot");
    }

    if (trip.held) {
      throw new Error("Cannot release vehicle while held (e.g. for shortfall)");
    }

    tx.update(ref, { 
      status: "ready_to_depart", 
      released: true,
      releaseVersion: (trip.releaseVersion ?? 0) + 1 
    });
  });

  return { success: true };
});
