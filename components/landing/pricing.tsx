import { Check } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { CtaButton } from "./cta-button";

const INCLUDED = [
  "Chatbot trained only on your fees, batches and policies",
  "English + Hinglish replies, 24×7",
  "Lead capture with a transparent 0–100 score",
  "Live owner dashboard, leads table and analytics",
  "HOT-lead alert and copy-ready follow-up messages",
  "Excel-ready CSV export of your leads",
  "Branded with your name, colours and logo",
];

export function Pricing({ price }: { price: string }) {
  return (
    <section id="pricing" className="mx-auto max-w-3xl scroll-mt-24 px-4 py-20 sm:px-6">
      <Reveal className="relative overflow-hidden rounded-3xl border-2 border-primary bg-surface p-8 shadow-card sm:p-10">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/20" aria-hidden />
        <p className="text-sm font-bold uppercase tracking-wide text-primary">AI Chatbot + Lead Capture</p>
        <p className="mt-2 font-heading text-5xl font-extrabold">
          {price} <span className="text-lg font-medium text-muted">one-time setup</span>
        </p>
        <ul className="mt-6 space-y-3">
          {INCLUDED.map((i) => (
            <li key={i} className="flex gap-3 text-sm">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden /> {i}
            </li>
          ))}
        </ul>
        <div className="mt-8">
          <CtaButton label="Book this for your business" />
        </div>
      </Reveal>
    </section>
  );
}
