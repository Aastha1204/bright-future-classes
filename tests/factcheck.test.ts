import { describe, expect, it } from "vitest";
import { getClient } from "@/lib/client";
import { buildAllowed, extractAmounts, extractTimes, factCheck } from "@/lib/factcheck";
import { offlineReply } from "@/lib/offline-bot";
import { isValidIndianPhone } from "@/lib/scoring";

const client = getClient();
const allowed = buildAllowed(client);

describe("fact-check", () => {
  it("accepts fees that exist in client.json", () => {
    expect(factCheck("Class 9 is ₹52,000 per year in 3 instalments.", client, allowed).ok).toBe(true);
  });
  it("catches an invented ₹ amount", () => {
    const r = factCheck("Class 9 is ₹45,000 per year.", client, allowed);
    expect(r.ok).toBe(false);
    expect(r.violations[0]).toContain("45000");
  });
  it("catches an invented discount percentage", () => {
    expect(factCheck("I can give you a 50% discount.", client, allowed).ok).toBe(false);
    expect(factCheck("Sibling discount is 5%.", client, allowed).ok).toBe(true);
  });
  it("catches an invented time but allows configured ones", () => {
    expect(factCheck("Demo is at 4 pm.", client, allowed).ok).toBe(false);
    expect(factCheck("Evening batch is 6–8 pm; demo Thu 5 pm.", client, allowed).ok).toBe(true);
  });
  it("parses amounts and ranges", () => {
    expect(extractAmounts("Rs. 1,200 and ₹38,000")).toEqual([1200, 38000]);
    expect(extractTimes("7–9 am")).toEqual(["7 am", "9 am"]);
  });
});

describe("phone validation", () => {
  it("accepts Indian mobiles and rejects junk", () => {
    expect(isValidIndianPhone("9876543210")).toBe(true);
    expect(isValidIndianPhone("+91 98765 43210")).toBe(true);
    expect(isValidIndianPhone("12345")).toBe(false);
    expect(isValidIndianPhone("5876543210")).toBe(false);
  });
});

describe("offline bot only states configured facts", () => {
  const prompts = [
    "Fees kitni hai Class 10 ki?",
    "What are the fees for JEE?",
    "Installment mein de sakte hai?",
    "Demo class kab hai?",
    "Where is the Andheri branch?",
    "Is there a Sunday batch?",
    "hi",
  ];
  for (const p of prompts) {
    it(`"${p}" passes the fact-check`, () => {
      const r = offlineReply(p, { lead: null, history: [] });
      expect(factCheck(r.reply, client, allowed).ok).toBe(true);
    });
  }
});
