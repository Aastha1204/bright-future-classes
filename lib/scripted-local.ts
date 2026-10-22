import { getDemoSlots } from "./client";
import { slotLabel } from "./slot";
import { computeScore, isValidIndianPhone, nextActionFor, type Badge } from "./scoring";
import { getScript, type ScriptId } from "./scripted";
import type { LeadRow } from "./types";

/**
 * Browser-side replay of a scripted demo, used only if /api/scripted can't be reached
 * (server down, offline). Mirrors the server pipeline using the same pure scoring code.
 */

const FIELDS = ["student_name", "parent_name", "parent_phone", "class_or_exam", "board", "preferred_branch", "preferred_batch", "budget_comfort"] as const;

export interface LocalAlert {
  body: string;
}

export function localLeadAfter(id: ScriptId, step: number, prevBadge: Badge | null): { lead: LeadRow; alert: LocalAlert | null; reply: string } {
  const turns = getScript(id).turns.slice(0, step + 1);
  const fields: Record<string, string | null> = {};
  const intents = new Set<string>();
  let slot: string | null = null;
  const texts: string[] = [];
  for (const t of turns) {
    texts.push(t.user);
    const bot = t.bot as { extracted_fields?: Record<string, string | null>; intents?: string[] };
    for (const f of FIELDS) {
      const v = bot.extracted_fields?.[f];
      if (v) fields[f] = v;
    }
    bot.intents?.forEach((i) => intents.add(i));
    const day = t.user.match(/\b(tue|thu|sat|sun)\w*\b/i);
    if (day && intents.has("asks_demo_class")) slot = getDemoSlots().find((s) => s.label.toLowerCase().startsWith(day[1].toLowerCase()))?.iso ?? slot;
  }
  const phoneValid = isValidIndianPhone(fields.parent_phone);
  const result = computeScore({
    phoneValid,
    classKnown: !!fields.class_or_exam,
    studentName: !!fields.student_name,
    branchOrBatch: !!(fields.preferred_branch || fields.preferred_batch),
    askedFees: intents.has("asks_fees"),
    demoInterest: intents.has("asks_demo_class") || !!slot,
    urgency: intents.has("asks_visit"),
    budgetShared: !!fields.budget_comfort,
    offTopicOnly: intents.has("off_topic") && !fields.class_or_exam && !intents.has("asks_fees") && !intents.has("asks_demo_class") && !phoneValid,
    notInterested: intents.has("not_interested"),
  });
  const now = new Date().toISOString();
  const slotText = slot ? slotLabel(slot) : null;
  const lead: LeadRow = {
    id: `local-${id}`,
    session_id: `local-${id}`,
    student_name: fields.student_name ?? null,
    parent_name: fields.parent_name ?? null,
    parent_phone: fields.parent_phone ?? null,
    phone_valid: phoneValid,
    class_or_exam: fields.class_or_exam ?? null,
    board: fields.board ?? null,
    preferred_branch: fields.preferred_branch ?? null,
    preferred_batch: fields.preferred_batch ?? null,
    budget_comfort: fields.budget_comfort ?? null,
    interest_summary: null,
    score: result.score,
    badge: result.badge,
    score_reasons: result.reasons.map((r) => r.text),
    next_action: nextActionFor(result.badge, { slot: slotText, branch: fields.preferred_branch }),
    needs_human: false,
    handover_reason: null,
    demo_slot_requested: slot,
    status: "new",
    is_seed: false,
    created_at: now,
    updated_at: now,
  };
  const who = lead.student_name ? `${lead.student_name}'s parent` : "Parent";
  const alert = result.badge === "HOT" && prevBadge !== "HOT" ? { body: `🔥 New HOT lead: ${who}, ${lead.class_or_exam ?? "enquiry"}${slotText ? `, wants demo ${slotText}` : ""}` } : null;
  return { lead, alert, reply: String((turns[turns.length - 1].bot as { reply: string }).reply) };
}
