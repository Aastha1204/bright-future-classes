"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getBrowserClient } from "@/lib/supabase-browser";

/**
 * Fetches `url` repeatedly and returns the latest JSON.
 * - Polls every `intervalMs` while the tab is visible (this is what gives the ~1 s owner updates
 *   in every mode, including the in-memory fallback).
 * - When Supabase is configured it also subscribes to Realtime changes on `leads` and refetches
 *   immediately on any change.
 */
export function useLive<T>(url: string | null, intervalMs = 1500, realtime = true) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const urlRef = useRef(url);
  urlRef.current = url;

  const load = useCallback(async () => {
    const u = urlRef.current;
    if (!u) return;
    try {
      const res = await fetch(u, { cache: "no-store" });
      if (res.ok) setData((await res.json()) as T);
    } catch {
      /* keep the last good data */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    load();
  }, [url, load]);

  useEffect(() => {
    if (!url) return;
    const tick = () => {
      if (document.visibilityState === "visible") load();
    };
    const timer = setInterval(tick, intervalMs);
    return () => clearInterval(timer);
  }, [url, intervalMs, load]);

  useEffect(() => {
    if (!realtime) return;
    const sb = getBrowserClient();
    if (!sb) return;
    const ch = sb
      .channel(`leads-live-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => load())
      .subscribe();
    return () => {
      sb.removeChannel(ch);
    };
  }, [realtime, load]);

  return { data, loading, reload: load };
}
