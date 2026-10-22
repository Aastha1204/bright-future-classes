"use client";

import { m } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Analytics } from "@/lib/analytics";
import { useLive } from "./use-live";

const short = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card className="p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 font-heading text-3xl font-extrabold">{value}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </Card>
  );
}

function PerDay({ data }: { data: Analytics["perDay"] }) {
  const max = Math.max(1, ...data.map((d) => d.total));
  return (
    <div>
      <div className="flex h-48 items-end gap-1.5" role="img" aria-label="Leads per day for the last 14 days, split by badge">
        {data.map((d, i) => (
          <div key={d.date} className="group relative flex h-full flex-1 flex-col justify-end">
            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-muted opacity-0 transition group-hover:opacity-100">{d.total}</span>
            {(
              [
                ["cold", d.cold, "bg-cold"],
                ["warm", d.warm, "bg-warm"],
                ["hot", d.hot, "bg-hot"],
              ] as const
            ).map(([k, n, cls]) => (
              <m.div key={k} initial={{ height: 0 }} animate={{ height: `${(n / max) * 100}%` }} transition={{ duration: 0.6, delay: i * 0.03 }} className={`${cls} first:rounded-b-sm last:rounded-t-sm`} title={`${k.toUpperCase()}: ${n}`} />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-1.5">
        {data.map((d, i) => (
          <span key={d.date} className="flex-1 text-center text-[9px] text-muted">
            {i % 2 === 0 ? short(d.date).replace(" ", " ") : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

function Donut({ split }: { split: Analytics["split"] }) {
  const total = split.HOT + split.WARM + split.COLD || 1;
  const segs = [
    { k: "HOT", n: split.HOT, c: "stroke-hot", bg: "bg-hot" },
    { k: "WARM", n: split.WARM, c: "stroke-warm", bg: "bg-warm" },
    { k: "COLD", n: split.COLD, c: "stroke-cold", bg: "bg-cold" },
  ];
  const r = 54;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg viewBox="0 0 140 140" className="h-36 w-36 -rotate-90" role="img" aria-label={`HOT ${split.HOT}, WARM ${split.WARM}, COLD ${split.COLD}`}>
        <circle cx="70" cy="70" r={r} fill="none" strokeWidth="18" className="stroke-line" />
        {segs.map((s) => {
          const len = (s.n / total) * c;
          const el = (
            <m.circle key={s.k} cx="70" cy="70" r={r} fill="none" strokeWidth="18" className={s.c} strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-acc} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} />
          );
          acc += len;
          return el;
        })}
      </svg>
      <ul className="space-y-2 text-sm">
        {segs.map((s) => (
          <li key={s.k} className="flex items-center gap-2">
            <span className={`h-3 w-3 rounded-full ${s.bg}`} aria-hidden />
            <span className="w-12 font-semibold">{s.k}</span>
            <span className="tabular-nums text-muted">
              {s.n} · {Math.round((s.n / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Bars({ rows }: { rows: { label: string; value: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length) return <p className="text-sm text-muted">No data yet.</p>;
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="mb-1 flex justify-between text-sm">
            <span>{r.label}</span>
            <span className="font-semibold tabular-nums">{r.value}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-line">
            <m.div className="h-full rounded-full bg-primary" initial={{ width: 0 }} animate={{ width: `${(r.value / max) * 100}%` }} transition={{ duration: 0.7 }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function AnalyticsView() {
  const { data, loading } = useLive<Analytics>("/api/analytics", 10000);
  if (loading || !data) return <p className="mx-auto min-h-[1100px] max-w-6xl px-4 py-16 text-muted sm:px-6">Loading analytics…</p>;
  const f = data.funnel;
  const pct = (n: number) => (f.chats ? Math.round((n / f.chats) * 100) : 0);
  const peakDay = data.dailyCost.reduce((a, b) => (b.cost > a.cost ? b : a), data.dailyCost[0]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-extrabold">Analytics</h1>
      <p className="mb-6 text-sm text-muted">Last 14 days · sample data plus any live chats</p>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Chats / leads" value={String(data.totalLeads)} />
        <Stat label="HOT leads" value={String(data.split.HOT)} sub={`${data.totalLeads ? Math.round((data.split.HOT / data.totalLeads) * 100) : 0}% of all leads`} />
        <Stat label="Avg cost per chat" value={`₹${data.avgCostPerChat.toFixed(2)}`} />
        <Stat label="Total AI cost" value={`₹${data.totalCost.toFixed(2)}`} sub={peakDay && peakDay.cost > 0 ? `Peak ${short(peakDay.date)}: ₹${peakDay.cost.toFixed(2)}` : undefined} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle as="h2">Leads per day</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <PerDay data={data.perDay} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle as="h2">HOT / WARM / COLD</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <Donut split={data.split} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle as="h2">Top asked topics</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <Bars rows={data.topics.slice(0, 6).map((t) => ({ label: t.topic, value: t.count }))} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle as="h2">Conversion funnel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {[
              { label: "Chats started", n: f.chats },
              { label: "Phone shared", n: f.phone },
              { label: "Demo booked / requested", n: f.demo },
            ].map((s, i) => (
              <div key={s.label}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{s.label}</span>
                  <span className="font-semibold tabular-nums">
                    {s.n} · {pct(s.n)}%
                  </span>
                </div>
                <div className="h-8 overflow-hidden rounded-lg bg-line">
                  <m.div className="h-full rounded-lg bg-gradient-to-r from-primary to-accent" initial={{ width: 0 }} animate={{ width: `${pct(s.n)}%` }} transition={{ duration: 0.7, delay: i * 0.12 }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
