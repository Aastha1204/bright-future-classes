"use client";

import { useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowDown, ArrowUp, Download, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { LeadBadge } from "@/components/ui/badge";
import type { LeadRow, LeadStatus } from "@/lib/types";
import { EmptyState } from "./empty-state";
import { LeadCard, type CardConfig } from "./lead-card";
import { useLive } from "./use-live";

type Row = LeadRow & { source: string };

interface Props {
  config: CardConfig;
  branches: string[];
  classes: string[];
}

const STATUSES: LeadStatus[] = ["new", "contacted", "demo_booked", "enrolled", "lost"];
const SOURCES = [
  { v: "", l: "All sources" },
  { v: "seed", l: "Sample data" },
  { v: "demo_page", l: "Demo page" },
  { v: "landing_bubble", l: "Chat bubble" },
  { v: "scripted_A", l: "Script A" },
  { v: "scripted_B", l: "Script B" },
  { v: "scripted_C", l: "Script C" },
];

function ago(iso: string): string {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}

const selectCls = "h-9 rounded-lg border border-line bg-surface px-2.5 text-sm focus-visible:ring-2 focus-visible:ring-primary";

export function LeadsTable({ config, branches, classes }: Props) {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [badge, setBadge] = useState("");
  const [cls, setCls] = useState("");
  const [branch, setBranch] = useState("");
  const [source, setSource] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState<"date" | "score">("date");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    const add = (k: string, v: string) => v && p.set(k, v);
    add("search", search);
    add("badge", badge);
    add("cls", cls);
    add("branch", branch);
    add("source", source);
    add("from", from);
    add("to", to);
    p.set("sort", sort);
    p.set("dir", dir);
    return p;
  }, [search, badge, cls, branch, source, from, to, sort, dir]);

  const url = `/api/leads?${qs.toString()}&page=${page}&pageSize=20`;
  const { data, loading, reload } = useLive<{ rows: Row[]; total: number; pageSize: number }>(url, 4000);
  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / 20));
  const open = rows.find((r) => r.id === openId) ?? null;

  const filtered = !!(search || badge || cls || branch || source || from || to);
  const reset = () => {
    setSearchInput("");
    setSearch("");
    setBadge("");
    setCls("");
    setBranch("");
    setSource("");
    setFrom("");
    setTo("");
    setPage(1);
  };

  const toggleSort = (k: "date" | "score") => {
    if (sort === k) setDir((d) => (d === "desc" ? "asc" : "desc"));
    else {
      setSort(k);
      setDir("desc");
    }
    setPage(1);
  };

  const setStatus = async (id: string, status: LeadStatus) => {
    await fetch(`/api/leads/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status }) });
    reload();
  };

  const SortIcon = dir === "desc" ? ArrowDown : ArrowUp;

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Leads</h1>
          <p className="text-sm text-muted">{loading ? "Loading…" : `${total} lead${total === 1 ? "" : "s"}${filtered ? " match your filters" : ""}`}</p>
        </div>
        <a
          href={`/api/leads/export?${qs.toString()}`}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white shadow-card transition hover:-translate-y-0.5 hover:brightness-110 dark:text-slate-950"
        >
          <Download className="h-4 w-4" /> Export CSV
        </a>
      </div>

      <Card className="mb-4 p-3">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          <label className="relative sm:col-span-2 xl:col-span-2">
            <span className="sr-only">Search leads</span>
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted" aria-hidden />
            <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search name, phone, class…" className={cn(selectCls, "w-full pl-8")} />
          </label>
          <select aria-label="Filter by badge" className={selectCls} value={badge} onChange={(e) => (setBadge(e.target.value), setPage(1))}>
            <option value="">All badges</option>
            <option value="HOT">HOT</option>
            <option value="WARM">WARM</option>
            <option value="COLD">COLD</option>
          </select>
          <select aria-label="Filter by class" className={selectCls} value={cls} onChange={(e) => (setCls(e.target.value), setPage(1))}>
            <option value="">All classes</option>
            {classes.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select aria-label="Filter by branch" className={selectCls} value={branch} onChange={(e) => (setBranch(e.target.value), setPage(1))}>
            <option value="">All branches</option>
            {branches.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
          <select aria-label="Filter by source" className={selectCls} value={source} onChange={(e) => (setSource(e.target.value), setPage(1))}>
            {SOURCES.map((s) => (
              <option key={s.v} value={s.v}>
                {s.l}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-1.5 sm:col-span-2 xl:col-span-2">
            <input type="date" aria-label="From date" className={cn(selectCls, "min-w-0 flex-1")} value={from} onChange={(e) => (setFrom(e.target.value), setPage(1))} />
            <span className="text-muted">–</span>
            <input type="date" aria-label="To date" className={cn(selectCls, "min-w-0 flex-1")} value={to} onChange={(e) => (setTo(e.target.value), setPage(1))} />
            {filtered && (
              <button onClick={reset} aria-label="Clear filters" className="rounded-lg p-2 text-muted hover:text-ink">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </Card>

      <Card className="min-h-[720px] overflow-hidden">
        {rows.length === 0 && !loading ? (
          <EmptyState title="No leads found" hint={filtered ? "Try clearing a filter or two." : "New leads appear here as soon as someone chats."} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="border-b border-line bg-background text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3">Lead</th>
                  <th className="px-3 py-3">Class</th>
                  <th className="px-3 py-3">Branch</th>
                  <th className="px-3 py-3">
                    <button onClick={() => toggleSort("score")} className="inline-flex items-center gap-1 font-semibold uppercase">
                      Score {sort === "score" && <SortIcon className="h-3 w-3" />}
                    </button>
                  </th>
                  <th className="px-3 py-3">Badge</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">
                    <button onClick={() => toggleSort("date")} className="inline-flex items-center gap-1 font-semibold uppercase">
                      Created {sort === "date" && <SortIcon className="h-3 w-3" />}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    tabIndex={0}
                    onClick={() => setOpenId(r.id)}
                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setOpenId(r.id))}
                    className="cursor-pointer border-b border-line/60 transition-colors last:border-0 hover:bg-primary-light/60"
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold">{r.student_name ?? r.parent_name ?? "New visitor"}</p>
                      <p className="text-xs text-muted">{r.parent_phone ?? "No phone yet"}</p>
                    </td>
                    <td className="px-3 py-3">{r.class_or_exam ?? "—"}</td>
                    <td className="px-3 py-3">{r.preferred_branch ?? "—"}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 overflow-hidden rounded-full bg-line" aria-hidden>
                          <div className={cn("h-full rounded-full", r.badge === "HOT" ? "bg-hot" : r.badge === "WARM" ? "bg-warm" : "bg-cold")} style={{ width: `${r.score}%` }} />
                        </div>
                        <span className="w-7 font-bold tabular-nums">{r.score}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <LeadBadge badge={r.badge} />
                    </td>
                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                      <select aria-label={`Status for ${r.student_name ?? "lead"}`} value={r.status} onChange={(e) => setStatus(r.id, e.target.value as LeadStatus)} className={cn(selectCls, "h-8 capitalize")}>
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-muted">{ago(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {total > 20 && (
          <div className="flex items-center justify-between border-t border-line px-4 py-3 text-sm">
            <span className="text-muted">
              Page {page} of {pages}
            </span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-line px-3 py-1.5 font-medium disabled:opacity-40">
                Previous
              </button>
              <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-line px-3 py-1.5 font-medium disabled:opacity-40">
                Next
              </button>
            </div>
          </div>
        )}
      </Card>

      <Dialog.Root open={!!openId} onOpenChange={(o) => !o && setOpenId(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
          <Dialog.Content className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto bg-background p-4 shadow-2xl focus:outline-none">
            <div className="mb-3 flex items-center justify-between">
              <Dialog.Title className="font-heading text-base font-bold">Lead details</Dialog.Title>
              <Dialog.Description className="sr-only">Full details, transcript and timeline for the selected lead.</Dialog.Description>
              <Dialog.Close aria-label="Close" className="rounded-lg p-1.5 hover:bg-primary-light">
                <X className="h-5 w-5" />
              </Dialog.Close>
            </div>
            <LeadCard lead={open} config={config} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
