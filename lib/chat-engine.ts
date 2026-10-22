import { randomUUID } from "node:crypto";
import { getClient, getDemoSlots, slotLabel } from "./client";
import { ChatResponseSchema, type ChatResponse, type Intent } from "./chat-schema";
import { buildAllowed, factCheck } from "./factcheck";
import { detectGuardrails, INJECTION_REPLY, MAX_TURNS, sanitizeInput } from "./guardrails";
import { callLlm, extractJson, getModel, getProvider, llmConfigured, type LlmMessage } from "./llm";
import { offlineReply } from "./offline-bot";
import { costInr } from "./pricing";
import { buildSystemPrompt } from "./prompt";
import { computeScore, isValidIndianPhone, nextActionFor, type Badge, type ScoreSignals } from "./scoring";
import * as store from "./store";
import {
  LEAD_FIELDS,
  type AlertRow,
  type ChatSource,
  type LeadEventRow,
  type LeadField,
  type LeadRow,
  type MessageRow,
  type UsageRow,
} from "./types";

export interface ChatInput {
  sessionId?: string;
  message: string;
  source: ChatSource;
  /** Pre-computed turn from config/scripts.json: skips the LLM, runs everything else identically. */
  scripted?: { userText: string; response: unknown };
  visitorId: string;
  ipHash: string;
  userAgent: string | null;
}

export interface ChatOutput {
  sessionId: string;
  reply: string;
  quick_replies: string[];
  language: "en" | "hinglish";
  mode: "live" | "offline";
  needs_human: boolean;
  lead: LeadRow;
  changed: string[];
  cost_chat_inr: number;
  alert: AlertRow | null;
  capped?: boolean;
}

const SAFE_FALLBACK = "Ek second, main counsellor se confirm karke batati hoon.";

function blankLead(sessionId: string): LeadRow {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    session_id: sessionId,
    student_name: null,
    parent_name: null,
    parent_phone: null,
    phone_valid: false,
    class_or_exam: null,
    board: null,
    preferred_branch: null,
    preferred_batch: null,
    budget_comfort: null,
    interest_summary: null,
    score: 0,
    badge: "COLD",
    score_reasons: [],
    next_action: nextActionFor("COLD"),
    needs_human: false,
    handover_reason: null,
    demo_slot_requested: null,
    status: "new",
    is_seed: false,
    created_at: now,
    updated_at: now,
  };
}

function normalizePhone(p: string): string {
  return p.replace(/[\s\-()]/g, "").replace(/^\+?91(?=\d{10}$)/, "");
}

async function askModel(system: string, history: MessageRow[], userText: string) {
  const msgs: LlmMessage[] = history
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
  while (msgs.length && msgs[0].role !== "user") msgs.shift();
  msgs.push({ role: "user", content: userText });

  let tin = 0;
  let tout = 0;
  let model = getModel();
  for (let attempt = 0; attempt < 2; attempt++) {
    const convo = attempt === 0 ? msgs : [...msgs.slice(0, -1), { role: "user" as const, content: `${userText}\n\n(Return valid JSON only, in the required shape.)` }];
    const r = await callLlm(system, convo);
    tin += r.tokensIn;
    tout += r.tokensOut;
    model = r.model;
    try {
      const parsed = ChatResponseSchema.parse(extractJson(r.text));
      return { resp: parsed, tin, tout, model };
    } catch {
      /* retry once, then fall through */
    }
  }
  return { resp: null, tin, tout, model };
}

