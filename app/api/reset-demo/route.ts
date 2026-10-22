import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { resetDemo } from "@/lib/leads-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function tokenOk(given: string | null): boolean {
  const expected = process.env.DEMO_RESET_TOKEN;
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Clears visitor sessions and re-seeds the demo data. Disabled unless DEMO_RESET_TOKEN is set. */
export async function POST(req: NextRequest) {
  if (!process.env.DEMO_RESET_TOKEN) return NextResponse.json({ error: "Reset is disabled (no DEMO_RESET_TOKEN)" }, { status: 403 });
  if (!tokenOk(req.headers.get("x-demo-reset-token"))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ ok: true, ...(await resetDemo()) });
}
