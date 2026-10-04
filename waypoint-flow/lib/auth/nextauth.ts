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
      // Rely on the stateless JWT payload for subsequent requests to avoid 
      // the massive overhead of hitting Firestore on every session check/API call.
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
