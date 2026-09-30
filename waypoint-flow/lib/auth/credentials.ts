import bcrypt from "bcrypt";
import { createHash } from "node:crypto";
import { db, adminAuth } from "@/lib/db/firebase";
import { ApiError } from "@/lib/mobile/errors";

export type Principal = { userId: string; name: string; email: string; role: string; depot: string | null; outletId: string | null; authVersion: number; firebaseUid: string; verifiedAt?: number };
export const firebaseUidFor = (userId: string) => "wp_" + createHash("sha256").update(userId).digest("hex").slice(0, 48);
export function currentPrincipal(userId: string, data: FirebaseFirestore.DocumentData): Principal {
  if (data.enabled === false || ["invited", "disabled"].includes(data.accountStatus)) throw new ApiError(401, "account_locked", "Sign in again or contact operations.");
  if (!["driver", "store_manager", "loader", "dispatcher"].includes(data.role)) throw new ApiError(403, "invalid_role", "Contact operations for access.");
  if ((data.role === "store_manager" && !data.outletId) || (data.role !== "store_manager" && !data.depot)) throw new ApiError(403, "missing_scope", "Operations must configure your outlet or depot.");
  return { userId, name: String(data.name ?? ""), email: String(data.email ?? ""), role: data.role,
    depot: data.depot ?? null, outletId: data.outletId ?? null, authVersion: data.authVersion ?? 0,
    firebaseUid: data.firebaseUid ?? firebaseUidFor(userId) };
}
export async function verifyCredentials(email: string, password: string): Promise<Principal | null> {
  if (email.length > 254 || password.length > 128) return null;
  const snapshot = await db.collection("users").where("email", "==", email.trim().toLowerCase()).limit(2).get();
  // A missing identity still performs bcrypt work. No account-existence error is returned.
  const dummyHash = "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";
  const doc = snapshot.size === 1 ? snapshot.docs[0] : null;
  const data = doc?.data();
  const matches = await bcrypt.compare(password, data?.passwordHash ?? dummyHash);
  if (!doc || !matches) return null;
  try { return currentPrincipal(doc.id, data!); } catch { return null; }
}
export async function rateLimitLogin(email: string) {
  const key = createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
  const ref = db.collection("login_limits").doc(key);
  await db.runTransaction(async tx => {
    const old = (await tx.get(ref)).data();
    const now = Date.now();
    const active = old && old.expiresAt > now;
    const attempts = active ? old.attempts + 1 : 1;
    if (attempts > 10) throw new ApiError(429, "rate_limited", "Too many attempts. Try again in 15 minutes.");
    tx.set(ref, { attempts, expiresAt: active ? old.expiresAt : now + 15 * 60 * 1000 });
  });
}
export async function nativeLogin(email: string, password: string) {
  await rateLimitLogin(email);
  const verified = await verifyCredentials(email, password);
  if (!verified || !["driver", "store_manager"].includes(verified.role)) throw new ApiError(401, "invalid_credentials", "Email or password could not be verified.");
  const ref = db.collection("users").doc(verified.userId);
  await db.runTransaction(async tx => {
    const doc = await tx.get(ref);
    if (!doc.exists) throw new ApiError(401, "invalid_credentials", "Email or password could not be verified.");
    const current = currentPrincipal(doc.id, doc.data()!);
    if (current.authVersion !== verified.authVersion || current.firebaseUid !== verified.firebaseUid) throw new ApiError(401, "stale_signin", "Sign in again.");
    if (!doc.data()!.firebaseUid) tx.update(ref, { firebaseUid: verified.firebaseUid });
  });
  const customToken = await adminAuth().createCustomToken(verified.firebaseUid, {
    waypointUserId: verified.userId, waypointAuthVersion: verified.authVersion, waypointVerifiedAt: Date.now(),
  });
  return { customToken };
}
export async function principalFromBearer(request: Request): Promise<Principal> {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) throw new ApiError(401, "unauthorized", "Sign in to continue.");
  try {
    const decoded = await adminAuth().verifyIdToken(header.slice(7), true);
    if (typeof decoded.waypointUserId !== "string") throw new Error("Missing identity");
    const doc = await db.collection("users").doc(decoded.waypointUserId).get();
    if (!doc.exists) throw new Error("Missing profile");
    const profile = currentPrincipal(doc.id, doc.data()!);
    if (decoded.uid !== profile.firebaseUid || decoded.waypointAuthVersion !== profile.authVersion) throw new Error("Stale identity");
    if (typeof decoded.waypointVerifiedAt !== "number" || decoded.waypointVerifiedAt > Date.now() + 300000) throw new Error("Missing credential context");
    return { ...profile, verifiedAt: decoded.waypointVerifiedAt };
  } catch {
    throw new ApiError(401, "reauthentication_required", "Sign in again. Saved proof remains on your phone.");
  }
}
export async function principalFromWeb(session: { user?: unknown } | null): Promise<Principal> {
  const user = session?.user as { id?: string; authVersion?: number } | undefined;
  if (!user?.id) throw new ApiError(401, "unauthorized", "Sign in to continue.");
  const doc = await db.collection("users").doc(user.id).get();
  if (!doc.exists) throw new ApiError(401, "unauthorized", "Sign in again.");
  const current = currentPrincipal(doc.id, doc.data()!);
  if (user.authVersion !== current.authVersion) throw new ApiError(401, "stale_session", "Sign in again.");
  return current;
}
