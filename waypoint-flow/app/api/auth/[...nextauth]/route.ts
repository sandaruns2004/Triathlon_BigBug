import { authOptions } from "@/lib/auth/nextauth";
import NextAuth from "next-auth";

/**
 * Next.js App Router catch-all handler for NextAuth.
 * Handles GET and POST to /api/auth/[...nextauth]
 */
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
