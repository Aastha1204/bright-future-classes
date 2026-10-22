import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Presenter notes", robots: { index: false, follow: false } };

const STEPS = [
  { t: "0:00 – 1:00", h: "Play demo A", d: "Open /demo and press “Play demo A (HOT)”. The chat types itself in Hinglish while the owner card fills in live: class, branch, fees, instalments, then the Thu 5 pm demo and the phone number.", say: "Parent ne sirf 5 sawaal poochhe — aur aapko naam, class, branch aur number mil gaya." },
  { t: "1:00 – 1:20", h: "HOT alert, then CSV", d: "The HOT alert pops (score 90, HOT). Open /owner/leads, filter HOT, and press Export CSV. It opens in Excel with the next action for each lead.", say: "Sirf HOT leads par call karni hai. Baaki ke liye follow-up message ready hai." },
  { t: "1:20 – 1:50", h: "Try live", d: "Press “Try live” and type: Fees kitni hai aur result guarantee? The bot gives the fee from the data file and refuses to guarantee results.", say: "Bot kabhi galat fees ya guarantee nahi dega — sab aapke data se hai." },
  { t: "1:50 – 2:00", h: "Close", d: "Show the pricing card (₹22,500) and the Book button.", say: "24×7 reply, aapko sirf HOT leads par call karni hai." },
];

export default function Presenter() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-wide text-muted">Hidden page · not linked in the navigation</p>
      <h1 className="mt-2 text-3xl font-extrabold">2-minute client demo</h1>
      <ol className="mt-8 space-y-5">
        {STEPS.map((s, i) => (
          <li key={s.h} className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <p className="text-xs font-bold text-primary">
              {i + 1}. {s.t}
            </p>
            <h2 className="mt-1 font-heading text-lg font-bold">{s.h}</h2>
            <p className="mt-1 text-sm text-muted">{s.d}</p>
            <p className="mt-3 rounded-lg bg-primary-light px-3 py-2 text-sm italic">&ldquo;{s.say}&rdquo;</p>
          </li>
        ))}
      </ol>
      <div className="mt-8 flex flex-wrap gap-3 text-sm font-semibold">
        <Link className="text-primary underline underline-offset-4" href="/demo?play=A">Start demo A</Link>
        <Link className="text-primary underline underline-offset-4" href="/owner/leads">Leads</Link>
        <Link className="text-primary underline underline-offset-4" href="/demo">Try live</Link>
      </div>
      <h2 className="mt-10 font-heading text-lg font-bold">If something goes wrong</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
        <li>No internet or AI key: the scripted demos and the knowledge-base bot still work.</li>
        <li>Messy data from earlier practice runs: POST /api/reset-demo with your reset token.</li>
        <li>Chat rate limit hit (20 messages/hour): use Play demo A / B / C.</li>
      </ul>
    </section>
  );
}
