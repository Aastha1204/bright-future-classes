import { NextResponse, type NextRequest } from "next/server";
import { viewerId } from "@/lib/api-utils";
import { alertsSince } from "@/lib/leads-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** New HOT alerts for the viewer's own demo chats since `?since=<ISO>`. */
export async function GET(req: NextRequest) {
  const since = req.nextUrl.searchParams.get("since");
  const ts = since && !Number.isNaN(Date.parse(since)) ? new Date(since).toISOString() : new Date(Date.now() - 60_000).toISOString();
  return NextResponse.json({ alerts: await alertsSince(ts, viewerId(req)), now: new Date().toISOString() });
}
