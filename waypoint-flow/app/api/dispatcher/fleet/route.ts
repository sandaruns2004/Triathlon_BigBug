import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { db } from "@/lib/db/firebase";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "dispatcher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const depot = (session.user as any).depot ?? "Peliyagoda";

  try {
    const vehiclesSnap = await db.collection("vehicles")
      .where("depot", "==", depot)
      .get();
      
    const vehicles = vehiclesSnap.docs.map(d => d.data());
    
    // Sort by vehicleId
    vehicles.sort((a, b) => (a.vehicleId || "").localeCompare(b.vehicleId || ""));

    return NextResponse.json({ vehicles });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
