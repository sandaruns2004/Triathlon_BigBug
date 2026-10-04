import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

function initFirebase() {
  if (getApps().length > 0) return;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (process.env.MOBILE_TEST_MODE === "emulator") {
    if (process.env.NODE_ENV === "production" || !projectId?.startsWith("demo-") ||
        !/^127\.0\.0\.1:\d+$/.test(process.env.FIRESTORE_EMULATOR_HOST ?? "") ||
        !/^127\.0\.0\.1:\d+$/.test(process.env.FIREBASE_AUTH_EMULATOR_HOST ?? "")) {
      throw new Error("Emulator mode requires a demo project, loopback emulators and development runtime.");
    }
    initializeApp({ projectId });
    return;
  }
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !privateKey || !process.env.FIREBASE_CLIENT_EMAIL) throw new Error("Configure server Firebase credentials.");
  initializeApp({ credential: cert({ projectId, privateKey, clientEmail: process.env.FIREBASE_CLIENT_EMAIL }) });
}
export function adminAuth() { initFirebase(); return getAuth(); }
// Route modules are compiled without operational credentials. Resolve Admin at
// request time; never embed a service-account key in the Docker build context.
const globalForFirestore = globalThis as unknown as { firestoreInstance: ReturnType<typeof getFirestore> | null };
export const db = new Proxy({} as ReturnType<typeof getFirestore>, {
  get(_target, property) {
    if (!globalForFirestore.firestoreInstance) {
      initFirebase();
      globalForFirestore.firestoreInstance = getFirestore();
    }
    const inst = globalForFirestore.firestoreInstance;
    const value = Reflect.get(inst, property, inst);
    return typeof value === "function" ? value.bind(inst) : value;
  },
});
