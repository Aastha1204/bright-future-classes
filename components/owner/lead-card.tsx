"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { AlertTriangle, Check, Copy, Eye, EyeOff, MessageSquareText } from "lucide-react";
import { cn } from "@/lib/utils";
import { maskPhone } from "@/lib/mask";
import { slotLabel } from "@/lib/slot";
import { Card } from "@/components/ui/card";
import { LeadBadge } from "@/components/ui/badge";
import type { LeadRow } from "@/lib/types";
import { ScoreRing } from "./score-ring";
import { SoundToggle } from "./whatsapp-alert";

export interface CardConfig {
  counsellor: string;
  templates: { hot: string; warm: string; cold: string };
}

interface Detail {
  messages: { role: string; content: string; created_at?: string }[];
  events: { event_type: string; old_value: unknown; new_value: unknown; created_at: string }[];
  cost_inr: number;
  restricted?: boolean;
}

function initials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Value that flashes yellow for ~1.2 s whenever it changes. */
function Flash({ value, children }: { value: unknown; children: React.ReactNode }) {
  const prev = useRef(value);
  const [n, setN] = useState(0);
  useEffect(() => {
    if (prev.current !== value && value !== null && value !== undefined) setN((k) => k + 1);
    prev.current = value;
  }, [value]);
  return (
    <span key={n} className={cn("rounded px-1 -mx-1", n > 0 && "animate-flash")}>
      {children}
    </span>
  );
}

function Row({ label, value, children }: { label: string; value: unknown; children?: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line/60 py-2 text-sm last:border-0">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium">
        <Flash value={value}>{children ?? (value ? String(value) : <span className="text-muted">—</span>)}</Flash>
      </dd>
    </div>
  );
}

function fillTemplate(t: string, lead: LeadRow, counsellor: string): string {
  return t
    .replace("{parent}", lead.parent_name ?? "there")
    .replace("{student}", lead.student_name ?? "your child")
    .replace("{class}", lead.class_or_exam ?? "our courses")
    .replace("{branch}", lead.preferred_branch ?? "our branch")
    .replace("{slot}", lead.demo_slot_requested ? slotLabel(lead.demo_slot_requested) : "the demo slot")
    .replace("{counsellor}", counsellor);
}

const pointsOf = (reason: string) => reason.match(/\(([+-]\d+)\)\s*$/)?.[1] ?? null;

