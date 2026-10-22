import { NextResponse, type NextRequest } from "next/server";
import { parseFilters, viewerId } from "@/lib/api-utils";
import { leadsToCsv } from "@/lib/csv";
import { listLeads } from "@/lib/leads-store";
import { visibleLead } from "@/lib/mask";
import type { LeadRow } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** CSV of all rows matching the current filters (UTF-8 with BOM for Excel). */
export async function GET(req: NextRequest) {
  const filters = parseFilters(req.nextUrl.searchParams);
  const { rows } = await listLeads(filters, false);
  const viewer = viewerId(req);
  const csv = leadsToCsv(rows.map((r) => visibleLead(r, viewer) as unknown as LeadRow));
  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="bright-future-leads-${stamp}.csv"`,
      "cache-control": "no-store",
    },
  });
}
