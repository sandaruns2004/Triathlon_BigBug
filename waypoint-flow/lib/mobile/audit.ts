import { randomUUID } from "node:crypto";
import { db } from "@/lib/db/firebase";
import type { Principal } from "@/lib/auth/credentials";
import { requireRole, type RecordData } from "./domain";
import { ApiError } from "./errors";

export type AuditEntry = {
  action: string;
  entityType: "operation" | "plan" | "route" | "order" | "exception" | "review";
  entityId: string;
  depot?: string | null;
  outletId?: string | null;
  operationId?: string;
};

// Audit records intentionally contain metadata only. Request payloads can hold
// credentials, recipient details, signatures, reasons, or evidence references.
export function writeAudit(
  tx: FirebaseFirestore.Transaction,
  principal: Principal,
  entry: AuditEntry,
) {
  const auditId = randomUUID();
  tx.create(db.collection("audit_logs").doc(auditId), {
    auditId,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    operationId: entry.operationId ?? null,
    actorUserId: principal.userId,
    actorRole: principal.role,
    depot: entry.depot ?? principal.depot ?? null,
    outletId: entry.outletId ?? principal.outletId ?? null,
    createdAt: new Date().toISOString(),
  });
}

export async function auditEntries(principal: Principal, limit = 50) {
  requireRole(principal, "dispatcher");
  const depot = principal.depot;
  if (!depot) throw new ApiError(403, "missing_scope", "A depot is required to view audit history.");
  const snapshot = await db
    .collection("audit_logs")
    .where("depot", "==", depot)
    .get();
  return snapshot.docs
    .map((doc) => ({ ...doc.data(), auditId: doc.id }) as RecordData)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0, Math.min(Math.max(limit, 1), 100));
}
