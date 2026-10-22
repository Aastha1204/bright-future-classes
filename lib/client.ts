import raw from "@/config/client.json";
import { ClientSchema, type Client } from "@/config/schema";
import { slotLabel } from "./slot";

let cached: Client | null = null;

/** Validated business config. Throws if config/client.json is invalid. */
export function getClient(): Client {
  if (!cached) cached = ClientSchema.parse(raw);
  return cached;
}

export interface DemoSlot {
  iso: string;
  label: string;
}

const IST_OFFSET_MIN = 330;
export { slotLabel };

/** Next demo-class slots (IST) generated from the rules in client.json. */
export function getDemoSlots(from: Date = new Date()): DemoSlot[] {
  const { slot_rules, days_ahead } = getClient().demo_class;
  const ist = new Date(from.getTime() + IST_OFFSET_MIN * 60000);
  const out: DemoSlot[] = [];
  for (let i = 0; i <= days_ahead; i++) {
    const day = new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate() + i));
    for (const r of slot_rules) {
      if (day.getUTCDay() !== r.weekday) continue;
      const [h, m] = r.time.split(":").map(Number);
      const slot = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), h, m) - IST_OFFSET_MIN * 60000);
      if (slot.getTime() <= from.getTime()) continue;
      const date = day.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
      out.push({ iso: slot.toISOString(), label: `${slotLabel(slot.toISOString())} (${date})` });
    }
  }
  return out.sort((a, b) => a.iso.localeCompare(b.iso));
}
