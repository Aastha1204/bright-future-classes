"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMsg } from "@/components/chat/phone-frame";
import { localLeadAfter } from "@/lib/scripted-local";
import { getScript, type ScriptId } from "@/lib/scripted";
import type { LeadRow } from "@/lib/types";

export type PlayerStatus = "idle" | "playing" | "paused" | "done";

export interface PlayerUpdate {
  lead: LeadRow;
  alert: { body: string } | null;
}

const CANCEL = Symbol("cancel");
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const between = (a: number, b: number) => a + Math.random() * (b - a);
let n = 0;

/**
 * Replays a scripted conversation with realistic delays (user 0.8-1.5 s, bot typing 1-2 s).
 * Each turn goes through /api/scripted (same pipeline as live); if the server can't be reached it
 * falls back to a pure in-browser replay, so the demo never dies.
 */
export function useScriptPlayer(onUpdate: (u: PlayerUpdate) => void) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [typing, setTyping] = useState(false);
  const [status, setStatus] = useState<PlayerStatus>("idle");
  const [scriptId, setScriptId] = useState<ScriptId | null>(null);
  const [speed, setSpeedState] = useState<1 | 2>(1);
  const [localFallback, setLocalFallback] = useState(false);

  const run = useRef(0);
  const paused = useRef(false);
  const speedRef = useRef<1 | 2>(1);
  const cb = useRef(onUpdate);
  cb.current = onUpdate;

  const sleep = useCallback(async (ms: number, id: number) => {
    let left = ms;
    while (left > 0) {
      if (run.current !== id) throw CANCEL;
      await wait(50);
      if (!paused.current) left -= 50 * speedRef.current;
    }
    if (run.current !== id) throw CANCEL;
  }, []);

  const stop = useCallback(() => {
    run.current++;
    paused.current = false;
    setTyping(false);
    setStatus("idle");
  }, []);

  const play = useCallback(
    async (id: ScriptId) => {
      const myRun = ++run.current;
      paused.current = false;
      setScriptId(id);
      setMessages([]);
      setTyping(false);
      setLocalFallback(false);
      setStatus("playing");
      const script = getScript(id);
      let sessionId: string | undefined;
      let prevBadge: "HOT" | "WARM" | "COLD" | null = null;
      let useLocal = false;
      try {
        for (let step = 0; step < script.turns.length; step++) {
          const turn = script.turns[step];
          await sleep(between(800, 1500), myRun);
          setMessages((m) => [...m, { id: `s${++n}`, role: "user", text: turn.user }]);
          setTyping(true);
          const started = Date.now();

          let reply = String((turn.bot as { reply: string }).reply);
          let lead: LeadRow | null = null;
          let alert: { body: string } | null = null;
          if (!useLocal) {
            try {
              const res = await fetch("/api/scripted", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ script: id, step, sessionId }),
              });
              if (!res.ok) throw new Error(String(res.status));
              const data = await res.json();
              sessionId = data.sessionId;
              lead = data.lead;
              alert = data.alert;
              reply = data.reply ?? reply;
            } catch {
              useLocal = true;
              setLocalFallback(true);
            }
          }
          if (useLocal) {
            const l = localLeadAfter(id, step, prevBadge);
            lead = l.lead;
            alert = l.alert;
          }
          // typing indicator for 1-2 s in total, counted from when the user message appeared
          const spent = (Date.now() - started) * speedRef.current;
          await sleep(Math.max(0, between(1000, 2000) - spent), myRun);
          setTyping(false);
          setMessages((m) => [...m, { id: `s${++n}`, role: "assistant", text: reply }]);
          if (lead) {
            prevBadge = lead.badge;
            cb.current({ lead, alert });
          }
        }
        if (run.current === myRun) setStatus("done");
      } catch (e) {
        if (e !== CANCEL) throw e;
      }
    },
    [sleep],
  );

  const pause = useCallback(() => {
    paused.current = true;
    setStatus((s) => (s === "playing" ? "paused" : s));
  }, []);
  const resume = useCallback(() => {
    paused.current = false;
    setStatus((s) => (s === "paused" ? "playing" : s));
  }, []);
  const restart = useCallback(() => {
    if (scriptId) void play(scriptId);
  }, [play, scriptId]);
  const setSpeed = useCallback((s: 1 | 2) => {
    speedRef.current = s;
    setSpeedState(s);
  }, []);

  useEffect(() => () => void run.current++, []);

  return { messages, typing, status, scriptId, speed, localFallback, play, pause, resume, restart, stop, setSpeed };
}
