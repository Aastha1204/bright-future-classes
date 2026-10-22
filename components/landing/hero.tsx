"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { m, useMotionValue, useReducedMotion } from "framer-motion";
import { ArrowRight, Flame, Sparkles } from "lucide-react";
import { HeroSkyline } from "@/components/illustrations/skyline";
import { GlowCard } from "@/components/motion/glow-card";
import { Magnetic } from "@/components/motion/magnetic";
import { ScoreRing } from "@/components/owner/score-ring";
import { Button } from "@/components/ui/button";
import { LeadBadge } from "@/components/ui/badge";

export function Hero({ price }: { price: string }) {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const [skylineReady, setSkylineReady] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setSkylineReady(true), 150);
    return () => clearTimeout(id);
  }, []);

  return (
    <section
      className="relative isolate overflow-hidden"
      style={{ backgroundColor: "var(--sky-c)" }}
      onMouseMove={(e) => {
        if (reduce) return;
        const r = e.currentTarget.getBoundingClientRect();
        mx.set(((e.clientX - r.left) / r.width - 0.5) * 2);
        my.set(((e.clientY - r.top) / r.height - 0.5) * 2);
      }}
    >
      {/* The skyline mounts after first paint so the headline isn't waiting on a few hundred SVG nodes. */}
      <div className="absolute inset-x-0 bottom-0 h-[300px] sm:h-[420px] lg:h-[520px]">
        {skylineReady && (
          <m.div className="h-full w-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
            <HeroSkyline mx={mx} my={my} />
          </m.div>
        )}
      </div>
      <div className="relative mx-auto grid min-h-[720px] max-w-7xl items-start gap-10 px-4 pb-56 pt-14 sm:px-6 sm:pb-72 lg:grid-cols-[1.1fr_0.9fr] lg:pb-[330px] lg:pt-16">
        <div>
          <m.span initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 px-3 py-1 text-xs font-semibold backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-accent" aria-hidden /> AI chatbot + lead capture for coaching classes, clinics &amp; offices
          </m.span>
          {/* headline and intro render immediately (no opacity-0 start) so the largest paint isn't delayed */}
          <h1 className="mt-5 text-balance text-4xl font-extrabold leading-[1.08] sm:text-5xl lg:text-6xl">
            Every admission enquiry answered in seconds.{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Only HOT leads need your call.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-ink/80">
            A chatbot that answers in English and Hinglish, only from your own fees and batches, captures the parent&apos;s number, scores the lead 0–100 and shows it to you live.
          </p>
          <m.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-8 flex flex-wrap items-center gap-4">
            <Magnetic>
              <Button asChild size="lg">
                <Link href="/demo?play=A">
                  Watch the live demo <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </Magnetic>
            <Button asChild size="lg" variant="outline">
              <Link href="/demo">Try it yourself</Link>
            </Button>
            <span className="text-sm font-semibold text-ink/80">{price} one-time</span>
          </m.div>
        </div>

        <div className="relative mx-auto hidden w-full max-w-md lg:block" aria-hidden>
          <GlowCard className="animate-bob p-4">
            <div className="flex items-end gap-2">
              <span className="rounded-2xl rounded-bl-sm bg-primary-light px-3 py-2 text-sm">Fees kitni hai Class 9 ki?</span>
            </div>
            <div className="mt-2 flex justify-end">
              <span className="rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-white dark:text-slate-950">Class 9 ki fees ₹52,000/year hai, 3 instalments mein.</span>
            </div>
          </GlowCard>
          <GlowCard className="ml-10 mt-5 animate-bob p-4 [animation-delay:1.2s]">
            <div className="flex items-center gap-4">
              <ScoreRing score={86} badge="HOT" size={84} />
              <div>
                <LeadBadge badge="HOT" />
                <p className="mt-1 font-heading font-bold">Riya&apos;s parent</p>
                <p className="text-xs text-muted">Class 9 · Andheri · Thu 5 pm demo</p>
              </div>
            </div>
          </GlowCard>
          <GlowCard className="-ml-4 mt-5 w-64 animate-bob p-3 [animation-delay:2.4s]">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Flame className="h-4 w-4 text-hot" /> New HOT lead
            </p>
            <p className="text-xs text-muted">Call within 15 min and confirm the demo.</p>
          </GlowCard>
        </div>
      </div>
    </section>
  );
}
