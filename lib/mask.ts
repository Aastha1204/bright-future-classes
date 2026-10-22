import type { LeadRow } from "./types";

/** "9876543210" -> "98XXX XX210" */
export function maskPhone(p: string | null): string | null {
  if (!p) return p;
  const d = p.replace(/\D/g, "").slice(-10);
  return d.length === 10 ? `${d.slice(0, 2)}XXX XX${d.slice(7)}` : "XXXXX XXXXX";
}

/**
 * Privacy for the public demo: real visitors' contact details are only shown in full to the
 * visitor who created them. Seed (fake) leads are always shown in full.
 */
export function visibleLead<T extends LeadRow & { visitor_id?: string }>(lead: T, viewerId: string | null): Omit<T, "visitor_id"> {
  const { visitor_id, ...rest } = lead;
  const own = !!viewerId && visitor_id === viewerId;
  if (lead.is_seed || own) return rest;
  return {
    ...rest,
    parent_phone: maskPhone(lead.parent_phone),
    parent_name: lead.parent_name ? `${lead.parent_name[0]}…` : null,
  } as Omit<T, "visitor_id">;
}
