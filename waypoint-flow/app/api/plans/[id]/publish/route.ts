import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { db } from "@/lib/db/firebase";

/**
 * PATCH /api/plans/[id]/publish
 * Marks the plan as published.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "dispatcher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const planId = params.id;
  const planRef = db.collection("plans").doc(planId);

  await planRef.update({
    status: "published",
    publishedAt: new Date().toISOString(),
  });

  return NextResponse.json({ success: true });
}
