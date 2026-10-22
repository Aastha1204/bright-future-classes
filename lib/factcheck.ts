import type { Client } from "@/config/schema";

/**
 * Enforces "never invent facts": every ₹ amount, percentage and clock time in a reply
 * must also appear in client.json. Anything else => the reply is replaced.
 */

const AMOUNT_RE = /(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d+)?)|([\d,]+(?:\.\d+)?)\s*(?:rupees|rs\b|\/-)/gi;
const PCT_RE = /(\d+(?:\.\d+)?)\s*(?:%|percent\b|per cent\b)/gi;
// "5 pm", "5:30 pm", "7–9 am" (both ends take the suffix), "10 am–1 pm"
const TIME_RE = /(\d{1,2})(?::(\d{2}))?\s*(?:[–\-]\s*(\d{1,2})(?::(\d{2}))?)?\s*(am|pm)\b/gi;

const num = (s: string) => Number(s.replace(/,/g, ""));

export function extractAmounts(text: string): number[] {
  const out: number[] = [];
  for (const m of text.matchAll(AMOUNT_RE)) out.push(num(m[1] ?? m[2]));
  return out;
}

export function extractPercents(text: string): number[] {
  return [...text.matchAll(PCT_RE)].map((m) => Number(m[1]));
}

export function extractTimes(text: string): string[] {
  const out: string[] = [];
  const fmt = (h: string, mi: string | undefined, ap: string) =>
    `${Number(h)}${mi && mi !== "00" ? `:${mi}` : ""} ${ap.toLowerCase()}`;
  for (const m of text.matchAll(TIME_RE)) {
    out.push(fmt(m[1], m[2], m[5]));
    if (m[3]) out.push(fmt(m[3], m[4], m[5]));
  }
  return out;
}

function allStrings(v: unknown, acc: string[] = []): string[] {
  if (typeof v === "string") acc.push(v);
  else if (Array.isArray(v)) v.forEach((x) => allStrings(x, acc));
  else if (v && typeof v === "object") Object.values(v).forEach((x) => allStrings(x, acc));
  return acc;
}

export interface Allowed {
  amounts: Set<number>;
  percents: Set<number>;
  times: Set<string>;
}

export function buildAllowed(client: Client): Allowed {
  const strings = allStrings(client);
  const amounts = new Set<number>(client.courses.map((c) => c.annual_fee));
  const percents = new Set<number>();
  const times = new Set<string>();
  for (const c of client.courses) {
    percents.add(c.sibling_discount_pct);
    percents.add(c.early_bird_discount_pct);
  }
  for (const s of strings) {
    extractAmounts(s).forEach((a) => amounts.add(a));
    extractPercents(s).forEach((p) => percents.add(p));
    extractTimes(s).forEach((t) => times.add(t));
  }
  for (const r of client.demo_class.slot_rules) {
    const [h, m] = r.time.split(":").map(Number);
    times.add(`${h % 12 === 0 ? 12 : h % 12}${m ? `:${String(m).padStart(2, "0")}` : ""} ${h >= 12 ? "pm" : "am"}`);
  }
  return { amounts, percents, times };
}

export interface FactCheckResult {
  ok: boolean;
  violations: string[];
}

export function factCheck(reply: string, client: Client, allowed: Allowed = buildAllowed(client)): FactCheckResult {
  const violations: string[] = [];
  for (const a of extractAmounts(reply)) if (!allowed.amounts.has(a)) violations.push(`amount ₹${a}`);
  for (const p of extractPercents(reply)) if (!allowed.percents.has(p)) violations.push(`percentage ${p}%`);
  for (const t of extractTimes(reply)) if (!allowed.times.has(t)) violations.push(`time ${t}`);
  return { ok: violations.length === 0, violations };
}
