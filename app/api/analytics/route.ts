import { NextResponse } from "next/server";
import { getAnalytics } from "@/lib/leads-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getAnalytics());
}
