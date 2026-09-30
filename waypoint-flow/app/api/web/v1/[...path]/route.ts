import { createMobileHandler } from "@/lib/mobile/http";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { principalFromWeb } from "@/lib/auth/credentials";
import { ApiError } from "@/lib/mobile/errors";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const handler = createMobileHandler(async req => {
  if (req.method !== "GET" && req.headers.get("origin") !== new URL(process.env.NEXTAUTH_URL || req.url).origin) {
    throw new ApiError(403, "origin_rejected", "Use this application's browser origin.");
  }
  return principalFromWeb(await getServerSession(authOptions));
}, false);
export const GET = handler;
export const POST = handler;
export const PUT = handler;
