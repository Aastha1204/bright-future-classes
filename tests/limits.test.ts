import { describe, expect, it } from "vitest";
import { handleChat } from "@/lib/chat-engine";
import { MAX_INPUT_CHARS, MAX_TURNS, sanitizeInput } from "@/lib/guardrails";
import { checkRateLimit, hashIp } from "@/lib/ratelimit";
import { costInr } from "@/lib/pricing";

describe("rate limit", () => {
  it("allows 20 messages per IP per hour and blocks the 21st", async () => {
    const ip = hashIp("203.0.113.7");
    const results: boolean[] = [];
    for (let i = 0; i < 22; i++) results.push((await checkRateLimit(ip)).allowed);
    expect(results.slice(0, 20).every(Boolean)).toBe(true);
    expect(results[20]).toBe(false);
    expect(results[21]).toBe(false);
  });
  it("tracks each IP separately and never stores the raw IP", async () => {
    const a = hashIp("198.51.100.1");
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).not.toContain("198");
    expect((await checkRateLimit(hashIp("198.51.100.2"))).count).toBe(1);
  });
});

describe("input limits", () => {
  it("strips HTML and clamps to 500 characters", () => {
    expect(sanitizeInput("<script>alert(1)</script>Hello <b>there</b>")).toBe("alert(1) Hello there");
    expect(sanitizeInput("x".repeat(2000))).toHaveLength(MAX_INPUT_CHARS);
  });
  it("caps a conversation at 30 user turns", async () => {
    let sessionId: string | undefined;
    let last!: Awaited<ReturnType<typeof handleChat>>;
    for (let i = 0; i < MAX_TURNS + 2; i++) {
      last = await handleChat({ sessionId, message: "fees?", source: "demo_page", visitorId: "cap-test", ipHash: "cap", userAgent: null });
      sessionId = last.sessionId;
    }
    expect(last.capped).toBe(true);
  });
});

describe("cost logging", () => {
  it("computes a rupee cost from tokens", () => {
    const c = costInr("claude-haiku-5-5", 800, 100);
    expect(c).toBeGreaterThan(0);
    expect(c).toBeLessThan(1);
  });
});
