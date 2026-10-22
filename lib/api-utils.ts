import type { NextRequest } from "next/server";
import type { LeadFilters } from "./leads-store";

export const VISITOR_COOKIE = "bf_visitor";

export function viewerId(req: NextRequest): string | null {
  return req.cookies.get(VISITOR_COOKIE)?.value ?? null;
}

const BADGES = ["HOT", "WARM", "COLD"] as const;

export function parseFilters(sp: URLSearchParams): LeadFilters {
  const badge = sp.get("badge");
  const date = (k: string) => {
    const v = sp.get(k);
    return v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined;
  };
  return {
    search: sp.get("search")?.slice(0, 80) || undefined,
    badge: (BADGES as readonly string[]).includes(badge ?? "") ? (badge as LeadFilters["badge"]) : undefined,
    cls: sp.get("cls") || undefined,
    branch: sp.get("branch") || undefined,
    source: sp.get("source") || undefined,
    from: date("from"),
    to: date("to"),
    sort: sp.get("sort") === "score" ? "score" : sp.get("sort") === "updated" ? "updated" : "date",
    dir: sp.get("dir") === "asc" ? "asc" : "desc",
    page: Number(sp.get("page")) || 1,
    pageSize: Number(sp.get("pageSize")) || 20,
  };
}
