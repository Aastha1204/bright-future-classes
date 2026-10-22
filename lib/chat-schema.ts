import { z } from "zod";

export const INTENTS = [
  "asks_fees",
  "asks_demo_class",
  "asks_visit",
  "asks_timings",
  "asks_results",
  "callback_request",
  "off_topic",
  "upset",
  "not_interested",
] as const;
export type Intent = (typeof INTENTS)[number];

const nullableStr = z
  .string()
  .nullish()
  .transform((v) => (v && v.trim() && v.trim().toLowerCase() !== "null" ? v.trim().slice(0, 120) : null));

export const ChatResponseSchema = z.object({
  reply: z.string().min(1).max(1200),
  language: z.enum(["en", "hinglish"]).catch("en"),
  extracted_fields: z
    .object({
      student_name: nullableStr,
      parent_name: nullableStr,
      parent_phone: nullableStr,
      class_or_exam: nullableStr,
      board: nullableStr,
      preferred_branch: nullableStr,
      preferred_batch: nullableStr,
      budget_comfort: nullableStr,
    })
    .partial()
    .default({}),
  intents: z
    .array(z.string())
    .default([])
    .transform((xs) => xs.filter((x): x is Intent => (INTENTS as readonly string[]).includes(x))),
  score: z.number().catch(0).default(0),
  score_reasons: z.array(z.string()).catch([]).default([]),
  next_action: z.string().catch("").default(""),
  needs_human: z.boolean().catch(false).default(false),
  handover_reason: z.string().nullish().default(null),
  quick_replies: z.array(z.string()).catch([]).default([]).transform((q) => q.slice(0, 4)),
});

export type ChatResponse = z.infer<typeof ChatResponseSchema>;

export const ChatRequestSchema = z.object({
  sessionId: z.string().uuid().optional(),
  message: z.string().min(1),
  source: z.enum(["landing_bubble", "demo_page"]).default("demo_page"),
});
