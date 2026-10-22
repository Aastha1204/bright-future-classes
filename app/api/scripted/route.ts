import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { handleChat } from "@/lib/chat-engine";
import { getScript } from "@/lib/scripted";
import { clientIp, hashIp } from "@/lib/ratelimit";
import { hitRateLimit } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  script: z.enum(["A", "B", "C"]),
  step: z.number().int().min(0).max(20),
  sessionId: z.string().uuid().optional(),
});

/** Replays one pre-computed turn through the normal pipeline (no LLM, no per-hour chat limit). */
export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { script, step, sessionId } = parsed.data;
  const turn = getScript(script).turns[step];
  if (!turn) return NextResponse.json({ error: "No such step" }, { status: 404 });

  const visitorId = req.cookies.get("bf_visitor")?.value ?? randomUUID();
  const ipHash = hashIp(clientIp(req.headers));
  // Generous separate ceiling so the scripted endpoint can't be hammered.
  const rl = await hitRateLimit(`scripted:${ipHash}`, 300);
  if (!rl.allowed) return NextResponse.json({ error: "Too many scripted plays this hour" }, { status: 429 });

  const out = await handleChat({
    sessionId,
    message: turn.user,
    source: `scripted_${script}`,
    scripted: { userText: turn.user, response: turn.bot },
    visitorId,
    ipHash,
    userAgent: req.headers.get("user-agent"),
  });
  const res = NextResponse.json(out);
  res.cookies.set("bf_visitor", visitorId, { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30, path: "/" });
  return res;
}
