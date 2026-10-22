import Papa from "papaparse";
import type { LeadRow } from "./types";

const COLUMNS = ["created_at", "student_name", "parent_phone", "class", "branch", "batch", "score", "badge", "status", "next_action"] as const;

/** Neutralise spreadsheet formula injection (cells starting with = + - @). */
function safe(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
}

/** UTF-8 with BOM so Excel opens ₹ and Devanagari correctly. */
export function leadsToCsv(leads: LeadRow[]): string {
  const data = leads.map((l) => [
    l.created_at,
    safe(l.student_name),
    safe(l.parent_phone),
    safe(l.class_or_exam),
    safe(l.preferred_branch),
    safe(l.preferred_batch),
    l.score,
    l.badge,
    l.status,
    safe(l.next_action),
  ]);
  return "﻿" + Papa.unparse({ fields: [...COLUMNS], data }, { newline: "\r\n" });
}
