/** Single adapter for all LLM providers. Server-only: keys never reach the browser. */

export type Provider = "anthropic" | "openai" | "gemini";

export interface LlmMessage {
  role: "user" | "assistant";
  content: string;
}

export interface LlmResult {
  text: string;
  tokensIn: number;
  tokensOut: number;
  model: string;
  provider: Provider;
}

const DEFAULT_MODEL: Record<Provider, string> = {
  anthropic: "claude-haiku-5-5",
  openai: "gpt-4o-mini",
  gemini: "gemini-2.0-flash",
};

const KEY_ENV: Record<Provider, string> = {
  anthropic: "ANTHROPIC_API_KEY",
  openai: "OPENAI_API_KEY",
  gemini: "GEMINI_API_KEY",
};

export function getProvider(): Provider {
  const p = (process.env.LLM_PROVIDER ?? "anthropic").toLowerCase();
  return p === "openai" || p === "gemini" ? p : "anthropic";
}

export function getModel(): string {
  return process.env.LLM_MODEL || DEFAULT_MODEL[getProvider()];
}

export function maxOutputTokens(): number {
  const n = Number(process.env.MAX_OUTPUT_TOKENS);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 400) : 400;
}

/** False => the app runs in offline/scripted mode and never calls an LLM. */
export function llmConfigured(): boolean {
  if (process.env.DEMO_MODE_FORCE_SCRIPTED === "true") return false;
  return Boolean(process.env[KEY_ENV[getProvider()]]);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function post(url: string, headers: Record<string, string>, body: unknown): Promise<Record<string, any>> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20_000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`LLM HTTP ${res.status}`); // never include headers/keys in errors
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function callLlm(system: string, messages: LlmMessage[], maxTokens = maxOutputTokens()): Promise<LlmResult> {
  const provider = getProvider();
  const model = getModel();
  const key = process.env[KEY_ENV[provider]]!;

  if (provider === "anthropic") {
    // Prefill "{" so the model continues straight into the JSON object.
    const data = await post(
      "https://api.anthropic.com/v1/messages",
      { "x-api-key": key, "anthropic-version": "2023-06-01" },
      { model, max_tokens: maxTokens, system, messages: [...messages, { role: "assistant", content: "{" }] },
    );
    const text = "{" + (data.content?.[0]?.text ?? "");
    return { text, tokensIn: data.usage?.input_tokens ?? 0, tokensOut: data.usage?.output_tokens ?? 0, model, provider };
  }

  if (provider === "openai") {
    const data = await post(
      "https://api.openai.com/v1/chat/completions",
      { authorization: `Bearer ${key}` },
      {
        model,
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
        messages: [{ role: "system", content: system }, ...messages],
      },
    );
    return {
      text: data.choices?.[0]?.message?.content ?? "",
      tokensIn: data.usage?.prompt_tokens ?? 0,
      tokensOut: data.usage?.completion_tokens ?? 0,
      model,
      provider,
    };
  }

  const data = await post(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    { "x-goog-api-key": key },
    {
      systemInstruction: { parts: [{ text: system }] },
      contents: messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
      generationConfig: { maxOutputTokens: maxTokens, responseMimeType: "application/json" },
    },
  );
  return {
    text: data.candidates?.[0]?.content?.parts?.[0]?.text ?? "",
    tokensIn: data.usageMetadata?.promptTokenCount ?? 0,
    tokensOut: data.usageMetadata?.candidatesTokenCount ?? 0,
    model,
    provider,
  };
}

/** Pull the first JSON object out of model text (tolerates code fences / chatter). */
export function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("no JSON object in model output");
  return JSON.parse(text.slice(start, end + 1));
}
