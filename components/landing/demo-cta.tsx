import Link from "next/link";
import { Flame, MessageCircle, Play } from "lucide-react";
import { StudentStudying } from "@/components/illustrations/scenes";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";

export function DemoCta() {
  return (
    <section id="demo" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20 sm:px-6">
      <Reveal className="grid items-center gap-8 overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-primary-light to-surface p-8 shadow-card md:grid-cols-[1fr_280px] md:p-12">
        <div>
          <h2 className="text-3xl font-extrabold sm:text-4xl">See it work — in 60 seconds</h2>
          <p className="mt-3 max-w-lg text-muted">
            Pick a scripted conversation and watch the chat type itself while the owner&apos;s lead card fills in live. Or type your own questions to the real bot.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild variant="outline" className="border-hot/50 text-red-700 dark:text-red-300">
              <Link href="/demo?play=A"><Flame className="h-4 w-4" /> Play demo A (HOT)</Link>
            </Button>
            <Button asChild variant="outline" className="border-warm/60 text-amber-800 dark:text-amber-300">
              <Link href="/demo?play=B"><Play className="h-4 w-4" /> Demo B (WARM)</Link>
            </Button>
            <Button asChild variant="outline" className="border-cold/60 text-slate-700 dark:text-slate-300">
              <Link href="/demo?play=C"><Play className="h-4 w-4" /> Demo C (COLD)</Link>
            </Button>
            <Button asChild variant="accent">
              <Link href="/demo"><MessageCircle className="h-4 w-4" /> Try live</Link>
            </Button>
          </div>
        </div>
        <div className="mx-auto hidden h-56 w-64 md:block">
          <StudentStudying />
        </div>
      </Reveal>
    </section>
  );
}
