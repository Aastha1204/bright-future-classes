import { computeAnalytics, type Analytics } from "./analytics";
import { seedBundles } from "./seed-bundles";
import { getAdmin } from "./supabase";
import { mem, must, tryDb } from "./store";
import type { LeadRow, LeadStatus, MessageRow } from "./types";

/** Read/query side of the store: lists, filters, detail, status updates, analytics, alerts, reset. */

export interface LeadFilters {
  search?: string;
  badge?: "HOT" | "WARM" | "COLD";
  cls?: string;
  branch?: string;
  source?: string;
  from?: string; // YYYY-MM-DD (IST)
  to?: string;
  sort?: "score" | "date" | "updated";
  dir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export type LeadListRow = LeadRow & { source: string; visitor_id: string };

const IST = "+05:30";

function ensureMemSeed() {
  if (mem.seeded) return;
  mem.seeded = true;
  for (const b of seedBundles()) {
    mem.sessions.set(b.session.id, { id: b.session.id, visitor_id: b.session.visitor_id, ip_hash: null, source: "seed", mode: "live", language_detected: b.session.language_detected });
    mem.messages.push(...b.messages);
    mem.usage.push(...b.usage);
    mem.leads.set(b.session.id, b.lead);
    for (const e of b.events) mem.events.push({ ...e, lead_id: b.lead.id });
    if (b.alert) mem.alerts.push({ ...b.alert, lead_id: b.lead.id });
  }
}

const clean = (s: string) => s.replace(/[,()%*\\]/g, " ").trim();

function memRows(): LeadListRow[] {
  ensureMemSeed();
  return Array.from(mem.leads.values()).map((l) => {
    const s = mem.sessions.get(l.session_id);
    return { ...l, source: s?.source ?? "demo_page", visitor_id: s?.visitor_id ?? "" };
  });
}

function applyMem(rows: LeadListRow[], f: LeadFilters): LeadListRow[] {
  const q = f.search?.toLowerCase().trim();
  const from = f.from ? new Date(`${f.from}T00:00:00${IST}`).getTime() : null;
  const to = f.to ? new Date(`${f.to}T23:59:59.999${IST}`).getTime() : null;
  const out = rows.filter((l) => {
    if (f.badge && l.badge !== f.badge) return false;
    if (f.cls && l.class_or_exam !== f.cls) return false;
    if (f.branch && l.preferred_branch !== f.branch) return false;
    if (f.source && l.source !== f.source) return false;
    const t = new Date(l.created_at).getTime();
    if (from !== null && t < from) return false;
    if (to !== null && t > to) return false;
    if (q) {
      const hay = [l.student_name, l.parent_name, l.parent_phone, l.class_or_exam, l.preferred_branch].join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  const dir = f.dir === "asc" ? 1 : -1;
  out.sort((a, b) => {
    const k =
      f.sort === "score"
        ? a.score - b.score
        : f.sort === "updated"
          ? new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
          : new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    return k * dir || new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  return out;
}

type Joined = LeadRow & { sessions: { source: string; visitor_id: string } | { source: string; visitor_id: string }[] };
function flatten(r: Joined): LeadListRow {
  const { sessions, ...lead } = r;
  const s = Array.isArray(sessions) ? sessions[0] : sessions;
  return { ...(lead as LeadRow), source: s?.source ?? "demo_page", visitor_id: s?.visitor_id ?? "" };
}

export async function listLeads(f: LeadFilters = {}, paginate = true): Promise<{ rows: LeadListRow[]; total: number; page: number; pageSize: number }> {
  const pageSize = paginate ? Math.min(Math.max(f.pageSize ?? 20, 1), 100) : 5000;
  const page = paginate ? Math.max(f.page ?? 1, 1) : 1;

  const fromDb = await tryDb(async (db) => {
    let q = db.from("leads").select("*, sessions!inner(source, visitor_id)", { count: "exact" });
    if (f.badge) q = q.eq("badge", f.badge);
    if (f.cls) q = q.eq("class_or_exam", f.cls);
    if (f.branch) q = q.eq("preferred_branch", f.branch);
    if (f.source) q = q.eq("sessions.source", f.source);
    if (f.from) q = q.gte("created_at", `${f.from}T00:00:00${IST}`);
    if (f.to) q = q.lte("created_at", `${f.to}T23:59:59.999${IST}`);
    if (f.search && clean(f.search)) {
      const s = clean(f.search);
      q = q.or(`student_name.ilike.%${s}%,parent_name.ilike.%${s}%,parent_phone.ilike.%${s}%,class_or_exam.ilike.%${s}%`);
    }
    const asc = f.dir === "asc";
    q =
      f.sort === "score"
        ? q.order("score", { ascending: asc }).order("created_at", { ascending: false })
        : q.order(f.sort === "updated" ? "updated_at" : "created_at", { ascending: asc });
    const res = await q.range((page - 1) * pageSize, page * pageSize - 1);
    if (res.error) throw new Error(res.error.message);
    return { rows: (res.data as unknown as Joined[]).map(flatten), total: res.count ?? 0 };
  });
  if (fromDb) {
    // Overlay in-flight memory copies for this process so a just-written lead is never stale.
    return { ...fromDb, page, pageSize };
  }
  const all = applyMem(memRows(), f);
  return { rows: all.slice((page - 1) * pageSize, page * pageSize), total: all.length, page, pageSize };
}

export interface LeadDetail {
  lead: LeadListRow;
  messages: MessageRow[];
  events: { event_type: string; old_value: unknown; new_value: unknown; created_at: string }[];
  cost_inr: number;
}

export async function getLeadDetail(id: string): Promise<LeadDetail | null> {
  const fromDb = await tryDb(async (db) => {
    const row = must(await db.from("leads").select("*, sessions!inner(source, visitor_id)").eq("id", id).maybeSingle());
    if (!row) return null;
    const lead = flatten(row as unknown as Joined);
    const [messages, events, usage] = await Promise.all([
      db.from("messages").select("role, content, created_at, session_id").eq("session_id", lead.session_id).order("created_at"),
      db.from("lead_events").select("event_type, old_value, new_value, created_at").eq("lead_id", id).order("created_at"),
      db.from("usage_logs").select("cost_inr").eq("session_id", lead.session_id),
    ]);
    return {
      lead,
      messages: (must(messages) ?? []) as MessageRow[],
      events: (must(events) ?? []) as LeadDetail["events"],
      cost_inr: (must(usage) ?? []).reduce((s: number, u: { cost_inr: number | string }) => s + Number(u.cost_inr), 0),
    };
  });
  if (fromDb) return fromDb;

  const lead = memRows().find((l) => l.id === id);
  if (!lead) return null;
  return {
    lead,
    messages: mem.messages.filter((m) => m.session_id === lead.session_id),
    events: mem.events.filter((e) => e.lead_id === id).map((e) => ({ event_type: e.event_type, old_value: e.old_value, new_value: e.new_value, created_at: e.created_at })),
    cost_inr: mem.usage.filter((u) => u.session_id === lead.session_id).reduce((s, u) => s + u.cost_inr, 0),
  };
}

export async function updateLeadStatus(id: string, status: LeadStatus): Promise<boolean> {
  const now = new Date().toISOString();
  let old: string | null = null;
  for (const [sid, l] of mem.leads) {
    if (l.id === id) {
      old = l.status;
      mem.leads.set(sid, { ...l, status, updated_at: now });
      mem.events.push({ event_type: "status_changed", old_value: { status: old }, new_value: { status }, lead_id: id, created_at: now });
    }
  }
  const ok = await tryDb(async (db) => {
    const cur = must(await db.from("leads").select("status").eq("id", id).maybeSingle());
    if (!cur) return false;
    must(await db.from("leads").update({ status, updated_at: now }).eq("id", id));
    must(await db.from("lead_events").insert({ lead_id: id, event_type: "status_changed", old_value: { status: cur.status }, new_value: { status } }));
    return true;
  });
  return ok ?? old !== null;
}

export async function getAnalytics(): Promise<Analytics> {
  const since = new Date(Date.now() - 15 * 86400000).toISOString();
  const fromDb = await tryDb(async (db) => {
    const [leads, usage, msgs] = await Promise.all([
      db.from("leads").select("created_at, badge, score, phone_valid, demo_slot_requested, status, session_id").gte("created_at", since).limit(5000),
      db.from("usage_logs").select("session_id, cost_inr, created_at").gte("created_at", since).limit(20000),
      db.from("messages").select("content").eq("role", "user").gte("created_at", since).limit(8000),
    ]);
    return computeAnalytics({
      leads: must(leads) as never,
      usage: must(usage) as never,
      userMessages: (must(msgs) as { content: string }[]).map((m) => m.content),
    });
  });
  if (fromDb) return fromDb;
  ensureMemSeed();
  return computeAnalytics({
    leads: Array.from(mem.leads.values()),
    usage: mem.usage.map((u) => ({ session_id: u.session_id, cost_inr: u.cost_inr, created_at: u.created_at ?? new Date().toISOString() })),
    userMessages: mem.messages.filter((m) => m.role === "user").map((m) => m.content),
  });
}

export interface AlertOut {
  title: string;
  body: string;
  created_at: string;
}

/** HOT alerts created after `since`, only for seed leads or the viewer's own sessions. */
export async function alertsSince(since: string, viewerId: string | null): Promise<AlertOut[]> {
  const fromDb = await tryDb(async (db) => {
    const res = await db
      .from("alerts")
      .select("title, body, created_at, leads!inner(is_seed, sessions!inner(visitor_id))")
      .gt("created_at", since)
      .order("created_at")
      .limit(10);
    if (res.error) throw new Error(res.error.message);
    return (res.data as unknown as { title: string; body: string; created_at: string; leads: { is_seed: boolean; sessions: { visitor_id: string } | { visitor_id: string }[] } | { is_seed: boolean; sessions: { visitor_id: string } | { visitor_id: string }[] }[] }[])
      .filter((a) => {
        const lead = Array.isArray(a.leads) ? a.leads[0] : a.leads;
        const s = Array.isArray(lead?.sessions) ? lead.sessions[0] : lead?.sessions;
        return !!viewerId && s?.visitor_id === viewerId;
      })
      .map(({ title, body, created_at }) => ({ title, body, created_at }));
  });
  if (fromDb) return fromDb;
  ensureMemSeed();
  const byId = new Map(Array.from(mem.leads.values()).map((l) => [l.id, l]));
  return mem.alerts
    .filter((a) => a.created_at > since)
    .filter((a) => {
      const lead = byId.get(a.lead_id);
      const s = lead ? mem.sessions.get(lead.session_id) : undefined;
      return !!viewerId && s?.visitor_id === viewerId;
    })
    .map(({ title, body, created_at }) => ({ title, body, created_at }));
}

/** Clear visitor sessions and re-seed. Returns what was done. */
export async function resetDemo(): Promise<{ db: boolean; seeded: number }> {
  mem.sessions.clear();
  mem.messages.length = 0;
  mem.leads.clear();
  mem.events.length = 0;
  mem.alerts.length = 0;
  mem.usage.length = 0;
  mem.guardrails.length = 0;
  mem.rate.clear();
  mem.seeded = false;
  ensureMemSeed();

  const db = getAdmin();
  const r = await tryDb(async (d) => {
    must(await d.from("sessions").delete().neq("id", "00000000-0000-0000-0000-000000000000"));
    const b = seedBundles();
    const chunk = async <T extends object>(table: string, rows: T[]) => {
      for (let i = 0; i < rows.length; i += 200) must(await d.from(table).insert(rows.slice(i, i + 200)));
    };
    await chunk("sessions", b.map((x) => x.session));
    await chunk("messages", b.flatMap((x) => x.messages));
    await chunk("usage_logs", b.flatMap((x) => x.usage));
    await chunk("leads", b.map((x) => x.lead));
    await chunk("lead_events", b.flatMap((x) => x.events.map((e) => ({ ...e, lead_id: x.lead.id }))));
    await chunk("alerts", b.flatMap((x) => (x.alert ? [{ ...x.alert, lead_id: x.lead.id, channel: "whatsapp_mock", shown: true }] : [])));
    return b.length;
  });
  return { db: !!db && r !== undefined, seeded: r ?? mem.leads.size };
}
