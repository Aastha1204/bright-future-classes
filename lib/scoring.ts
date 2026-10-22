export type Badge = "HOT" | "WARM" | "COLD";

export interface ScoreSignals {
  phoneValid: boolean;
  classKnown: boolean;
  studentName: boolean;
  branchOrBatch: boolean;
  askedFees: boolean;
  demoInterest: boolean;
  urgency: boolean;
  budgetShared: boolean;
  offTopicOnly: boolean;
  notInterested: boolean;
}

export interface ScoreReason {
  text: string;
  points: number;
}

export interface ScoreResult {
  score: number;
  badge: Badge;
  reasons: ScoreReason[];
}

const RULES: { key: keyof ScoreSignals; points: number; text: string }[] = [
  { key: "phoneValid", points: 30, text: "Shared parent phone" },
  { key: "classKnown", points: 15, text: "Class/exam identified" },
  { key: "studentName", points: 5, text: "Student name given" },
  { key: "branchOrBatch", points: 10, text: "Branch or batch preference given" },
  { key: "askedFees", points: 10, text: "Asked about fees" },
  { key: "demoInterest", points: 20, text: "Asked for / accepted demo class" },
  { key: "urgency", points: 10, text: "Wants to visit / urgency this week" },
  { key: "budgetShared", points: 5, text: "Budget comfort shared" },
  { key: "offTopicOnly", points: -20, text: "Off-topic only" },
  { key: "notInterested", points: -30, text: "Explicitly not interested" },
];

/** Indian mobile: optional +91/91 prefix, then 10 digits starting 6-9. */
export function isValidIndianPhone(raw: string | null | undefined): boolean {
  if (!raw) return false;
  const s = raw.replace(/[\s\-()]/g, "");
  return /^(?:\+?91)?[6-9]\d{9}$/.test(s);
}

export function badgeFor(score: number): Badge {
  return score >= 70 ? "HOT" : score >= 40 ? "WARM" : "COLD";
}

/** Deterministic scoring: the LLM never decides the final score. */
export function computeScore(signals: ScoreSignals): ScoreResult {
  const reasons: ScoreReason[] = [];
  let total = 0;
  for (const r of RULES) {
    if (!signals[r.key]) continue;
    total += r.points;
    reasons.push({ text: `${r.text} (${r.points > 0 ? "+" : ""}${r.points})`, points: r.points });
  }
  const score = Math.max(0, Math.min(100, total));
  return { score, badge: badgeFor(score), reasons };
}

export interface NextActionContext {
  slot?: string | null;
  branch?: string | null;
}

export function nextActionFor(badge: Badge, ctx: NextActionContext = {}): string {
  if (badge === "HOT") {
    const where = ctx.branch ? ` at ${ctx.branch}` : "";
    return ctx.slot
      ? `Call within 15 min, confirm ${ctx.slot} demo${where}.`
      : `Call within 15 min and offer a demo class slot${where}.`;
  }
  if (badge === "WARM") return "Send fee PDF on WhatsApp, follow up tomorrow.";
  return "No action. Added to nurture list.";
}
