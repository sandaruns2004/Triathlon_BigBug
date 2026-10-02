import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db/firebase";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error:  "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Fetch user from Firestore
        const snapshot = await db
          .collection("users")
          .where("email", "==", credentials.email.toLowerCase())
          .limit(1)
          .get();

        if (snapshot.empty) return null;

        const doc  = snapshot.docs[0];
        const user = doc.data();

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );
        if (!passwordMatch) return null;

        return {
          id:       doc.id,
          name:     user.name,
          email:    user.email,
          role:     user.role,
          depot:    user.depot    ?? null,
          outletId: user.outletId ?? null,
        };
      },
    }),
  ],
  callbacks: {
    // Persist role/depot/outletId into the JWT token
    async jwt({ token, user }) {
      if (user) {
        token.id       = user.id;
        token.role     = (user as any).role;
        token.depot    = (user as any).depot;
        token.outletId = (user as any).outletId;
      }
      return token;
    },
    // Expose role/depot/outletId on the client-side session
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id       = token.id;
        (session.user as any).role     = token.role;
        (session.user as any).depot    = token.depot;
        (session.user as any).outletId = token.outletId;
      }
      return session;
    },
  },
};

export default NextAuth(authOptions);
