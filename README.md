# Bright Future Classes — AI Admission Chatbot + Lead Capture (client demo)

A working demo you can show to coaching classes, clinics and real-estate offices: an AI chatbot that answers
**only from one data file**, captures the parent's details, **scores every lead 0–100 (HOT / WARM / COLD)** and shows it
live on an owner dashboard. The demo business, *Bright Future Classes*, is **fictional** (every page says so).

Stack: Next.js 14 (App Router) · TypeScript (strict) · Tailwind · Framer Motion · Supabase (optional) · Zod · Vitest.

## Quick start

```bash
npm install
npm run dev -- -p 3150     # http://localhost:3150
```

With **no environment variables at all** the app still works end to end: the chatbot runs in an offline,
knowledge-base mode (a badge says so), leads live in memory, and the scripted demos play normally.

| Page | What it is |
| --- | --- |
| `/` | Marketing landing page (animated hero, how it works, sample client, ₹22,500 pricing, FAQ, floating chat bubble) |
| `/demo` | Split screen: student chat on the left, live owner card on the right. Play demo A/B/C, Try live, Reset |
| `/owner` | Live lead card of the most recent (or any selected) conversation |
| `/owner/leads` | Table with search, filters, sort, status dropdown, detail drawer, **CSV export** |
| `/owner/analytics` | Leads per day, HOT/WARM/COLD split, top topics, cost per chat, conversion funnel |
| `/presenter` | Hidden 2-minute demo notes (not linked anywhere) |
| `/credits` | Photo credits |

## Contact buttons

The WhatsApp and Call buttons (navbar, footer, pricing and final call-to-action) use the number set in `lib/site.ts` (`CONTACT_PHONE_INTL`). Change it there to use a different number.

## Environment variables

Copy `.env.example` to `.env.local`. Everything is optional.

| Variable | Purpose |
| --- | --- |
| `LLM_PROVIDER` | `anthropic` (default), `openai` or `gemini` |
| `LLM_MODEL` | Model id. Empty = a small, cheap default per provider |
| `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / `GEMINI_API_KEY` | Key for the chosen provider. **No key = offline mode** (never crashes) |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Persistence + Realtime. Missing or unreachable = in-memory fallback |
| `RATE_LIMIT_PER_HOUR` | Chat messages per IP per hour (default 20) |
| `MAX_OUTPUT_TOKENS` | Cap per reply (default and maximum 400) |
| `DEMO_MODE_FORCE_SCRIPTED` | `true` = never call an LLM even if a key exists |
| `DEMO_RESET_TOKEN` | Enables `POST /api/reset-demo` (header `x-demo-reset-token`). Unset = endpoint disabled |

The LLM is only ever called from server routes. Keys never reach the browser and are never logged.

## Database (Supabase)

1. Create a free Supabase project.
2. In the SQL editor run `supabase/migrations/001_init.sql` once (8 tables, `v_daily_stats` view, Realtime on
   `leads`/`lead_events`/`alerts`, row-level security).
3. Run `supabase/seed.sql` to load **40 fictional leads** over the last 14 days (~30% HOT, 45% WARM, 25% COLD) with
   English and Hinglish transcripts and matching cost logs. Re-run it any time to refresh the dates.
4. Put the three Supabase variables in `.env.local` (or Vercel).

```bash
npm run db:seed    # regenerate supabase/seed.sql from lib/seed-data.ts
npm run db:reset   # regenerate the seed, then `supabase db reset` if the Supabase CLI is installed;
                   # otherwise it prints the manual SQL-editor steps
