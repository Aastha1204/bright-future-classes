import { NextResponse, type NextRequest } from "next/server";
import { parseFilters, viewerId } from "@/lib/api-utils";
import { listLeads } from "@/lib/leads-store";
import { visibleLead } from "@/lib/mask";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const filters = parseFilters(req.nextUrl.searchParams);
  const { rows, total, page, pageSize } = await listLeads(filters);
  const viewer = viewerId(req);
  return NextResponse.json({ rows: rows.map((r) => ({ ...visibleLead(r, viewer), source: r.source })), total, page, pageSize });
}
