import { describe, expect, it } from "vitest";
import { handleChat } from "@/lib/chat-engine";
import { getClient } from "@/lib/client";
import { buildAllowed, factCheck } from "@/lib/factcheck";
import { getScript, SCRIPT_IDS, type ScriptId } from "@/lib/scripted";
import { computeScore } from "@/lib/scoring";

async function play(id: ScriptId) {
  let sessionId: string | undefined;
  let last!: Awaited<ReturnType<typeof handleChat>>;
  const alerts: string[] = [];
  for (const turn of getScript(id).turns) {
    last = await handleChat({
      sessionId,
      message: turn.user,
      source: `scripted_${id}`,
      scripted: { userText: turn.user, response: turn.bot },
      visitorId: `test-${id}`,
      ipHash: "test",
      userAgent: null,
    });
    sessionId = last.sessionId;
    if (last.alert) alerts.push(last.alert.body);
  }
  return { last, alerts };
}

describe("scripted demos (no API key, no Supabase)", () => {
  it("script A ends HOT with score >= 85 and fires exactly one alert", async () => {
    const { last, alerts } = await play("A");
    expect(last.lead.score).toBeGreaterThanOrEqual(85);
    expect(last.lead.badge).toBe("HOT");
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toContain("Riya");
    expect(last.lead.demo_slot_requested).not.toBeNull();
    expect(last.lead.phone_valid).toBe(true);
  });
  it("script B ends WARM around 55", async () => {
    const { last } = await play("B");
    expect(last.lead.badge).toBe("WARM");
    expect(last.lead.score).toBeGreaterThanOrEqual(40);
    expect(last.lead.score).toBeLessThanOrEqual(69);
    expect(last.lead.parent_phone).toBeNull(); // hesitated, never pushed
  });
  it("script C ends COLD below 30", async () => {
    const { last } = await play("C");
    expect(last.lead.badge).toBe("COLD");
    expect(last.lead.score).toBeLessThan(30);
  });
  it("every scripted bot line passes the fact-check", () => {
    const client = getClient();
    const allowed = buildAllowed(client);
    for (const id of SCRIPT_IDS) {
      for (const t of getScript(id).turns) {
        const reply = String((t.bot as { reply: string }).reply);
        expect(factCheck(reply, client, allowed), `${id}: ${reply}`).toMatchObject({ ok: true });
      }
    }
  });
  it("scoring rules match the spec table", () => {
    const base = { phoneValid: false, classKnown: false, studentName: false, branchOrBatch: false, askedFees: false, demoInterest: false, urgency: false, budgetShared: false, offTopicOnly: false, notInterested: false };
    expect(computeScore({ ...base, phoneValid: true }).score).toBe(30);
    expect(computeScore({ ...base, notInterested: true }).score).toBe(0);
    expect(computeScore({ ...base, phoneValid: true, classKnown: true, studentName: true, branchOrBatch: true, askedFees: true, demoInterest: true, urgency: true, budgetShared: true }).score).toBe(100);
  });
});
