/** Editable per-model rates, in USD per 1M tokens. Update when your provider changes prices. */
export const USD_TO_INR = 84;

export const RATES_USD_PER_MTOK: Record<string, { in: number; out: number }> = {
  "claude-haiku-5-5": { in: 1, out: 5 },
  "claude-sonnet-5-5": { in: 3, out: 15 },
  "gpt-4o-mini": { in: 0.15, out: 0.6 },
  "gemini-2.0-flash": { in: 0.1, out: 0.4 },
  default: { in: 1, out: 5 },
};

export function costInr(model: string, tokensIn: number, tokensOut: number): number {
  const r = RATES_USD_PER_MTOK[model] ?? RATES_USD_PER_MTOK.default;
  const usd = (tokensIn * r.in + tokensOut * r.out) / 1_000_000;
  return Math.round(usd * USD_TO_INR * 10000) / 10000;
}
