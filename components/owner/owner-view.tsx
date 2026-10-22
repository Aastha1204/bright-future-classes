"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { LeadBadge } from "@/components/ui/badge";
import type { LeadRow } from "@/lib/types";
import { EmptyState } from "./empty-state";
import { LeadCard, type CardConfig } from "./lead-card";
import { useLive } from "./use-live";
import { WhatsAppAlert, type AlertData } from "./whatsapp-alert";

type Row = LeadRow & { source: string };

function ago(iso: string): string {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}

/** /owner: live card for the most recently active conversation (or any selected lead). */
export function OwnerView({ config }: { config: CardConfig }) {
  const { data, loading } = useLive<{ rows: Row[] }>("/api/leads?sort=updated&pageSize=12", 1500);
  const rows = useMemo(() => data?.rows ?? [], [data]);
  const [picked, setPicked] = useState<string | null>(null); // null = follow latest
  const selected = rows.find((r) => r.id === picked) ?? rows[0] ?? null;

  const [since, setSince] = useState(() => new Date().toISOString());
  const [alert, setAlert] = useState<AlertData | null>(null);
  useEffect(() => {
    const t = setInterval(async () => {
      try {
        const res = await fetch(`/api/alerts?since=${encodeURIComponent(since)}`, { cache: "no-store" });
        const j = (await res.json()) as { alerts: { body: string; created_at: string }[]; now: string };
        if (j.alerts.length) {
          const last = j.alerts[j.alerts.length - 1];
          setAlert({ id: last.created_at, body: last.body });
          setSince(last.created_at);
        }
      } catch {
        /* ignore */
      }
    }, 2000);
    return () => clearInterval(t);
  }, [since]);

  return (
    <section className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[320px_1fr]">
      <WhatsAppAlert alert={alert} />
      <h1 className="sr-only">Owner view: live lead card</h1>
      <aside aria-label="Recent conversations" className="order-2 min-h-[680px] lg:order-1">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-heading text-sm font-bold uppercase tracking-wide text-muted">Recent conversations</h2>
          <button
            onClick={() => setPicked(null)}
            className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", picked === null ? "bg-primary text-white dark:text-slate-950" : "border border-line text-muted hover:text-ink")}
          >
            Following latest
          </button>
        </div>
        {loading && rows.length === 0 ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : rows.length === 0 ? (
          <EmptyState title="No leads yet" hint="Start a chat on the Demo page and it will appear here live." />
        ) : (
          <ul className="space-y-2">
            {rows.map((r) => (
              <li key={r.id}>
                <button
                  onClick={() => setPicked(r.id)}
                  aria-current={selected?.id === r.id}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border bg-surface p-3 text-left transition hover:-translate-y-0.5",
                    selected?.id === r.id ? "border-primary ring-1 ring-primary" : "border-line",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{r.student_name ?? r.parent_name ?? "New visitor"}</span>
                    <span className="block truncate text-xs text-muted">
                      {r.class_or_exam ?? "Enquiry"} · {ago(r.updated_at)}
                    </span>
                  </span>
                  <span className="text-sm font-bold tabular-nums">{r.score}</span>
                  <LeadBadge badge={r.badge} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>
      <div className="order-1 min-h-[640px] lg:order-2">
        <LeadCard lead={selected} config={config} />
      </div>
    </section>
  );
}
