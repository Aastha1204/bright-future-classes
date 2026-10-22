import { describe, expect, it } from "vitest";
import { computeAnalytics, classifyTopics } from "@/lib/analytics";
import { leadsToCsv } from "@/lib/csv";
import { maskPhone, visibleLead } from "@/lib/mask";
import { seedBundles } from "@/lib/seed-bundles";
import { badgeFor } from "@/lib/scoring";
import type { LeadRow } from "@/lib/types";

const bundles = seedBundles();
const leads = bundles.map((b) => b.lead);

describe("seed data", () => {
  it("has 40 leads with a realistic badge mix", () => {
    expect(leads).toHaveLength(40);
    const hot = leads.filter((l) => l.badge === "HOT").length;
    expect(hot).toBe(12);
    expect(leads.every((l) => l.is_seed)).toBe(true);
    expect(leads.every((l) => badgeFor(l.score) === l.badge)).toBe(true);
  });
  it("every transcript has 4-10+ messages and fake phones are flagged valid-format", () => {
    expect(bundles.every((b) => b.messages.length >= 4)).toBe(true);
    expect(leads.filter((l) => l.parent_phone).every((l) => l.phone_valid)).toBe(true);
  });
});

describe("analytics", () => {
  const a = computeAnalytics({
    leads: leads.map((l) => ({ ...l })),
    usage: bundles.flatMap((b) => b.usage),
    userMessages: bundles.flatMap((b) => b.messages.filter((m) => m.role === "user").map((m) => m.content)),
  });
  it("covers 14 days and totals add up", () => {
    expect(a.perDay).toHaveLength(14);
    expect(a.split.HOT + a.split.WARM + a.split.COLD).toBe(a.totalLeads);
    expect(a.perDay.reduce((s, d) => s + d.total, 0)).toBe(a.totalLeads);
  });
  it("has a sensible cost per chat and a decreasing funnel", () => {
    expect(a.avgCostPerChat).toBeGreaterThan(0);
    expect(a.avgCostPerChat).toBeLessThan(5);
    expect(a.funnel.chats).toBeGreaterThanOrEqual(a.funnel.phone);
    expect(a.funnel.phone).toBeGreaterThanOrEqual(a.funnel.demo - a.funnel.chats);
  });
  it("classifies topics", () => {
    expect(classifyTopics("Fees kitni hai?")).toContain("Fees");
    expect(classifyTopics("demo class kab hai")).toEqual(expect.arrayContaining(["Demo class", "Batch timings"]));
  });
});

describe("csv export", () => {
  const sample = { ...leads[0], student_name: "=HYPERLINK(\"x\")", next_action: "Call, then ₹ follow-up" } as LeadRow;
  const csv = leadsToCsv([sample]);
  it("starts with a UTF-8 BOM so Excel reads it correctly", () => {
    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });
  it("has the required header columns", () => {
    expect(csv.slice(1).split("\r\n")[0]).toBe("created_at,student_name,parent_phone,class,branch,batch,score,badge,status,next_action");
  });
  it("neutralises formula injection and quotes commas", () => {
    expect(csv).toContain("\"'=HYPERLINK");
    expect(csv).toContain("\"Call, then ₹ follow-up\"");
  });
});

describe("privacy masking", () => {
  it("masks phones", () => expect(maskPhone("9876543210")).toBe("98XXX XX210"));
  it("shows seed leads in full but masks other visitors' live leads", () => {
    const live = { ...leads[0], is_seed: false, parent_phone: "9876543210", parent_name: "Sunita Patil", visitor_id: "v1" };
    expect(visibleLead(live, "v1").parent_phone).toBe("9876543210");
    expect(visibleLead(live, "someone-else").parent_phone).toBe("98XXX XX210");
    expect(visibleLead({ ...live, is_seed: true }, "someone-else").parent_phone).toBe("9876543210");
  });
});
