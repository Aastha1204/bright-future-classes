const IST_OFFSET_MIN = 330;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** "Thu 5 pm" in IST for an ISO timestamp. Pure, safe to import in the browser. */
export function slotLabel(iso: string): string {
  const d = new Date(new Date(iso).getTime() + IST_OFFSET_MIN * 60000);
  const h = d.getUTCHours();
  const m = d.getUTCMinutes();
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${WEEKDAYS[d.getUTCDay()]} ${h12}${m ? `:${String(m).padStart(2, "0")}` : ""} ${h >= 12 ? "pm" : "am"}`;
}
