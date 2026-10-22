import { randomUUID } from "node:crypto";
import { getAdmin } from "./supabase";
import type {
  AlertRow,
  GuardrailType,
  LeadEventRow,
  LeadRow,
  MessageRow,
  SessionRow,
  UsageRow,
} from "./types";

export interface SaveTurnArgs {
  sessionId: string;
  userMessage: MessageRow;
  assistantMessage: MessageRow;
  lead: LeadRow;
  events: LeadEventRow[];
  usage: UsageRow | null;
  alert: AlertRow | null;
  language: string | null;
}

/** Persistence used by the chat engine: Supabase when configured, always mirrored in memory as a fallback. */

interface Mem {
  sessions: Map<string, SessionRow>;
  messages: MessageRow[];
  leads: Map<string, LeadRow>; // by session id
  events: (LeadEventRow & { lead_id: string; created_at: string })[];
  alerts: (AlertRow & { lead_id: string; created_at: string })[];
  usage: (UsageRow & { session_id: string; created_at?: string })[];
  seeded?: boolean;
  guardrails: { session_id: string | null; type: GuardrailType; user_text: string; created_at: string }[];
  rate: Map<string, number>;
}

const g = globalThis as unknown as { __bfMem?: Mem };
const mem: Mem = (g.__bfMem ??= {
  sessions: new Map(),
  messages: [],
  leads: new Map(),
  events: [],
  alerts: [],
  usage: [],
  guardrails: [],
  rate: new Map(),
});

export { mem };

export async function tryDb<T>(fn: (db: NonNullable<ReturnType<typeof getAdmin>>) => Promise<T>): Promise<T | undefined> {
  const db = getAdmin();
  if (!db) return undefined;
  try {
    return await fn(db);
  } catch (e) {
    console.warn("[store] Supabase call failed, using in-memory fallback:", (e as Error).message);
    return undefined;
  }
}

export function must<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

export function dbConfigured(): boolean {
  return getAdmin() !== null;
}

export async function getSession(id: string): Promise<SessionRow | null> {
  const fromDb = await tryDb(async (db) =>
    must(await db.from("sessions").select("*").eq("id", id).maybeSingle()),
  );
  return (fromDb as SessionRow | null | undefined) ?? mem.sessions.get(id) ?? null;
}

export async function createSession(row: Omit<SessionRow, "id">): Promise<SessionRow> {
  const session: SessionRow = { id: randomUUID(), ...row };
  mem.sessions.set(session.id, session);
  await tryDb(async (db) => must(await db.from("sessions").insert(session)));
  return session;
}

export async function getMessages(sessionId: string, limit = 12): Promise<MessageRow[]> {
  const fromDb = await tryDb(async (db) =>
    must(
      await db
        .from("messages")
        .select("role, content, raw_json, session_id, created_at")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false })
        .limit(limit),
    ),
  );
  if (fromDb && fromDb.length) return (fromDb as MessageRow[]).reverse();
  return mem.messages.filter((m) => m.session_id === sessionId).slice(-limit);
}

export async function getAllMessages(sessionId: string): Promise<MessageRow[]> {
  return getMessages(sessionId, 200);
}

export async function getLead(sessionId: string): Promise<LeadRow | null> {
  const fromDb = await tryDb(async (db) =>
    must(await db.from("leads").select("*").eq("session_id", sessionId).maybeSingle()),
  );
  return (fromDb as LeadRow | null | undefined) ?? mem.leads.get(sessionId) ?? null;
}

export async function userMessageCount(sessionId: string): Promise<number> {
  const fromDb = await tryDb(async (db) => {
    const res = await db
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("session_id", sessionId)
      .eq("role", "user");
    if (res.error) throw new Error(res.error.message);
    return res.count ?? 0;
  });
  const local = mem.messages.filter((m) => m.session_id === sessionId && m.role === "user").length;
  return Math.max(fromDb ?? 0, local);
}

export async function sessionCostInr(sessionId: string): Promise<number> {
  const local = mem.usage.filter((u) => u.session_id === sessionId).reduce((s, u) => s + u.cost_inr, 0);
  const fromDb = await tryDb(async (db) =>
    must(await db.from("usage_logs").select("cost_inr").eq("session_id", sessionId)),
  );
  const dbSum = (fromDb ?? []).reduce((s: number, u: { cost_inr: number | string }) => s + Number(u.cost_inr), 0);
  return Math.max(local, dbSum);
}

export async function saveTurn(a: SaveTurnArgs): Promise<void> {
  const now = new Date().toISOString();
  mem.messages.push({ ...a.userMessage, created_at: now }, { ...a.assistantMessage, created_at: now });
  mem.leads.set(a.sessionId, a.lead);
  for (const e of a.events) mem.events.push({ ...e, lead_id: a.lead.id, created_at: now });
  if (a.alert) mem.alerts.push({ ...a.alert, lead_id: a.lead.id, created_at: now });
  if (a.usage) mem.usage.push({ ...a.usage, session_id: a.sessionId, created_at: now });
  const s = mem.sessions.get(a.sessionId);
  if (s && a.language) s.language_detected = a.language;

  await tryDb(async (db) => {
    must(await db.from("messages").insert([a.userMessage, a.assistantMessage]));
    must(await db.from("leads").upsert(a.lead, { onConflict: "session_id" }));
    if (a.events.length) {
      must(await db.from("lead_events").insert(a.events.map((e) => ({ ...e, lead_id: a.lead.id }))));
    }
    if (a.alert) must(await db.from("alerts").insert({ ...a.alert, lead_id: a.lead.id, channel: "whatsapp_mock" }));
    if (a.usage) must(await db.from("usage_logs").insert({ ...a.usage, session_id: a.sessionId }));
    must(
      await db
        .from("sessions")
        .update({ last_active_at: now, ...(a.language ? { language_detected: a.language } : {}) })
        .eq("id", a.sessionId),
    );
  });
}

export async function logGuardrail(sessionId: string | null, type: GuardrailType, text: string): Promise<void> {
  const row = { session_id: sessionId, type, user_text: text.slice(0, 500) };
  mem.guardrails.push({ ...row, created_at: new Date().toISOString() });
  await tryDb(async (db) => must(await db.from("guardrail_events").insert(row)));
}

/** Counts one message against the hourly window; returns whether it is still within `limit`. */
export async function hitRateLimit(ipHash: string, limit: number): Promise<{ allowed: boolean; count: number }> {
  const windowStart = new Date(Math.floor(Date.now() / 3_600_000) * 3_600_000).toISOString();
  const key = `${ipHash}:${windowStart}`;
  const local = (mem.rate.get(key) ?? 0) + 1;
  mem.rate.set(key, local);

  const fromDb = await tryDb(async (db) => {
    const cur = must(
      await db.from("rate_limits").select("count").eq("ip_hash", ipHash).eq("window_start", windowStart).maybeSingle(),
    );
    const next = (cur?.count ?? 0) + 1;
    must(await db.from("rate_limits").upsert({ ip_hash: ipHash, window_start: windowStart, count: next }));
    return next;
  });
  const count = Math.max(local, fromDb ?? 0);
  return { allowed: count <= limit, count };
}
