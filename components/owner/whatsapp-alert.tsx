"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { Volume2, VolumeX, X } from "lucide-react";

export interface AlertData {
  id: string;
  body: string;
}

const KEY = "bf_alert_sound";

function readSound(): boolean {
  try {
    return localStorage.getItem(KEY) === "on";
  } catch {
    return false;
  }
}

/** Short two-note "ding" via WebAudio. Silent unless the viewer turned sound on. */
function ding() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    [880, 1318].forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.12);
      g.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + i * 0.12 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.12 + 0.35);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + i * 0.12);
      o.stop(ctx.currentTime + i * 0.12 + 0.4);
    });
    setTimeout(() => ctx.close(), 900);
  } catch {
    /* audio unavailable: ignore */
  }
}

export function SoundToggle() {
  const [on, setOn] = useState(false);
  useEffect(() => setOn(readSound()), []);
  return (
    <button
      type="button"
      onClick={() => {
        const next = !on;
        setOn(next);
        try {
          localStorage.setItem(KEY, next ? "on" : "off");
        } catch {
          /* ignore */
        }
        if (next) ding();
      }}
      role="switch"
      aria-checked={on}
      className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-muted hover:text-ink"
    >
      {on ? <Volume2 className="h-3.5 w-3.5" aria-hidden /> : <VolumeX className="h-3.5 w-3.5" aria-hidden />}
      Alert sound
      <span className="font-semibold">{on ? "on" : "off"}</span>
    </button>
  );
}

/** WhatsApp-style simulated notification: slides in top-right, auto-hides after 6 s. */
export function WhatsAppAlert({ alert }: { alert: AlertData | null }) {
  const [current, setCurrent] = useState<AlertData | null>(null);
  const lastId = useRef<string | null>(null);

  const hide = useCallback(() => setCurrent(null), []);

  useEffect(() => {
    if (!alert || alert.id === lastId.current) return;
    lastId.current = alert.id;
    setCurrent(alert);
    if (readSound()) ding();
    const t = setTimeout(hide, 6000);
    return () => clearTimeout(t);
  }, [alert, hide]);

  const time = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="pointer-events-none fixed right-4 top-20 z-50 w-[min(22rem,calc(100vw-2rem))]" aria-live="assertive">
      <AnimatePresence>
        {current && (
          <m.div
            key={current.id}
            initial={{ opacity: 0, x: 80, y: -12 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 80 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="pointer-events-auto overflow-hidden rounded-2xl border border-line bg-surface shadow-card"
          >
            <div className="flex items-center gap-2 bg-[#128C7E] px-3 py-2 text-white">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/25 text-[10px] font-bold">BF</span>
              <span className="flex-1 text-sm font-semibold">Bright Future Bot</span>
              <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">Simulation</span>
              <button onClick={hide} aria-label="Dismiss alert" className="rounded p-0.5 hover:bg-white/20">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-3 py-3">
              <p className="text-sm font-medium">{current.body}</p>
              <p className="mt-1 text-right text-[11px] text-muted">{time} ✓✓</p>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