export function LeadCard({ lead, config, className }: { lead: LeadRow | null; config: CardConfig; className?: string }) {
  const [tab, setTab] = useState<"details" | "transcript" | "timeline">("details");
  const [reveal, setReveal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [detail, setDetail] = useState<Detail | null>(null);

  const id = lead?.id;
  const stamp = lead?.updated_at;
  useEffect(() => {
    if (!id) return;
    let live = true;
    fetch(`/api/leads/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => live && d && setDetail(d))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [id, stamp]);

  useEffect(() => {
    setReveal(false);
    setDetail(null);
  }, [id]);

  if (!lead) {
    return (
      <Card className={cn("flex min-h-[420px] flex-col items-center justify-center gap-2 p-8 text-center", className)}>
        <MessageSquareText className="h-10 w-10 text-primary/50" aria-hidden />
        <p className="font-heading text-lg font-bold">Waiting for a conversation</p>
        <p className="max-w-xs text-sm text-muted">The owner card fills in live as the student chats — fields, score and next action.</p>
      </Card>
    );
  }

  const phoneMasked = !!lead.parent_phone && lead.parent_phone.includes("X");
  const phone = lead.parent_phone ? (reveal || phoneMasked ? lead.parent_phone : maskPhone(lead.parent_phone)) : null;
  const display = lead.student_name ?? lead.parent_name ?? "New visitor";
  const tpl = lead.badge === "HOT" ? config.templates.hot : lead.badge === "WARM" ? config.templates.warm : config.templates.cold;
  const message = fillTemplate(tpl, lead, config.counsellor);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = message;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="flex items-center gap-4 border-b border-line p-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-base font-bold text-white dark:text-slate-950" aria-hidden>
          {initials(display === "New visitor" ? null : display)}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-heading text-lg font-bold">{display}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <AnimatePresence mode="wait" initial={false}>
              <m.span key={lead.badge} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.7, opacity: 0 }} transition={{ type: "spring", stiffness: 420, damping: 18 }}>
                <LeadBadge badge={lead.badge} />
              </m.span>
            </AnimatePresence>
            <span className="text-xs capitalize text-muted">{lead.status.replace("_", " ")}</span>
          </div>
        </div>
        <ScoreRing score={lead.score} badge={lead.badge} size={96} />
      </div>

      {lead.needs_human && (
        <div role="alert" className="flex items-start gap-2 border-b border-warm/30 bg-warm/15 px-5 py-3 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warm" aria-hidden />
          <p>
            <b>Needs a human.</b> {lead.handover_reason ?? "Counsellor follow-up requested."}
          </p>
        </div>
      )}

      <div className="flex gap-1 border-b border-line px-3 pt-2" role="tablist" aria-label="Lead details">
        {(["details", "transcript", "timeline"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn("rounded-t-lg px-3 py-2 text-sm font-semibold capitalize", tab === t ? "border-b-2 border-primary text-primary" : "text-muted hover:text-ink")}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="p-5">
        {tab === "details" && (
          <>
            <dl>
              <Row label="Parent phone" value={lead.parent_phone}>
                {phone ? (
                  <span className="inline-flex items-center gap-2">
                    {phone}
                    {!phoneMasked && (
                      <button onClick={() => setReveal((r) => !r)} aria-label={reveal ? "Hide phone number" : "Reveal phone number"} className="text-muted hover:text-ink">
                        {reveal ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    )}
                  </span>
                ) : undefined}
              </Row>
              <Row label="Class / exam" value={lead.class_or_exam ? `${lead.class_or_exam}${lead.board ? ` · ${lead.board}` : ""}` : null} />
              <Row label="Branch" value={lead.preferred_branch} />
              <Row label="Batch" value={lead.preferred_batch} />
              <Row label="Budget" value={lead.budget_comfort} />
              <Row label="Demo slot" value={lead.demo_slot_requested ? slotLabel(lead.demo_slot_requested) : null} />
            </dl>

            <h3 className="mb-2 mt-5 text-xs font-bold uppercase tracking-wide text-muted">Why this score</h3>
            {lead.score_reasons.length === 0 ? (
              <p className="text-sm text-muted">No signals yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {lead.score_reasons.map((r) => {
                  const pts = pointsOf(r);
                  return (
                    <m.li key={r} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex items-center justify-between gap-3 text-sm">
                      <span>{r.replace(/\s*\([+-]\d+\)\s*$/, "")}</span>
                      {pts && (
                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", pts.startsWith("+") ? "bg-primary-light text-primary" : "bg-hot/15 text-red-700 dark:text-red-300")}>{pts}</span>
                      )}
                    </m.li>
                  );
                })}
              </ul>
            )}

            <div className="mt-5 rounded-xl border border-primary/30 bg-primary-light p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-primary">Suggested next action</p>
              <p className="mt-1 text-sm font-medium">
                <Flash value={lead.next_action}>{lead.next_action}</Flash>
              </p>
              <button onClick={copy} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:brightness-110 dark:text-slate-950">
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied!" : "Copy WhatsApp message"}
              </button>
              <span className="sr-only" aria-live="polite">
                {copied ? "Message copied" : ""}
              </span>
            </div>
          </>
        )}

        {tab === "transcript" &&
          (!detail ? (
            <p className="text-sm text-muted">Loading…</p>
          ) : detail.restricted ? (
            <p className="text-sm text-muted">Transcripts of other visitors&apos; live chats are private on the public demo.</p>
          ) : detail.messages.length === 0 ? (
            <p className="text-sm text-muted">No messages yet.</p>
          ) : (
            <ol className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {detail.messages.map((m, i) => (
                <li key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                  <p className={cn("max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm", m.role === "user" ? "bg-primary text-white dark:text-slate-950" : "border border-line bg-background")}>{m.content}</p>
                </li>
              ))}
            </ol>
          ))}

        {tab === "timeline" &&
          (!detail ? (
            <p className="text-sm text-muted">Loading…</p>
          ) : detail.events.length === 0 ? (
            <p className="text-sm text-muted">No events yet.</p>
          ) : (
            <ol className="relative space-y-3 border-l border-line pl-4">
              {detail.events.map((e, i) => (
                <li key={i} className="text-sm">
                  <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-primary" aria-hidden />
                  <p className="font-medium">{describeEvent(e)}</p>
                  <p className="text-xs text-muted">{new Date(e.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</p>
                </li>
              ))}
            </ol>
          ))}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-line px-5 py-3 text-xs text-muted">
        <span>Cost this chat: ₹{(detail?.cost_inr ?? 0).toFixed(2)}</span>
        <SoundToggle />
      </div>
    </Card>
  );
}

function describeEvent(e: Detail["events"][number]): string {
  const nv = (e.new_value ?? {}) as Record<string, unknown>;
  const ov = (e.old_value ?? {}) as Record<string, unknown>;
  switch (e.event_type) {
    case "field_extracted":
      return `Captured ${String(nv.field).replace(/_/g, " ")}: ${String(nv.value)}`;
    case "score_changed":
      return `Score ${String(ov.score ?? 0)} → ${String(nv.score)}`;
    case "badge_changed":
      return `Badge ${String(ov.badge)} → ${String(nv.badge)}`;
    case "handover":
      return `Flagged for human: ${String(nv.reason ?? "")}`;
    case "alert_fired":
      return `Alert sent: ${String(nv.body ?? "")}`;
    case "status_changed":
      return `Status ${String(ov.status)} → ${String(nv.status)}`;
    default:
      return e.event_type;
  }
}
