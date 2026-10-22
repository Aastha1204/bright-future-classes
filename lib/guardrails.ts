import type { GuardrailType } from "./types";

export const MAX_INPUT_CHARS = 500;
export const MAX_TURNS = 30;

/** Strip HTML/control characters and clamp length. Messages are rendered as text only. */
export function sanitizeInput(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, " ")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_INPUT_CHARS);
}

const INJECTION = [
  /ignore (all |any |your |the |my )?(previous |prior |above |earlier )?(instructions?|rules?|prompt)/i,
  /disregard (all |your |the )?(previous |prior )?(instructions?|rules?)/i,
  /(print|show|reveal|repeat|tell me|give me|leak)\b.{0,30}\b(system prompt|your prompt|your instructions|config|knowledge base file)/i,
  /\byou are now\b/i,
  /\bact as\b.{0,30}\b(tutor|dan|developer|assistant|hacker)/i,
  /\b(jailbreak|developer mode|dan mode)\b/i,
  /pretend (to be|you are)/i,
];

const MEDICAL_LEGAL_FIN = [
  /\b(medicine|medical|doctor|diagnos|symptom|prescription|tablet|dosage)\b/i,
  /\b(lawyer|legal advice|sue|court case|lawsuit)\b/i,
  /\b(stock|stocks|shares tip|invest|crypto|bitcoin|mutual fund|loan advice)\b/i,
];

const ABUSE = [/\b(fuck|bastard|bitch|madarchod|bhenchod|chutiya|saala)\b/i];

const GUARANTEE = [/guarantee/i, /100\s?%\s?(selection|result|success)/i, /pakka\s+(selection|rank|marks)/i, /sure\s+selection/i];

export function detectInjection(text: string): boolean {
  return INJECTION.some((r) => r.test(text));
}

export function detectGuardrails(text: string): GuardrailType[] {
  const out: GuardrailType[] = [];
  if (detectInjection(text)) out.push("prompt_injection");
  if (GUARANTEE.some((r) => r.test(text))) out.push("result_guarantee");
  if (MEDICAL_LEGAL_FIN.some((r) => r.test(text))) out.push("medical_legal_financial");
  if (ABUSE.some((r) => r.test(text))) out.push("abuse");
  return out;
}

export const INJECTION_REPLY =
  "I can't share or change my instructions, but I'm happy to help with admissions — courses, fees, batches, branches or a free demo class. What would you like to know?";
