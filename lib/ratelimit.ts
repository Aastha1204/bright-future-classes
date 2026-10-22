import { createHash } from "node:crypto";
import { hitRateLimit } from "./store";

export function limitPerHour(): number {
  const n = Number(process.env.RATE_LIMIT_PER_HOUR);
  return Number.isFinite(n) && n > 0 ? n : 20;
}

/** SHA-256 of the IP with a salt. The raw IP is never stored. */
export function hashIp(ip: string): string {
  return createHash("sha256").update(`bf-demo:${ip}`).digest("hex");
}

export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "0.0.0.0";
}

export async function checkRateLimit(ipHash: string) {
  const limit = limitPerHour();
  const { allowed, count } = await hitRateLimit(ipHash, limit);
  return { allowed, count, limit };
}
