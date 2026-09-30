import { createMobileHandler } from "@/lib/mobile/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const handler = createMobileHandler();
export const GET = handler;
export const POST = handler;
export const PUT = handler;

