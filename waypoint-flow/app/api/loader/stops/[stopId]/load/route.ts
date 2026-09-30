import { webRoute } from "@/lib/mobile/web";
import { loadStop } from "@/lib/mobile/operations";
export const PATCH = webRoute(async (_req, params, principal) => loadStop(principal, params.stopId));
