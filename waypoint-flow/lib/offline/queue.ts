import { openDB, type IDBPDatabase } from "idb";

const DB_NAME    = "waypoint-offline-v1";
const STORE_NAME = "delivery-queue";
const DB_VERSION = 1;

export interface QueuedDelivery {
  id:          string;       // local UUID
  type:        "delivery_completed" | "delivery_partial" | "access_issue" | "outlet_closed";
  orderId:     string;
  outletName:  string;
  payload:     Record<string, unknown>;
  localTime:   string;       // ISO timestamp when saved locally
  evidenceCount: number;     // number of photos/signatures attached
  synced:      boolean;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

/** Save a delivery action locally when offline. */
export async function enqueue(item: QueuedDelivery): Promise<void> {
  const db = await getDB();
  await db.put(STORE_NAME, item);
}

/** Get all unsynced queued records (shown in Sync Centre). */
export async function getQueue(): Promise<QueuedDelivery[]> {
  const db    = await getDB();
  const all   = await db.getAll(STORE_NAME) as QueuedDelivery[];
  return all.filter((r) => !r.synced);
}

/** Count of unsynced records (shown in offline banner). */
export async function queuedCount(): Promise<number> {
  const queue = await getQueue();
  return queue.length;
}

/** Mark a record as synced after successful upload. */
export async function markSynced(id: string): Promise<void> {
  const db   = await getDB();
  const item = await db.get(STORE_NAME, id) as QueuedDelivery | undefined;
  if (item) {
    await db.put(STORE_NAME, { ...item, synced: true });
  }
}

/** Attempt to sync all queued records. Returns count of successfully synced. */
export async function syncAll(): Promise<number> {
  if (!navigator.onLine) return 0;

  const queue = await getQueue();
  let synced  = 0;

  for (const item of queue) {
    try {
      const res = await fetch("/api/deliveries/sync", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(item),
      });
      if (res.ok) {
        await markSynced(item.id);
        synced++;
      }
    } catch {
      // Network failed mid-sync — leave record in queue, try next
    }
  }

  return synced;
}
