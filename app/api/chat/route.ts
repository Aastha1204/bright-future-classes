import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { ChatRequestSchema } from "@/lib/chat-schema";
import { handleChat } from "@/lib/chat-engine";
import { MAX_INPUT_CHARS } from "@/lib/guardrails";
import { llmConfigured } from "@/lib/llm";
import { checkRateLimit, clientIp, hashIp } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VISITOR_COOKIE = "bf_visitor";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  if (parsed.data.message.length > MAX_INPUT_CHARS * 4) {
    return NextResponse.json({ error: "Message too long" }, { status: 413 });
  }

  const visitorId = req.cookies.get(VISITOR_COOKIE)?.value ?? randomUUID();
  const ipHash = hashIp(clientIp(req.headers));

  const finish = (res: NextResponse) => {
    res.cookies.set(VISITOR_COOKIE, visitorId, { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30, path: "/" });
    return res;
  };

  const rl = await checkRateLimit(ipHash);
  if (!rl.allowed) {
    return finish(
      NextResponse.json(
        {
          rateLimited: true,
          reply: `You've reached the demo limit of ${rl.limit} messages per hour. You can still watch the scripted demos (Play demo A / B / C) — they work without limits!`,
          quick_replies: [],
        },
        { status: 429 },
      ),
    );
  }

  try {
    const out = await handleChat({
      sessionId: parsed.data.sessionId,
      message: parsed.data.message,
      source: parsed.data.source,
      visitorId,
      ipHash,
      userAgent: req.headers.get("user-agent"),
    });
    return finish(NextResponse.json({ ...out, llmConfigured: llmConfigured(), remaining: Math.max(0, rl.limit - rl.count) }));
  } catch (e) {
    console.error("[api/chat]", (e as Error).message);
    return finish(
      NextResponse.json(
        {
          reply: "Ek second, main counsellor se confirm karke batati hoon.",
          quick_replies: [],
          needs_human: true,
          error: true,
        },
        { status: 200 },
      ),
    );
  }
}
