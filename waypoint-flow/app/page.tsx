import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { redirect } from "next/navigation";

const ROLE_REDIRECT: Record<string, string> = {
  dispatcher:    "/dispatcher",
  loader:        "/loader",
  driver:        "/driver",
  store_manager: "/store",
};

/**
 * Root page — immediately redirects based on role.
 * If not logged in, goes to /login.
 */
export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect("/login");

  const role = (session.user as any).role as string;
  redirect(ROLE_REDIRECT[role] ?? "/login");
}