```

All writes go through server routes using the service-role key; the browser's anon key can only read seed rows or the
visitor's own rows. Raw IPs are never stored (SHA-256 only).

## Rebrand for a new client (about 10 minutes)

1. Edit **`config/client.json`**: business name, phone/email, branches, courses and fees, batches, demo-class slot
   rules, faculty, policies, FAQs (at least 15), counsellor name and message templates. Nothing else holds business facts.
2. Optionally swap `public/illustrations/logo.svg` and the colours in `theme` (and the matching `:root` values in `app/globals.css`).
3. `npm run validate:config` — the Zod schema in `config/schema.ts` also runs before every `npm run build`, so an invalid file fails the build.
4. Adjust `config/scripts.json` (the three scripted demos) so the fees and branches match, and run `npm test`:
   the tests fail if a scripted reply contains a fee, percentage or time that is not in `client.json`.
5. Redeploy. That is the whole change.

## How the bot stays honest

- The system prompt contains the knowledge base from `client.json` and nothing else.
- **Fact check in code:** every ₹ amount, percentage and clock time in a reply must also appear in `client.json`.
  If not, the reply is replaced with "I'll ask our counsellor to confirm" and the lead is flagged for a human.
- **The lead score is computed in code** (`lib/scoring.ts`), never by the model. Each point has a visible reason.
- Prompt-injection attempts get a fixed reply. Medical/legal/financial and off-topic questions get a polite refusal.
  "Guarantee" questions get the no-guarantee reply; asking twice flags a human.
- 20 messages/IP/hour, 30 turns/chat, 500-character input, 400-token replies, HTML stripped.

Scoring: valid parent phone +30 · class/exam +15 · student name +5 · branch or batch +10 · asked fees +10 ·
demo class +20 · urgency +10 · budget +5 · off-topic only −20 · not interested −30. HOT ≥ 70, WARM 40–69, COLD < 40.

## Tests and the 30-question eval

```bash
npm test         # 33 unit tests: scoring, fact-check, phone validation, scripted demos A/B/C, CSV, rate limit, privacy
npm run eval     # 30 questions through the real pipeline, prints a pass/fail table
```

`npm run eval` covers 10 FAQs, 5 Hinglish, 5 unknown facts, 5 off-topic, 3 prompt injections and 2 angry users. With no
API key it evaluates the offline bot; with a key it evaluates the live model. (Transport is answered in the knowledge base,
so the "unknown facts" set uses a canteen question instead.) Run it against your real model before a client demo.

## 2-minute client demo

1. Open `/demo`, press **Play demo A (HOT)**. The chat types itself in Hinglish and the owner card fills in live (about 60 s).
2. The HOT alert pops (score 90). Open `/owner/leads`, filter HOT, press **Export CSV** (about 20 s).
3. Press **Try live** and type: *Fees kitni hai aur result guarantee?* — the bot quotes the fee from the data file and refuses to guarantee results (about 30 s).
4. Close with: *"24×7 reply, aapko sirf HOT leads par call karni hai."*

The same notes are on the hidden `/presenter` page.

## Deploy to Vercel

1. Push the folder to a Git repository and import it in Vercel (framework: Next.js, no extra settings).
2. Add the environment variables above (at minimum the LLM key and the three Supabase values).
3. Deploy. For a public link, set `DEMO_RESET_TOKEN` so you can clear practice data with
   `curl -X POST https://<your-site>/api/reset-demo -H "x-demo-reset-token: <token>"`.

Do not run `npm run build` while `npm run dev` is running; it corrupts the dev cache (delete `.next` and restart if it happens).

## Privacy on a public demo

Seed leads are fake and shown in full. A real visitor's live chat is shown in full only to that visitor (cookie); anyone
else sees the phone masked and the transcript hidden. The owner pages have no login, as specified for this demo.

## Measured quality (Lighthouse, mobile profile, production build)

| Page | Performance | Accessibility | Best practices | SEO |
| --- | --- | --- | --- | --- |
| `/` | 90 | 100 | 100 | 100 |
| `/demo` | 94 | 100 | 100 | 100 |
| `/owner` | 93 | 100 | 100 | 100 |
| `/owner/leads` | 91 | 100 | 100 | 100 |
| `/owner/analytics` | 92 | 100 | 100 | 100 |

## Known limits

- No real WhatsApp sending (alerts and follow-up messages are simulated / copy-ready), no voice, no payments, no admin login.
- Live updates use ~1.5 s polling in every mode; Supabase Realtime is wired in as an extra trigger but only fires for rows the anon key may read.
- The live-LLM path needs your API key; the eval and tests above ran against the offline bot.
- Photos are Unsplash (see `public/images/CREDITS.md`); everything else is original SVG.