export async function handleChat(input: ChatInput): Promise<ChatOutput> {
  const client = getClient();
  const started = Date.now();
  const text = sanitizeInput(input.scripted ? input.scripted.userText : input.message);

  // --- session ---------------------------------------------------------------
  let session = input.sessionId ? await store.getSession(input.sessionId) : null;
  if (session && session.visitor_id !== input.visitorId) session = null;
  const live = llmConfigured();
  if (!session) {
    session = await store.createSession({
      visitor_id: input.visitorId,
      ip_hash: input.ipHash,
      source: input.source,
      mode: live && !input.scripted ? "live" : "scripted",
      language_detected: null,
    });
  }
  const sessionId = session.id;
  const existingLead = await store.getLead(sessionId);
  const lead0 = existingLead ?? blankLead(sessionId);

  // --- turn cap --------------------------------------------------------------
  if ((await store.userMessageCount(sessionId)) >= MAX_TURNS) {
    return {
      sessionId,
      reply: "We've reached the limit for this demo chat. Please book a free demo class and our counsellor will take it from here!",
      quick_replies: ["Book demo class"],
      language: "en",
      mode: live ? "live" : "offline",
      needs_human: lead0.needs_human,
      lead: lead0,
      changed: [],
      cost_chat_inr: await store.sessionCostInr(sessionId),
      alert: null,
      capped: true,
    };
  }

  // --- guardrails ------------------------------------------------------------
  const flags = input.scripted ? [] : detectGuardrails(text);
  for (const f of flags) await store.logGuardrail(sessionId, f, text);
  const injected = flags.includes("prompt_injection");

  const history = await store.getMessages(sessionId, 12);

  // --- produce a validated response -----------------------------------------
  let resp: ChatResponse;
  let usage: UsageRow | null = null;
  let mode: "live" | "offline" = "offline";
  let model: string | null = null;
  let tokensIn = 0;
  let tokensOut = 0;

  if (input.scripted) {
    resp = ChatResponseSchema.parse(input.scripted.response);
  } else if (injected) {
    resp = ChatResponseSchema.parse({
      reply: INJECTION_REPLY,
      language: "en",
      intents: ["off_topic"],
      quick_replies: ["Fees?", "Demo class", "Timings?"],
    });
  } else if (live) {
    try {
      const r = await askModel(buildSystemPrompt(lead0), history, text);
      tokensIn = r.tin;
      tokensOut = r.tout;
      model = r.model;
      mode = "live";
      resp =
        r.resp ??
        ChatResponseSchema.parse({ reply: SAFE_FALLBACK, language: "hinglish", needs_human: true, handover_reason: "Model returned invalid output" });
      usage = { provider: getProvider(), model: r.model, tokens_in: r.tin, tokens_out: r.tout, cost_inr: costInr(r.model, r.tin, r.tout) };
    } catch (e) {
      console.warn("[chat] LLM failed, using offline bot:", (e as Error).message);
      resp = offlineReply(text, { lead: existingLead, history });
    }
  } else {
    resp = offlineReply(text, { lead: existingLead, history });
  }

  // --- fact check ------------------------------------------------------------
  const fc = factCheck(resp.reply, client, buildAllowed(client));
  if (!fc.ok) {
    await store.logGuardrail(sessionId, "invented_fact", `${fc.violations.join(", ")} | reply: ${resp.reply}`);
    resp = {
      ...resp,
      reply: client.handover.unknown_reply,
      needs_human: true,
      handover_reason: `Reply contained unverified facts (${fc.violations.join(", ")})`,
    };
  }

  // --- merge extracted fields (never overwrite a filled value with null) ------
  const userTexts = [...history.filter((m) => m.role === "user").map((m) => m.content), text].join(" \n ").toLowerCase();
  const userDigits = userTexts.replace(/\D/g, "");
  const lead: LeadRow = { ...lead0 };
  const changed: string[] = [];
  const events: LeadEventRow[] = [];

  if (!injected) {
    for (const f of LEAD_FIELDS as readonly LeadField[]) {
      let v = resp.extracted_fields[f] ?? null;
      if (!v) continue;
      if (f === "parent_phone") {
        v = normalizePhone(v);
        if (!userDigits.includes(v.replace(/\D/g, ""))) continue; // must literally come from the user
      }
      if ((f === "student_name" || f === "parent_name") && !userTexts.includes(v.toLowerCase())) continue;
      if (lead[f] !== v) {
        events.push({ event_type: "field_extracted", old_value: { field: f, value: lead[f] }, new_value: { field: f, value: v } });
        lead[f] = v;
        changed.push(f);
      }
    }
  }
  lead.phone_valid = isValidIndianPhone(lead.parent_phone);

  // --- demo slot pick ---------------------------------------------------------
  const intentsNow = new Set<Intent>(resp.intents);
  const dayMatch = text.match(/\b(tue(?:s|sday)?|thu(?:r|rs|rsday)?|sat(?:urday)?|sun(?:day)?)\b/i);
  const slotsOffered = history.some((m) => m.role === "assistant" && /demo/i.test(m.content));
  if (dayMatch && (slotsOffered || intentsNow.has("asks_demo_class"))) {
    const abbr = dayMatch[1].slice(0, 3).toLowerCase();
    const slot = getDemoSlots().find((s) => s.label.toLowerCase().startsWith(abbr));
    if (slot && lead.demo_slot_requested !== slot.iso) {
      lead.demo_slot_requested = slot.iso;
      changed.push("demo_slot_requested");
      intentsNow.add("asks_demo_class");
    }
  }

  // --- deterministic scoring ---------------------------------------------------
  const seen = new Set<Intent>(intentsNow);
  for (const m of history) {
    const it = (m.raw_json as { intents?: Intent[] } | null)?.intents;
    if (m.role === "assistant" && Array.isArray(it)) it.forEach((i) => seen.add(i));
  }
  const resultAsks = history.filter((m) => m.role === "assistant" && (m.raw_json as { intents?: string[] } | null)?.intents?.includes("asks_results")).length + (intentsNow.has("asks_results") ? 1 : 0);
  const urgent = /this week|is hafte|\btoday\b|\btomorrow\b|\baaj\b|\bkal\b/i.test(userTexts);

  const signals: ScoreSignals = {
    phoneValid: lead.phone_valid,
    classKnown: !!lead.class_or_exam,
    studentName: !!lead.student_name,
    branchOrBatch: !!(lead.preferred_branch || lead.preferred_batch),
    askedFees: seen.has("asks_fees"),
    demoInterest: seen.has("asks_demo_class") || !!lead.demo_slot_requested,
    urgency: seen.has("asks_visit") || (urgent && seen.has("asks_demo_class")),
    budgetShared: !!lead.budget_comfort,
    offTopicOnly: seen.has("off_topic") && !lead.class_or_exam && !seen.has("asks_fees") && !seen.has("asks_demo_class") && !lead.phone_valid,
    notInterested: seen.has("not_interested"),
  };
  const result = computeScore(signals);
  const slotText = lead.demo_slot_requested ? slotLabel(lead.demo_slot_requested) : null;

  const needsHuman = lead.needs_human || resp.needs_human || resultAsks >= 2 || intentsNow.has("upset") || intentsNow.has("callback_request");
  const handoverReason =
    lead.handover_reason ??
    (needsHuman
      ? resp.handover_reason ??
        (intentsNow.has("upset") ? "User is upset or frustrated" : intentsNow.has("callback_request") ? "Requested a callback" : resultAsks >= 2 ? "Asked about results guarantee more than once" : "Needs counsellor follow-up")
      : null);

  const prevScore = lead.score;
  const prevBadge: Badge = lead.badge;
  lead.score = result.score;
  lead.badge = result.badge;
  lead.score_reasons = result.reasons.map((r) => r.text);
  lead.next_action = nextActionFor(result.badge, { slot: slotText, branch: lead.preferred_branch });
  lead.needs_human = needsHuman;
  lead.handover_reason = handoverReason;
  lead.interest_summary = lead.class_or_exam
    ? `${lead.class_or_exam}${lead.board ? ` (${lead.board})` : ""} — ${lead.preferred_branch ?? "branch undecided"}`
    : lead.interest_summary;
  lead.updated_at = new Date().toISOString();

  if (lead.score !== prevScore) events.push({ event_type: "score_changed", old_value: { score: prevScore }, new_value: { score: lead.score } });
  if (lead.badge !== prevBadge) events.push({ event_type: "badge_changed", old_value: { badge: prevBadge }, new_value: { badge: lead.badge } });
  if (needsHuman && !lead0.needs_human) events.push({ event_type: "handover", old_value: null, new_value: { reason: handoverReason } });
  for (const k of ["score", "badge", "needs_human", "next_action"] as const) if (lead[k] !== lead0[k]) changed.push(k);

  let alert: AlertRow | null = null;
  if (lead.badge === "HOT" && prevBadge !== "HOT") {
    const who = lead.student_name ? `${lead.student_name.split(" ")[0]}'s parent` : (lead.parent_name ?? "Parent");
    alert = {
      title: "New HOT lead",
      body: `🔥 New HOT lead: ${who}, ${lead.class_or_exam ?? "enquiry"}${slotText ? `, wants demo ${slotText}` : ""}`,
    };
    events.push({ event_type: "alert_fired", old_value: null, new_value: { body: alert.body } });
  }

  // --- persist ----------------------------------------------------------------
  const latency = Date.now() - started;
  await store.saveTurn({
    sessionId,
    language: resp.language,
    userMessage: { session_id: sessionId, role: "user", content: text },
    assistantMessage: {
      session_id: sessionId,
      role: "assistant",
      content: resp.reply,
      raw_json: { ...resp, score: lead.score, score_reasons: lead.score_reasons, intents: [...intentsNow] },
      tokens_in: tokensIn,
      tokens_out: tokensOut,
      latency_ms: latency,
      model,
    },
    lead,
    events,
    usage,
    alert,
  });

  return {
    sessionId,
    reply: resp.reply,
    quick_replies: resp.quick_replies,
    language: resp.language,
    mode,
    needs_human: lead.needs_human,
    lead,
    changed,
    cost_chat_inr: await store.sessionCostInr(sessionId),
    alert,
  };
}
