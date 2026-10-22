import { BellRing, Download, Gauge, Languages, ShieldCheck, WifiOff } from "lucide-react";
import { GlowCard } from "@/components/motion/glow-card";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";

const FEATURES = [
  { icon: ShieldCheck, title: "Never invents a fee", text: "Every ₹ amount, percentage and time in a reply is checked against your data. Anything else is replaced with “the counsellor will confirm”." },
  { icon: Languages, title: "English + Hinglish", text: "Replies in the parent's own style, short and warm, one question at a time." },
  { icon: Gauge, title: "Deterministic lead score", text: "A transparent 0–100 score with the reason for every point — not an AI guess." },
  { icon: BellRing, title: "Live owner dashboard", text: "The lead card fills in as the chat happens, with a suggested next action and a copy-ready follow-up." },
  { icon: Download, title: "Leads table + CSV", text: "Search, filter, change status and export to Excel-ready CSV." },
  { icon: WifiOff, title: "Demo-proof", text: "Scripted demos run even if the internet or the AI API fails, so a client demo never goes blank." },
];

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-12 sm:px-6">
      <Reveal>
        <h2 className="text-center text-3xl font-extrabold sm:text-4xl">Built for busy owners</h2>
      </Reveal>
      <Stagger className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <StaggerItem key={f.title}>
              <GlowCard className="h-full p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-light text-primary">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-heading text-lg font-bold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted">{f.text}</p>
              </GlowCard>
            </StaggerItem>
          );
        })}
      </Stagger>
    </section>
  );
}
