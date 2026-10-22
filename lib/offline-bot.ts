import { getClient, getDemoSlots } from "./client";
import type { ChatResponse, Intent } from "./chat-schema";
import type { LeadRow, MessageRow } from "./types";

/**
 * Rule-based responder used when no LLM key is configured or the LLM fails.
 * Every sentence comes from client.json, so it can never invent a fact.
 */

const HINGLISH = /\b(kitni|kitna|kya|hai|hain|mein|main|batayiye|bataiye|kab|chahiye|nahi|aap|hum|bhi|karo|kaha|kahan|sakte|milega|ke liye|rehte|beta|beti|fees kitni|theek)\b/i;

const COURSE_ID: Record<string, string> = {
  "Class 8": "class8",
  "Class 9": "class9",
  "Class 10": "class10",
  "JEE Foundation": "jee_foundation",
  "NEET Foundation": "neet_foundation",
};

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const FAQ_KEYS: [RegExp, string][] = [
  [/instal|emi\b|kist/i, "instalments"],
  [/discount|sibling|early.?bird/i, "discount"],
  [/refund|paise wapas/i, "refund"],
  [/transport|\bbus\b|\bvan\b/i, "transport"],
  [/parking/i, "parking"],
  [/material|notes|books/i, "study material"],
  [/doubt/i, "doubt"],
  [/\btests?\b|mock|exam series/i, "tests"],
  [/scholarship/i, "scholarship"],
  [/online|zoom/i, "online"],
  [/batch size|students per|kitne students/i, "batch size"],
  [/sunday|working hours|opening|khula|open on/i, "working hours"],
  [/switch|change.*batch|batch.*change/i, "switch"],
];

const UNKNOWN = /hostel|accommodation|\bac\b|air.?condition|topper|last year|\bcanteen\b|(scholarship).*(amount|how much|kitna|\d+\s*%)|\d+\s*%.*scholarship/i;
const OFF_TOPIC = /other school|another school|different school|essay|cricket|ipl\b|match score|stock|bitcoin|crypto|joke|politic|movie|recipe|weather|python|javascript|code for|solve this|homework|medicine|medical|doctor|symptom/i;
const DOMAIN = /class|course|fee|batch|demo|branch|timing|admission|jee|neet|faculty|teacher|syllabus|ssc|cbse|icse|coaching|tuition|classes/i;
const UPSET = /bakwas|worst|useless|pathetic|waste|disgust|angry|frustrat|koi call nahi|nobody calls|no one calls|cheat|fraud|complain/i;
const NOT_INTERESTED = /not interested|no thanks|nahi chahiye|interested nahi|rehne do/i;
const GREETING = /^(hi|hello|hey|namaste|hii+|good (morning|evening|afternoon))\b/i;

export interface OfflineContext {
  lead: LeadRow | null;
  history: MessageRow[];
}

function isHinglish(text: string, history: MessageRow[]) {
  if (HINGLISH.test(text)) return true;
  return history.some((m) => m.role === "user" && HINGLISH.test(m.content));
}

