import clientRaw from "../config/client.json";
import { computeScore, isValidIndianPhone, nextActionFor, type Badge, type ScoreSignals } from "./scoring";
import { costInr } from "./pricing";

/**
 * Deterministic seed data (40 fictional leads, last 14 days).
 * Used by scripts/seed.ts (-> supabase/seed.sql) and by the in-memory fallback store.
 */

export interface SeedMessage {
  role: "user" | "assistant";
  content: string;
  offsetSec: number;
  tokensIn: number;
  tokensOut: number;
  costInr: number;
}

export interface SeedLead {
  id: string;
  sessionId: string;
  minutesAgo: number;
  lang: "en" | "hinglish";
  student_name: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  phone_valid: boolean;
  class_or_exam: string | null;
  board: string | null;
  preferred_branch: string | null;
  preferred_batch: string | null;
  budget_comfort: string | null;
  interest_summary: string;
  score: number;
  badge: Badge;
  score_reasons: string[];
  next_action: string;
  needs_human: boolean;
  handover_reason: string | null;
  demo_slot_label: string | null;
  demo_days_ahead: number | null;
  demo_time: string | null;
  status: "new" | "contacted" | "demo_booked" | "enrolled" | "lost";
  messages: SeedMessage[];
}

const MODEL = "claude-haiku-5-5";

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST = ["Aarav", "Diya", "Rohan", "Ananya", "Kabir", "Isha", "Vihaan", "Meera", "Arjun", "Saanvi", "Aditya", "Riya", "Krish", "Tara", "Yash", "Nisha", "Dev", "Pooja", "Om", "Kiara", "Rahul", "Sneha", "Ishaan", "Myra", "Neel", "Zoya", "Atharv", "Prisha"];
const SURNAME = ["Patil", "Shah", "Iyer", "Khan", "Desai", "Naik", "Gupta", "Pawar", "Mishra", "D'Souza", "Kulkarni", "Sharma", "Menon", "Jadhav", "Verma", "Fernandes", "Sawant", "Chauhan"];
const PARENT_FIRST = ["Sunita", "Rajesh", "Meena", "Anil", "Kavita", "Sanjay", "Neha", "Prakash", "Farah", "Vikram", "Lata", "Deepak", "Shweta", "Ramesh", "Anita", "Imran"];

const LOCALITIES: { name: string; branch: string }[] = [
  { name: "Andheri", branch: "Andheri West" },
  { name: "Dadar", branch: "Dadar West" },
  { name: "Thane", branch: "Thane West" },
  { name: "Borivali", branch: "Borivali West" },
  { name: "Malad", branch: "Andheri West" },
  { name: "Goregaon", branch: "Andheri West" },
  { name: "Kandivali", branch: "Borivali West" },
  { name: "Ghatkopar", branch: "Thane West" },
  { name: "Mulund", branch: "Thane West" },
  { name: "Vashi", branch: "Thane West" },
  { name: "Powai", branch: "Andheri West" },
  { name: "Bandra", branch: "Dadar West" },
];

const COURSE_BY_LABEL: Record<string, string> = {
  "Class 8": "class8",
  "Class 9": "class9",
  "Class 10": "class10",
  "JEE Foundation": "jee_foundation",
  "NEET Foundation": "neet_foundation",
};
const CLASSES = Object.keys(COURSE_BY_LABEL);
const BOARDS = ["SSC", "CBSE", "ICSE"];
const BATCHES = ["Morning", "Afternoon", "Evening", "Weekend"];
const SLOTS = [
  { label: "Tue 5 pm", time: "17:00", dow: 2 },
  { label: "Thu 5 pm", time: "17:00", dow: 4 },
  { label: "Sat 5 pm", time: "17:00", dow: 6 },
  { label: "Sun 11 am", time: "11:00", dow: 0 },
];

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

function hex(rng: () => number, n: number) {
  let s = "";
  for (let i = 0; i < n; i++) s += Math.floor(rng() * 16).toString(16);
  return s;
}
const uuid = (rng: () => number) => `${hex(rng, 8)}-${hex(rng, 4)}-4${hex(rng, 3)}-a${hex(rng, 3)}-${hex(rng, 12)}`;

function weighted<T>(rng: () => number, items: [T, number][]): T {
  const total = items.reduce((s, [, w]) => s + w, 0);
  let r = rng() * total;
  for (const [v, w] of items) {
    r -= w;
    if (r <= 0) return v;
  }
  return items[items.length - 1][0];
}

type Archetype = "HOT" | "WARM" | "COLD";

