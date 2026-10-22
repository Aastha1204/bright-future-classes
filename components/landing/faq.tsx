import { ChevronDown } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";

const FAQS = [
  { q: "Will the bot make up fees or promises?", a: "No. It answers only from your data file, and every ₹ amount, percentage and time in a reply is checked against it. If something isn't there, it says the counsellor will confirm and flags the lead for you." },
  { q: "What does a chat cost to run?", a: "Typically between ₹0.5 and ₹5 per conversation, depending on the AI model you choose. The owner view shows the cost of every chat." },
  { q: "Does it work in Hindi / Hinglish?", a: "Yes. It replies in English or Roman-script Hinglish, matching how the parent writes." },
  { q: "What if the internet or the AI service is down?", a: "The site falls back to a knowledge-base mode, and the scripted demos keep working, so nothing goes blank." },
  { q: "How is the lead score decided?", a: "By fixed rules in code (phone shared, class known, demo interest and so on) — not by the AI. Each point is listed with its reason." },
  { q: "Can I use it for a clinic or a real-estate office?", a: "Yes. Swap in your own services, prices and FAQs in one file and redeploy; the chatbot, scoring and dashboard stay the same." },
];

export function Faq() {
  return (
    <section id="faq" className="mx-auto max-w-3xl scroll-mt-24 px-4 py-12 sm:px-6">
      <Reveal>
        <h2 className="text-center text-3xl font-extrabold sm:text-4xl">Questions owners ask</h2>
      </Reveal>
      <div className="mt-8 space-y-3">
        {FAQS.map((f) => (
          <Reveal key={f.q}>
            <details className="group rounded-2xl border border-line bg-surface px-5 py-4 shadow-card open:ring-1 open:ring-primary">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-heading font-bold [&::-webkit-details-marker]:hidden">
                {f.q}
                <ChevronDown className="h-5 w-5 shrink-0 text-primary transition-transform group-open:rotate-180" aria-hidden />
              </summary>
              <p className="mt-3 text-sm text-muted">{f.a}</p>
            </details>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
