import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { principalFromWeb, type Principal } from "@/lib/auth/credentials";
import { ApiError } from "./errors";
import { ZodError } from "zod";

export function webRoute(action: (req: NextRequest, params: Record<string, string>, principal: Principal) => Promise<unknown>) {
  return async (req: NextRequest, context?: { params: Record<string, string> }) => {
    try {
      // Next's internal request URL may use localhost behind the custom server/proxy.
      // Compare to the configured PUBLIC origin, never a client-supplied forwarded host.
      const publicOrigin = new URL(process.env.NEXTAUTH_URL || req.url).origin;
      if (!["GET", "HEAD"].includes(req.method) && req.headers.get("origin") !== publicOrigin) throw new ApiError(403, "origin_rejected", "Use this application's browser origin.");
      const principal = await principalFromWeb(await getServerSession(authOptions));
      return NextResponse.json(await action(req, context?.params ?? {}, principal), { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
      if (error instanceof ApiError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
      if (error instanceof ZodError) return NextResponse.json({ error: "Review the request fields.", code: "invalid_request" }, { status: 422 });
      return NextResponse.json({ error: "Server unavailable. Retry without discarding saved work." }, { status: 503 });
    }
  };
}
