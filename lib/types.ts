import type { Badge } from "./scoring";

export type LeadStatus = "new" | "contacted" | "demo_booked" | "enrolled" | "lost";
export type ChatSource = "landing_bubble" | "demo_page" | "scripted_A" | "scripted_B" | "scripted_C";

export interface SessionRow {
  id: string;
  visitor_id: string;
  ip_hash: string | null;
  source: ChatSource | "seed";
  mode: "live" | "scripted";
  language_detected: string | null;
}

export interface MessageRow {
  id?: string;
  session_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  raw_json?: unknown;
  tokens_in?: number;
  tokens_out?: number;
  latency_ms?: number | null;
  model?: string | null;
  created_at?: string;
}

export interface LeadRow {
  id: string;
  session_id: string;
  student_name: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  phone_valid: boolean;
  class_or_exam: string | null;
  board: string | null;
  preferred_branch: string | null;
  preferred_batch: string | null;
  budget_comfort: string | null;
  interest_summary: string | null;
  score: number;
  badge: Badge;
  score_reasons: string[];
  next_action: string | null;
  needs_human: boolean;
  handover_reason: string | null;
  demo_slot_requested: string | null;
  status: LeadStatus;
  is_seed: boolean;
  created_at: string;
  updated_at: string;
}

export const LEAD_FIELDS = [
  "student_name",
  "parent_name",
  "parent_phone",
  "class_or_exam",
  "board",
  "preferred_branch",
  "preferred_batch",
  "budget_comfort",
] as const;
export type LeadField = (typeof LEAD_FIELDS)[number];

export type EventType =
  | "field_extracted"
  | "score_changed"
  | "badge_changed"
  | "handover"
  | "alert_fired"
  | "status_changed";

export interface LeadEventRow {
  event_type: EventType;
  old_value?: unknown;
  new_value?: unknown;
}

export type GuardrailType =
  | "prompt_injection"
  | "out_of_scope"
  | "abuse"
  | "result_guarantee"
  | "medical_legal_financial"
  | "invented_fact";

export interface UsageRow {
  provider: string;
  model: string;
  tokens_in: number;
  tokens_out: number;
  cost_inr: number;
}

export interface AlertRow {
  title: string;
  body: string;
}
