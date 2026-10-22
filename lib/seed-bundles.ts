import { generateSeedLeads } from "./seed-data";
import type { LeadEventRow, LeadRow, MessageRow, UsageRow } from "./types";

/** Seed leads as normalised DB-shaped rows (shared by the in-memory store and DB seeding). */

const MODEL = "claude-haiku-5-5";
const IST_MIN = 330;

function slotIso(daysAhead: number, time: string, now: number): string {
  const ist = new Date(now + IST_MIN * 60000);
  const [h, m] = time.split(":").map(Number);
  return new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate() + daysAhead, h, m) - IST_MIN * 60000).toISOString();
}

export interface SeedBundle {
  session: {
    id: string;
    visitor_id: string;
    ip_hash: null;
    user_agent: string;
    source: "seed";
    mode: "live";
    language_detected: string;
    started_at: string;
    last_active_at: string;
    created_at: string;
  };
  messages: MessageRow[];
  usage: (UsageRow & { session_id: string; created_at: string })[];
  lead: LeadRow;
  events: (LeadEventRow & { created_at: string })[];
  alert: { title: string; body: string; created_at: string } | null;
}

export function seedBundles(now: number = Date.now()): SeedBundle[] {
  return generateSeedLeads().map((l, i) => {
    const t0 = now - l.minutesAgo * 60000;
    const iso = (sec: number) => new Date(t0 + sec * 1000).toISOString();
    const lastSec = l.messages[l.messages.length - 1].offsetSec;
    const sid = l.sessionId;
    const lead: LeadRow = {
      id: l.id,
      session_id: sid,
      student_name: l.student_name,
      parent_name: l.parent_name,
      parent_phone: l.parent_phone,
      phone_valid: l.phone_valid,
      class_or_exam: l.class_or_exam,
      board: l.board,
      preferred_branch: l.preferred_branch,
      preferred_batch: l.preferred_batch,
      budget_comfort: l.budget_comfort,
      interest_summary: l.interest_summary,
      score: l.score,
      badge: l.badge,
      score_reasons: l.score_reasons,
      next_action: l.next_action,
      needs_human: l.needs_human,
      handover_reason: l.handover_reason,
      demo_slot_requested: l.demo_days_ahead !== null && l.demo_time ? slotIso(l.demo_days_ahead, l.demo_time, now) : null,
      status: l.status,
      is_seed: true,
      created_at: iso(0),
      updated_at: iso(lastSec),
    };
    const events: SeedBundle["events"] = [
      { event_type: "score_changed", old_value: { score: 0 }, new_value: { score: l.score }, created_at: iso(lastSec) },
      { event_type: "badge_changed", old_value: { badge: "COLD" }, new_value: { badge: l.badge }, created_at: iso(lastSec) },
    ];
    if (l.needs_human) {
      events.push({ event_type: "handover", old_value: null, new_value: { reason: l.handover_reason }, created_at: iso(lastSec) });
    }
    return {
      session: {
        id: sid,
        visitor_id: `seed-visitor-${i + 1}`,
        ip_hash: null,
        user_agent: "seed",
        source: "seed" as const,
        mode: "live" as const,
        language_detected: l.lang,
        started_at: iso(0),
        last_active_at: iso(lastSec),
        created_at: iso(0),
      },
      messages: l.messages.map((m) => ({
        session_id: sid,
        role: m.role,
        content: m.content,
        tokens_in: m.tokensIn,
        tokens_out: m.tokensOut,
        model: m.role === "assistant" ? MODEL : null,
        created_at: iso(m.offsetSec),
      })),
      usage: l.messages
        .filter((m) => m.role === "assistant")
        .map((m) => ({
          session_id: sid,
          provider: "anthropic",
          model: MODEL,
          tokens_in: m.tokensIn,
          tokens_out: m.tokensOut,
          cost_inr: m.costInr,
          created_at: iso(m.offsetSec),
        })),
      lead,
      events,
      alert:
        l.badge === "HOT"
          ? {
              title: "New HOT lead",
              body: `🔥 New HOT lead: ${l.parent_name ?? "Parent"}, ${l.class_or_exam ?? "enquiry"}${l.demo_slot_label ? `, wants demo ${l.demo_slot_label}` : ""}`,
              created_at: iso(lastSec),
            }
          : null,
    };
  });
}
