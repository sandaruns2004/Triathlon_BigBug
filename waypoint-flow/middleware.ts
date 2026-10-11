import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Role-based route protection middleware.
 * Runs on every request BEFORE the page renders.
 *
 * Role → Allowed routes:
 *   dispatcher   → /dispatcher/*
 *   loader       → /loader/*
 *   driver       → /driver/*
 *   store_manager → /store/*
 *
 * All roles → /login (public)
 */

const ROLE_ROUTES: Record<string, string> = {
  dispatcher:    "/dispatcher",
  loader:        "/loader",
  driver:        "/driver",
  store_manager: "/store",
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Next normalizes loopback request URLs to localhost. Keep redirects on the
  // configured browser origin so the user's session cookie is not lost.
  const publicOrigin = new URL(process.env.NEXTAUTH_URL || request.url).origin;

  // Allow public routes
  if (pathname.startsWith("/login") || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  // Not authenticated → redirect to login
  if (!token) {
    return NextResponse.redirect(new URL("/login", publicOrigin));
  }

  const role = token.role as string;
  const allowed = ROLE_ROUTES[role];

  if (!allowed) return NextResponse.redirect(new URL("/login", publicOrigin));

  // Role trying to access a route it doesn't own → redirect to its home
  if (allowed && !pathname.startsWith(allowed) && !pathname.startsWith("/api")) {
    return NextResponse.redirect(new URL(allowed, publicOrigin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dispatcher/:path*",
    "/loader/:path*",
    "/driver/:path*",
    "/store/:path*",
  ],
};
