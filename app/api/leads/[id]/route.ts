import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { viewerId } from "@/lib/api-utils";
import { getLeadDetail, updateLeadStatus } from "@/lib/leads-store";
import { visibleLead } from "@/lib/mask";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = z.string().uuid();

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!UUID.safeParse(params.id).success) return NextResponse.json({ error: "Bad id" }, { status: 400 });
  const d = await getLeadDetail(params.id);
  if (!d) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const viewer = viewerId(req);
  const own = d.lead.is_seed || d.lead.visitor_id === viewer;
  return NextResponse.json({
    lead: visibleLead(d.lead, viewer),
    // Other visitors' private chats are not shown on the public demo.
    messages: own ? d.messages.map((m) => ({ role: m.role, content: m.content, created_at: m.created_at })) : [],
    events: own ? d.events : [],
    restricted: !own,
    cost_inr: d.cost_inr,
  });
}

const StatusBody = z.object({ status: z.enum(["new", "contacted", "demo_booked", "enrolled", "lost"]) });

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!UUID.safeParse(params.id).success) return NextResponse.json({ error: "Bad id" }, { status: 400 });
  const body = StatusBody.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  const d = await getLeadDetail(params.id);
  if (!d) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!d.lead.is_seed && d.lead.visitor_id !== viewerId(req)) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  await updateLeadStatus(params.id, body.data.status);
  return NextResponse.json({ ok: true, status: body.data.status });
}
