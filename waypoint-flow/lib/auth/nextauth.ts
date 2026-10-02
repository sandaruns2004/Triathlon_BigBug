import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { verifyCredentials, currentPrincipal, rateLimitLogin } from "./credentials";
import { db } from "@/lib/db/firebase";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login", error: "/login" },
  providers: [CredentialsProvider({
    name: "credentials",
    credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" } },
    async authorize(credentials) {
      if (!credentials?.email || !credentials.password) return null;
      try { await rateLimitLogin(credentials.email); } catch { return null; }
      const principal = await verifyCredentials(credentials.email, credentials.password);
      return principal ? { id: principal.userId, ...principal } : null;
    },
  })],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const principal = user as typeof user & { role: string; depot: string | null; outletId: string | null; authVersion: number };
        token.id = user.id; token.role = principal.role; token.depot = principal.depot;
        token.outletId = principal.outletId; token.authVersion = principal.authVersion;
      }
      // Only verify against Firestore when a real session token exists.
      // Skipping this for unauthenticated requests prevents a 500 when token.id is undefined.
      if (!token.id) return token;
      try {
        const doc = await db.collection("users").doc(String(token.id)).get();
        if (!doc.exists) throw new Error("Removed account");
        const profile = currentPrincipal(doc.id, doc.data()!);
        if (token.authVersion !== profile.authVersion) throw new Error("Stale session");
        token.role = profile.role; token.depot = profile.depot; token.outletId = profile.outletId;
      } catch {
        token.id = ""; token.role = "revoked"; token.depot = null; token.outletId = null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) Object.assign(session.user, { id: token.id, role: token.role, depot: token.depot,
        outletId: token.outletId, authVersion: token.authVersion });
      return session;
    },
  },
};
export default NextAuth(authOptions);