function pickSignals(rng: () => number, kind: Archetype): ScoreSignals {
  const chance = (p: number) => rng() < p;
  for (let tries = 0; tries < 200; tries++) {
    const s: ScoreSignals = {
      phoneValid: false,
      classKnown: true,
      studentName: false,
      branchOrBatch: false,
      askedFees: false,
      demoInterest: false,
      urgency: false,
      budgetShared: false,
      offTopicOnly: false,
      notInterested: false,
    };
    if (kind === "HOT") {
      s.phoneValid = true;
      s.studentName = true;
      s.branchOrBatch = true;
      s.askedFees = true;
      s.demoInterest = true;
      s.urgency = chance(0.6);
      s.budgetShared = chance(0.3);
    } else if (kind === "WARM") {
      s.studentName = chance(0.65);
      s.branchOrBatch = chance(0.85);
      s.askedFees = chance(0.8);
      s.budgetShared = chance(0.35);
      s.urgency = chance(0.2);
    } else {
      s.classKnown = chance(0.6);
      s.askedFees = chance(0.5);
      s.offTopicOnly = chance(0.5);
      s.notInterested = chance(0.2);
    }
    const { badge } = computeScore(s);
    if (badge === kind) return s;
  }
  throw new Error(`could not build signals for ${kind}`);
}

