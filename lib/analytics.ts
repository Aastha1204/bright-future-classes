import type { Badge } from "./scoring";

export interface AnalyticsInput {
  leads: {
    created_at: string;
    badge: Badge;
    score: number;
    phone_valid: boolean;
    demo_slot_requested: string | null;
    status: string;
    session_id: string;
  }[];
  usage: { session_id: string; cost_inr: number; created_at: string }[];
  userMessages: string[];
  now?: number;
}

export interface Analytics {
  totalLeads: number;
  perDay: { date: string; hot: number; warm: number; cold: number; total: number }[];
  split: Record<Badge, number>;
  topics: { topic: string; count: number }[];
  avgCostPerChat: number;
  totalCost: number;
  dailyCost: { date: string; cost: number }[];
  funnel: { chats: number; phone: number; demo: number };
}

const IST = 330 * 60000;
const dayKey = (ts: number) => new Date(ts + IST).toISOString().slice(0, 10);

const TOPICS: [string, RegExp][] = [
  ["Fees", /\bfees?\b|kitni|kitna|price|cost|charges?/i],
  ["Instalments & discounts", /instal|emi\b|kist|discount|sibling|early.?bird/i],
  ["Demo class", /demo|trial|free class/i],
  ["Batch timings", /timing|batch|schedule|\bkab\b|slot/i],
  ["Branches & location", /branch|where|location|address|kaha|kahan|andheri|dadar|thane|borivali/i],
  ["Results", /result|guarantee|rank|selection|topper/i],
  ["Study material & tests", /material|notes|\btests?\b|mock|doubt/i],
  ["Refund & policies", /refund|transport|parking|policy/i],
];

export function classifyTopics(text: string): string[] {
  return TOPICS.filter(([, re]) => re.test(text)).map(([t]) => t);
}

export function computeAnalytics(input: AnalyticsInput): Analytics {
  const now = input.now ?? Date.now();
  const days: string[] = [];
  for (let i = 13; i >= 0; i--) days.push(dayKey(now - i * 86400000));
  const perDayMap = new Map(days.map((d) => [d, { date: d, hot: 0, warm: 0, cold: 0, total: 0 }]));
  const split: Record<Badge, number> = { HOT: 0, WARM: 0, COLD: 0 };
  const start = new Date(`${days[0]}T00:00:00+05:30`).getTime(); // same window as the 14 day buckets
  const leads = input.leads.filter((l) => new Date(l.created_at).getTime() >= start);

  for (const l of leads) {
    split[l.badge]++;
    const row = perDayMap.get(dayKey(new Date(l.created_at).getTime()));
    if (!row) continue;
    row.total++;
    if (l.badge === "HOT") row.hot++;
    else if (l.badge === "WARM") row.warm++;
    else row.cold++;
  }

  const sessions = new Set(leads.map((l) => l.session_id));
  const costBySession = new Map<string, number>();
  const dailyCostMap = new Map(days.map((d) => [d, 0]));
  for (const u of input.usage) {
    if (!sessions.has(u.session_id)) continue;
    costBySession.set(u.session_id, (costBySession.get(u.session_id) ?? 0) + Number(u.cost_inr));
    const k = dayKey(new Date(u.created_at).getTime());
    if (dailyCostMap.has(k)) dailyCostMap.set(k, (dailyCostMap.get(k) ?? 0) + Number(u.cost_inr));
  }
  const totalCost = Array.from(costBySession.values()).reduce((a, b) => a + b, 0);

  const topicCount = new Map<string, number>();
  for (const m of input.userMessages) for (const t of classifyTopics(m)) topicCount.set(t, (topicCount.get(t) ?? 0) + 1);

  return {
    totalLeads: leads.length,
    perDay: days.map((d) => perDayMap.get(d)!),
    split,
    topics: Array.from(topicCount.entries())
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count),
    avgCostPerChat: costBySession.size ? totalCost / costBySession.size : 0,
    totalCost,
    dailyCost: days.map((d) => ({ date: d, cost: Math.round((dailyCostMap.get(d) ?? 0) * 10000) / 10000 })),
    funnel: {
      chats: leads.length,
      phone: leads.filter((l) => l.phone_valid).length,
      demo: leads.filter((l) => l.demo_slot_requested || l.status === "demo_booked" || l.status === "enrolled").length,
    },
  };
}
