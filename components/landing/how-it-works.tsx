"use client";

import { useEffect, useState } from "react";
import { m, useReducedMotion } from "framer-motion";
import { BellRing, BookOpenCheck, Gauge, MessageCircle } from "lucide-react";
import { ParentOnPhone, CounsellorDesk } from "@/components/illustrations/scenes";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

const STEPS = [
  { icon: MessageCircle, title: "Visitor asks", text: "A parent asks about fees, batches or a demo class — in English or Hinglish.", art: <ParentOnPhone /> },
  { icon: BookOpenCheck, title: "AI answers from your data", text: "Replies use only your own fees, batches and policies. Unknown? It says the counsellor will confirm.", art: null },
  { icon: Gauge, title: "Lead gets scored", text: "Phone, class, branch, demo interest and urgency add up to a 0–100 score: HOT, WARM or COLD.", art: null },
  { icon: BellRing, title: "Owner gets a HOT alert", text: "You see the card fill in live and get a ready follow-up message. Call only the HOT ones.", art: <CounsellorDesk /> },
];

export function HowItWorks() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setActive((a) => (a + 1) % STEPS.length), 2400);
    return () => clearInterval(t);
  }, [reduce]);

  const pct = `${(active / (STEPS.length - 1)) * 100}%`;

  return (
    <section id="how" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-24 sm:px-6">
      <Reveal>
        <h2 className="text-center text-3xl font-extrabold sm:text-4xl">How it works</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-muted">From first message to HOT alert in four steps.</p>
      </Reveal>

      <div className="relative mt-14">
        {/* desktop: dashed path with a travelling dot */}
        <div className="pointer-events-none absolute left-[12.5%] right-[12.5%] top-8 hidden md:block" aria-hidden>
          <div className="relative border-t-2 border-dashed border-primary/40">
            <m.span className="absolute -top-[9px] h-4 w-4 -translate-x-1/2 rounded-full bg-accent shadow-[0_0_0_6px_rgb(var(--accent)/0.25)]" animate={{ left: pct }} transition={{ type: "spring", stiffness: 80, damping: 16 }} />
          </div>
        </div>
        {/* mobile: vertical path */}
        <div className="pointer-events-none absolute bottom-8 left-8 top-8 md:hidden" aria-hidden>
          <div className="relative h-full border-l-2 border-dashed border-primary/40">
            <m.span className="absolute -left-[9px] h-4 w-4 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_0_6px_rgb(var(--accent)/0.25)]" animate={{ top: pct }} transition={{ type: "spring", stiffness: 80, damping: 16 }} />
          </div>
        </div>

        <ol className="relative grid gap-8 md:grid-cols-4 md:gap-6">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const on = active === i;
            return (
              <Reveal as="li" key={s.title} delay={i * 0.1} className="flex gap-4 md:flex-col md:items-center md:text-center">
                <span className={cn("relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border bg-surface shadow-card transition-all duration-500", on ? "scale-110 border-accent text-accent" : "border-line text-primary")}>
                  <Icon className="h-7 w-7" aria-hidden />
                  <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white dark:text-slate-950">{i + 1}</span>
                </span>
                <div>
                  <h3 className="font-heading text-lg font-bold">{s.title}</h3>
                  <p className="mt-1 text-sm text-muted">{s.text}</p>
                  {s.art && <div className="mx-auto mt-3 hidden h-28 w-36 md:block">{s.art}</div>}
                </div>
              </Reveal>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