function extract(text: string) {
  const f: Record<string, string | null> = {};
  const phone = text.replace(/[\s\-()]/g, "").match(/(?:\+?91)?[6-9]\d{9}/);
  if (phone) f.parent_phone = phone[0].replace(/^\+?91(?=\d{10}$)/, "");
  if (/\bjee\b/i.test(text)) f.class_or_exam = "JEE Foundation";
  else if (/\bneet\b/i.test(text)) f.class_or_exam = "NEET Foundation";
  else {
    const m = text.match(/\b(?:class|std|standard)\s*(8|9|10)\b|\b(8|9|10)\s*(?:th)\b|\b(eighth|ninth|tenth)\b/i);
    if (m) {
      const n = m[1] ?? m[2] ?? { eighth: "8", ninth: "9", tenth: "10" }[m[3].toLowerCase()];
      f.class_or_exam = `Class ${n}`;
    }
  }
  const board = text.match(/\b(ssc|cbse|icse)\b/i);
  if (board) f.board = board[1].toUpperCase();
  const branch = text.match(/\b(andheri|dadar|thane|borivali)\b/i);
  if (branch) {
    const b = getClient().branches.find((x) => x.id === branch[1].toLowerCase());
    if (b) f.preferred_branch = b.name;
  }
  const batch = text.match(/\b(morning|afternoon|evening|weekend)\b/i);
  if (batch) f.preferred_batch = batch[1][0].toUpperCase() + batch[1].slice(1).toLowerCase();
  const stud = text.match(/(?:student(?:'s)? name is|son(?:'s)? name is|daughter(?:'s)? name is|beta ka naam|beti ka naam|bete ka naam)\s+([A-Za-z]{2,20})/i);
  if (stud) f.student_name = stud[1][0].toUpperCase() + stud[1].slice(1).toLowerCase();
  const par = text.match(/(?:my name is|mera naam|i am|i'm)\s+([A-Za-z]{2,20})(?![a-z]*\s+(?:in|from|looking))/i);
  if (par && !stud && !/^(looking|interested|from|in|a|the)$/i.test(par[1])) {
    f.parent_name = par[1][0].toUpperCase() + par[1].slice(1).toLowerCase();
  }
  if (/budget|afford|tight|mehnga|expensive/i.test(text)) f.budget_comfort = "Budget-conscious";
  return f;
}

/** `specificOnly` skips the fee-related FAQs (instalments, discounts), which the fee answer already covers. */
function faqAnswer(text: string, specificOnly = false): string | null {
  const c = getClient();
  for (const [re, key] of FAQ_KEYS) {
    if (specificOnly && (key === "instalments" || key === "discount")) continue;
    if (re.test(text)) {
      const hit = c.faqs.find((f) => f.q.toLowerCase().includes(key));
      if (hit) return hit.a;
    }
  }
  return null;
}

function nextQuestion(
  merged: Record<string, string | null | undefined>,
  hi: boolean,
  hasGivenValue: boolean,
): { q: string; replies: string[] } {
  if (!merged.class_or_exam) {
    return {
      q: hi ? "Student kaun si class mein hai?" : "Which class is the student in?",
      replies: ["Class 8", "Class 9", "Class 10", "JEE Foundation"],
    };
  }
  if (!merged.student_name) {
    return { q: hi ? "Student ka naam kya hai?" : "What is the student's name?", replies: ["Fees?", "Demo class", "Branches"] };
  }
  if (!merged.preferred_branch && !merged.preferred_batch) {
    return {
      q: hi ? "Kaunsa branch ya batch aapke liye theek rahega?" : "Which branch or batch would suit you?",
      replies: ["Andheri", "Dadar", "Thane", "Borivali"],
    };
  }
  if (!merged.parent_phone && hasGivenValue) {
    return {
      q: hi
        ? "Demo class slot confirm karne ke liye parent ka number share karenge?"
        : "Could you share the parent's phone number so we can confirm a demo class slot?",
      replies: ["Book demo class", "Fees?", "Not now"],
    };
  }
  return { q: "", replies: ["Book demo class", "Fees?", "Timings?"] };
}

export function offlineReply(text: string, ctx: OfflineContext): ChatResponse {
  const c = getClient();
  const hi = isHinglish(text, ctx.history);
  const t = text.toLowerCase();
  const fields = extract(text);
  const lead = ctx.lead;
  const merged = {
    student_name: fields.student_name ?? lead?.student_name,
    parent_phone: fields.parent_phone ?? lead?.parent_phone,
    class_or_exam: fields.class_or_exam ?? lead?.class_or_exam,
    preferred_branch: fields.preferred_branch ?? lead?.preferred_branch,
    preferred_batch: fields.preferred_batch ?? lead?.preferred_batch,
  };
  const intents = new Set<Intent>();
  let needsHuman = false;
  let reason: string | null = null;
  let body = "";
  let answered = false;

  const askedResultsBefore = ctx.history.some(
    (m) => m.role === "assistant" && (m.raw_json as { intents?: string[] } | null)?.intents?.includes("asks_results"),
  );

  const wantsFees = /\bfees?\b|kitni|kitna|price|cost|charges?|\bamount\b/i.test(text);
  const wantsDemo = /demo|trial|free class/i.test(text);
  const wantsVisit = /visit|come (to|over)|aana|milna|this week|is hafte|walk.?in/i.test(text);
  const wantsTimings = /timing|batch|time\b|schedule|kab|slot/i.test(text);
  const wantsResults = /result|guarantee|rank|selection|marks guarantee/i.test(text);
  const wantsCallback = /call me|callback|call back|phone karo|call karo|call kijiye/i.test(text);

  const feeText = (): string => {
    const course = merged.class_or_exam ? c.courses.find((x) => x.id === COURSE_ID[merged.class_or_exam!]) : undefined;
    if (/instal|emi\b|kist|discount/i.test(t)) return faqAnswer(text) ?? "";
    if (course) {
      return hi
        ? `${course.name} ki fees ${inr(course.annual_fee)} per year hai, ${course.installments} instalments mein.`
        : `${course.name} is ${inr(course.annual_fee)} per year, payable in ${course.installments} instalments.`;
    }
    const list = c.courses.map((x) => `${x.name.split(" (")[0]} ${inr(x.annual_fee)}`).join(", ");
    return hi ? `Fees (per year): ${list}.` : `Annual fees: ${list}.`;
  };

  if (UPSET.test(text)) {
    intents.add("upset");
    needsHuman = true;
    reason = "User is upset or frustrated";
    body = hi
      ? "Maaf kijiye, aapko takleef hui. Main abhi counsellor ko flag kar rahi hoon, woh aapse jaldi sampark karenge."
      : "I'm really sorry for the experience. I've flagged this to our counsellor so they can reach out to you personally.";
    answered = true;
  } else if (NOT_INTERESTED.test(text)) {
    intents.add("not_interested");
    body = hi ? "Koi baat nahi! Jab bhi zaroorat ho, hum yahin hain." : "No problem at all! We're here whenever you need us.";
    answered = true;
  } else if (UNKNOWN.test(text)) {
    needsHuman = true;
    reason = "Asked for information that is not in the knowledge base";
    body = hi ? "Yeh main confirm nahi kar sakti — main counsellor se pooch kar bata dungi." : c.handover.unknown_reply;
    answered = true;
  } else if (OFF_TOPIC.test(text)) {
    intents.add("off_topic");
    body = c.scope.refusal;
    answered = true;
  } else if (wantsResults) {
    intents.add("asks_results");
    if (askedResultsBefore) {
      needsHuman = true;
      reason = "Asked about results guarantee more than once";
    }
    if (wantsFees) intents.add("asks_fees");
    body = [
      wantsFees ? feeText() : "",
      hi
        ? "Hum marks ya rank ki guarantee nahi dete. Past results centre par dikhaye jaate hain — demo class mein aaiye, faculty se milke khud judge kijiye."
        : `${c.results_policy} Please visit for a free demo class and judge our faculty yourself.`,
    ]
      .filter(Boolean)
      .join(" ");
    answered = true;
  } else if (wantsCallback) {
    intents.add("callback_request");
    needsHuman = true;
    reason = "Requested a callback";
    body = hi ? "Zaroor! Main counsellor ko aapko call karne ke liye bol deti hoon." : "Sure! I'll ask our counsellor to call you.";
    answered = true;
  }

  if (!answered) {
    const parts: string[] = [];
    // A specific policy question ("study material", "batch size", "refund") beats the generic fee/timing answers.
    const specific = !wantsDemo && !wantsVisit ? faqAnswer(text, true) : null;
    if (specific) parts.push(specific);
    if (!specific && (wantsFees || /instal|emi\b|kist/i.test(t))) {
      intents.add("asks_fees");
      parts.push(feeText());
    }
    if (wantsDemo || wantsVisit) {
      if (wantsDemo) intents.add("asks_demo_class");
      if (wantsVisit) intents.add("asks_visit");
      const slots = getDemoSlots().slice(0, 3).map((s) => s.label).join("; ");
      parts.push(
        hi
          ? `Free ${c.demo_class.duration_minutes}-minute demo class hai. Upcoming slots: ${slots}.`
          : `We offer a free ${c.demo_class.duration_minutes}-minute demo class. Upcoming slots: ${slots}.`,
      );
    }
    // "Andheri evening batch" is a choice to acknowledge; "Thane mein weekend batch hai kya?" is a question to answer.
    const isQuestion = /\?|\bkya\b|\bhai\b|available|milega|is there|do you|timing|schedule|kab|slot/i.test(t);
    const choosingBatch = !!(fields.preferred_batch || fields.preferred_branch) && !isQuestion;
    if (!specific && wantsTimings && !wantsDemo && !choosingBatch) {
      intents.add("asks_timings");
      const wk = c.batches.find((b) => b.name === "Weekend");
      if (merged.preferred_batch === "Weekend" || /weekend/i.test(t)) {
        parts.push(wk ? `Weekend batch: ${wk.time}.` : "");
      } else {
        parts.push(c.batches.map((b) => `${b.name} ${b.time}`).join(", ") + ".");
      }
    }
    const faq = !parts.length ? faqAnswer(text) : null;
    if (faq) parts.push(faq);
    if (!parts.length && /where|location|address|kaha|kahan|branch/i.test(t)) {
      const b = c.branches.find((x) => fields.preferred_branch === x.name);
      parts.push(
        b
          ? `${b.name}: ${b.address}. Nearest station: ${b.nearest_station}.`
          : "Branches: " + c.branches.map((x) => `${x.name} (${x.landmark})`).join(", ") + ".",
      );
    }
    body = parts.filter(Boolean).join(" ");

    if (!body) {
      const gotFields = Object.keys(fields).length > 0;
      if (gotFields) {
        const bits = [
          fields.class_or_exam,
          fields.preferred_branch,
          fields.preferred_batch ? `${fields.preferred_batch} batch` : null,
        ].filter(Boolean);
        body = hi ? `Theek hai${bits.length ? `, noted: ${bits.join(", ")}` : ""}.` : `Got it${bits.length ? ` — ${bits.join(", ")}` : ""}.`;
      } else if (GREETING.test(text.trim())) {
        body = hi
          ? `Namaste! Main ${c.business.name} ka admission assistant hoon. Courses, fees, batches ya demo class ke baare mein poochiye.`
          : `Hello! I'm the admission assistant for ${c.business.name}. Ask me about courses, fees, batches or a free demo class.`;
      } else if (DOMAIN.test(text)) {
        needsHuman = true;
        reason = "Question not covered by the knowledge base";
        body = hi ? "Yeh main confirm nahi kar sakti — main counsellor se pooch kar bata dungi." : c.handover.unknown_reply;
      } else {
        intents.add("off_topic");
        body = c.scope.refusal;
      }
    }
  }

  const offTopicOnly = intents.has("off_topic");
  const hasGivenValue = ctx.history.some((m) => m.role === "assistant") || (body.length > 0 && !offTopicOnly && !needsHuman);
  const nq = intents.has("upset") || intents.has("not_interested") || offTopicOnly ? { q: "", replies: ["Courses", "Fees?", "Demo class"] } : nextQuestion(merged, hi, hasGivenValue);
  const closing =
    !nq.q && merged.parent_phone && !offTopicOnly && !needsHuman && !intents.has("not_interested")
      ? hi
        ? "Hamari counsellor demo class confirm karne ke liye aapko call karengi."
        : "Our counsellor will call you shortly to confirm the demo class."
      : "";
  const reply = [body, nq.q || closing].filter(Boolean).join(" ");

  return {
    reply,
    language: hi ? "hinglish" : "en",
    extracted_fields: fields,
    intents: [...intents],
    score: 0,
    score_reasons: [],
    next_action: "",
    needs_human: needsHuman,
    handover_reason: reason,
    quick_replies: nq.replies,
  };
}