function buildLead(rng: () => number, kind: Archetype, idx: number): SeedLead {
  const signals = pickSignals(rng, kind);
  const lang: "en" | "hinglish" = rng() < 0.5 ? "en" : "hinglish";
  const hi = lang === "hinglish";
  const cls = CLASSES[Math.floor(rng() * CLASSES.length)];
  const course = clientRaw.courses.find((c) => c.id === COURSE_BY_LABEL[cls])!;
  const board = cls.startsWith("Class") ? BOARDS[Math.floor(rng() * BOARDS.length)] : null;
  const loc = LOCALITIES[Math.floor(rng() * LOCALITIES.length)];
  const batch = BATCHES[Math.floor(rng() * BATCHES.length)];
  const surname = SURNAME[Math.floor(rng() * SURNAME.length)];
  const student = FIRST[Math.floor(rng() * FIRST.length)];
  const parent = `${PARENT_FIRST[Math.floor(rng() * PARENT_FIRST.length)]} ${surname}`;
  const slot = SLOTS[Math.floor(rng() * SLOTS.length)];
  const daysAhead = 1 + Math.floor(rng() * 6);
  const phone = `98${Math.floor(rng() * 900 + 100)}0${String(Math.floor(rng() * 9000 + 1000))}`;

  const turns: { u: string; a: string }[] = [];
  const clsText = signals.classKnown ? `${cls}${board ? ` ${board}` : ""}` : null;

  turns.push(
    signals.classKnown
      ? {
          u: hi ? `Hello, mere bête ke liye ${clsText} ki classes chahiye. Details bataiye.` : `Hi, I'm looking for ${clsText} classes. Can you share details?`,
          a: hi
            ? `Namaste! ${course.name} mein ${course.subjects.join(", ")} cover hota hai, ${course.weekly_hours} ghante/week. Kaunsa branch aapke paas hai?`
            : `Hello! ${course.name} covers ${course.subjects.join(", ")} with ${course.weekly_hours} hours a week. Which area do you live in?`,
        }
      : {
          u: hi ? "Aap kaunse courses chalate ho?" : "What courses do you offer?",
          a: hi
            ? "Hum Class 8–10 (SSC/CBSE/ICSE) aur JEE/NEET Foundation chalate hain. Student kaun si class mein hai?"
            : "We offer Class 8–10 (SSC/CBSE/ICSE) plus JEE and NEET Foundation. Which class is the student in?",
        },
  );

  if (signals.askedFees) {
    turns.push({
      u: hi ? "Fees kitni hai? Installment hota hai?" : "What are the fees? Is there an instalment option?",
      a: hi
        ? `${course.name} ki fees ${inr(course.annual_fee)}/saal hai. ${course.installments} instalments mein de sakte hain.`
        : `${course.name} is ${inr(course.annual_fee)} per year, payable in ${course.installments} instalments.`,
    });
  }

  if (signals.branchOrBatch) {
    turns.push({
      u: hi ? `Hum ${loc.name} mein rehte hain. ${batch} batch milega?` : `We live in ${loc.name}. Is there a ${batch} batch?`,
      a: hi
        ? `Aapke liye ${loc.branch} sabse paas rahega. ${batch} batch available hai, seats limited hain.`
        : `${loc.branch} is closest for you. The ${batch} batch is available, with limited seats.`,
    });
  }

  if (signals.budgetShared) {
    turns.push({
      u: hi ? "Budget thoda tight hai, installment ya discount mil sakta hai?" : "Our budget is a bit tight. Any discount?",
      a: hi
        ? `${course.early_bird_before} se pehle join karne par ${course.early_bird_discount_pct}% early-bird discount hai, aur sibling par ${course.sibling_discount_pct}%.`
        : `Joining before ${course.early_bird_before} gets ${course.early_bird_discount_pct}% early-bird off, plus ${course.sibling_discount_pct}% for siblings.`,
    });
  }

  if (signals.demoInterest) {
    turns.push({
      u: hi ? "Demo class kab hai? Is hafte aa sakte hain." : "Is there a demo class? We can come this week.",
      a: hi
        ? "Free 60-minute demo class hai. Slots: Tue/Thu/Sat 5 pm aur Sun 11 am. Kaunsa theek rahega?"
        : "We have a free 60-minute demo class. Slots: Tue/Thu/Sat 5 pm and Sun 11 am. Which suits you?",
    });
  }

  if (signals.phoneValid) {
    turns.push({
      u: hi ? `${slot.label} theek hai. Mera number ${phone}, naam ${parent}.` : `${slot.label} works. My number is ${phone}, I'm ${parent}.`,
      a: hi
        ? `Dhanyavaad ${parent.split(" ")[0]}! ${slot.label} ka demo ${loc.branch} mein note kar liya. Counsellor aapko call karenge.`
        : `Thanks ${parent.split(" ")[0]}! Your ${slot.label} demo at ${loc.branch} is noted. Our counsellor will call you shortly.`,
    });
  }

  if (signals.offTopicOnly) {
    turns.push({
      u: hi ? "Aur ek doosre school ki fees bhi bata do." : "Can you also tell me another school's fees?",
      a: clientRaw.scope.refusal,
    });
  }

  if (signals.notInterested) {
    turns.push({
      u: hi ? "Abhi interested nahi hain, thanks." : "Not interested right now, thanks.",
      a: hi ? "Koi baat nahi! Jab bhi zaroorat ho, hum yahin hain." : "No problem! We're here whenever you need us.",
    });
  } else if (turns.length < 4) {
    turns.push({
      u: hi ? "Theek hai, sochkar batate hain." : "Okay, I'll think about it.",
      a: hi ? "Zaroor! Koi sawaal ho toh poochiye." : "Sure! Ask me anything else anytime.",
    });
  }

  const messages: SeedMessage[] = [];
  let off = 0;
  for (const t of turns) {
    messages.push({ role: "user", content: t.u, offsetSec: off, tokensIn: 0, tokensOut: 0, costInr: 0 });
    off += 20 + Math.floor(rng() * 30);
    const tin = 650 + Math.floor(rng() * 300);
    const tout = 55 + Math.floor(rng() * 70);
    messages.push({ role: "assistant", content: t.a, offsetSec: off, tokensIn: tin, tokensOut: tout, costInr: costInr(MODEL, tin, tout) });
    off += 15 + Math.floor(rng() * 30);
  }

  const result = computeScore(signals);
  const status = weighted<SeedLead["status"]>(
    rng,
    kind === "HOT"
      ? [["new", 30], ["contacted", 30], ["demo_booked", 25], ["enrolled", 15]]
      : kind === "WARM"
        ? [["new", 50], ["contacted", 35], ["lost", 15]]
        : [["new", 40], ["lost", 40], ["contacted", 20]],
  );

  const needsHuman = kind === "WARM" ? rng() < 0.12 : kind === "HOT" ? rng() < 0.1 : false;
  const branch = signals.branchOrBatch ? loc.branch : null;

  return {
    id: uuid(rng),
    sessionId: uuid(rng),
    minutesAgo: idx < 4 ? 5 + Math.floor(rng() * 600) : Math.floor(rng() * (14 * 24 * 60 - 120)) + 30,
    lang,
    student_name: signals.studentName ? `${student} ${surname}` : null,
    parent_name: signals.phoneValid ? parent : null,
    parent_phone: signals.phoneValid ? phone : null,
    phone_valid: signals.phoneValid && isValidIndianPhone(phone),
    class_or_exam: signals.classKnown ? cls : null,
    board: signals.classKnown ? board : null,
    preferred_branch: branch,
    preferred_batch: signals.branchOrBatch ? batch : null,
    budget_comfort: signals.budgetShared ? "Needs instalments / discount" : null,
    interest_summary: `${signals.classKnown ? cls : "Course enquiry"}${board ? ` (${board})` : ""} — ${branch ?? "branch undecided"}`,
    score: result.score,
    badge: result.badge,
    score_reasons: result.reasons.map((r) => r.text),
    next_action: nextActionFor(result.badge, { slot: signals.demoInterest ? slot.label : null, branch }),
    needs_human: needsHuman,
    handover_reason: needsHuman ? "Asked about scholarship amount — not in knowledge base" : null,
    demo_slot_label: signals.phoneValid && signals.demoInterest ? slot.label : null,
    demo_days_ahead: signals.phoneValid && signals.demoInterest ? daysAhead : null,
    demo_time: signals.phoneValid && signals.demoInterest ? slot.time : null,
    status,
    messages,
  };
}

/** 12 HOT / 18 WARM / 10 COLD = 30% / 45% / 25%. */
export function generateSeedLeads(): SeedLead[] {
  const rng = mulberry32(2025);
  const kinds: Archetype[] = [
    ...Array<Archetype>(12).fill("HOT"),
    ...Array<Archetype>(18).fill("WARM"),
    ...Array<Archetype>(10).fill("COLD"),
  ];
  for (let i = kinds.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [kinds[i], kinds[j]] = [kinds[j], kinds[i]];
  }
  return kinds.map((k, i) => buildLead(rng, k, i));
}
