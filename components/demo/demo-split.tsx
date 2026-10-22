"use client";

import { useEffect, useState } from "react";
import { Flame, MessageCircle, Pause, Play, RotateCcw, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatPanel, type ChatUpdate } from "@/components/chat/chat-panel";
import { PhoneFrame } from "@/components/chat/phone-frame";
import { LeadCard, type CardConfig } from "@/components/owner/lead-card";
import { WhatsAppAlert, type AlertData } from "@/components/owner/whatsapp-alert";
import { Button } from "@/components/ui/button";
import type { ScriptId } from "@/lib/scripted";
import type { LeadRow } from "@/lib/types";
import { useScriptPlayer, type PlayerUpdate } from "./use-script-player";

interface Props {
  botName: string;
  welcome: string;
  config: CardConfig;
  initialPlay?: ScriptId;
}

const SCRIPT_BTNS: { id: ScriptId; label: string; tone: string }[] = [
  { id: "A", label: "Play demo A (HOT)", tone: "border-hot/50 text-red-700 hover:bg-hot/10 dark:text-red-300" },
  { id: "B", label: "Play demo B (WARM)", tone: "border-warm/60 text-amber-800 hover:bg-warm/10 dark:text-amber-300" },
  { id: "C", label: "Play demo C (COLD)", tone: "border-cold/60 text-slate-700 hover:bg-cold/10 dark:text-slate-300" },
];

/** Split screen: student chat (left) and live owner card (right). Tabs on mobile. */
export function DemoSplit({ botName, welcome, config, initialPlay }: Props) {
  const [lead, setLead] = useState<LeadRow | null>(null);
  const [alert, setAlert] = useState<AlertData | null>(null);
  const [tab, setTab] = useState<"chat" | "owner">("chat");
  const [mode, setMode] = useState<"live" | "script">(initialPlay ? "script" : "live");
  const [chatKey, setChatKey] = useState(0);

  const push = (l: LeadRow, a: { body: string } | null) => {
    setLead(l);
    if (a) setAlert({ id: `${l.id}-${Date.now()}`, body: a.body });
  };
  const onLive = (u: ChatUpdate) => push(u.lead, u.alert);
  const onScript = (u: PlayerUpdate) => push(u.lead, u.alert);
  const player = useScriptPlayer(onScript);

  const start = (id: ScriptId) => {
    setLead(null);
    setAlert(null);
    setMode("script");
    setTab("chat");
    void player.play(id);
  };

  useEffect(() => {
    if (!initialPlay) return;
    const t = setTimeout(() => start(initialPlay), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPlay]);

  const tryLive = () => {
    player.stop();
    setMode("live");
    setLead(null);
    setAlert(null);
    setChatKey((k) => k + 1);
    setTab("chat");
  };

  const reset = () => {
    player.stop();
    setLead(null);
    setAlert(null);
    setMode("live");
    setChatKey((k) => k + 1);
  };

  const playing = player.status === "playing";
  const paused = player.status === "paused";

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <WhatsAppAlert alert={alert} />
      <div className="mb-4">
        <h1 className="text-2xl font-extrabold">Live demo</h1>
        <p className="text-sm text-muted">Chat as a parent on the left. Watch the owner&apos;s lead card fill in on the right.</p>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2" role="group" aria-label="Demo controls">
        {SCRIPT_BTNS.map((b) => (
          <button
            key={b.id}
            onClick={() => start(b.id)}
            className={cn("inline-flex h-10 items-center gap-2 rounded-xl border bg-surface px-3.5 text-sm font-semibold transition hover:-translate-y-0.5", b.tone, mode === "script" && player.scriptId === b.id && "ring-2 ring-current")}
          >
            {b.id === "A" ? <Flame className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {b.label}
          </button>
        ))}
        {mode === "script" && (
          <>
            <Button variant="outline" onClick={() => (paused ? player.resume() : player.pause())} disabled={!playing && !paused}>
              {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />} {paused ? "Resume" : "Pause"}
            </Button>
            <Button variant="outline" onClick={player.restart} disabled={!player.scriptId}>
              <RefreshCw className="h-4 w-4" /> Restart
            </Button>
            <div role="group" aria-label="Playback speed" className="inline-flex overflow-hidden rounded-xl border border-line">
              {([1, 2] as const).map((s) => (
                <button key={s} onClick={() => player.setSpeed(s)} aria-pressed={player.speed === s} className={cn("h-10 px-3 text-sm font-semibold", player.speed === s ? "bg-primary text-white dark:text-slate-950" : "bg-surface text-muted hover:text-ink")}>
                  {s}×
                </button>
              ))}
            </div>
          </>
        )}
        <Button variant="accent" onClick={tryLive}>
          <MessageCircle className="h-4 w-4" /> Try live
        </Button>
        <Button variant="ghost" onClick={reset}>
          <RotateCcw className="h-4 w-4" /> Reset
        </Button>
      </div>

      <div role="tablist" aria-label="Demo view" className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-primary-light p-1 lg:hidden">
        {(
          [
            ["chat", "Student chat"],
            ["owner", "Owner view"],
          ] as const
        ).map(([k, label]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cn("rounded-lg px-3 py-2 text-sm font-semibold transition", tab === k ? "bg-surface text-primary shadow-card" : "text-muted")}>
            {label}
            {k === "owner" && lead && tab !== "owner" && <span className="ml-1.5 inline-block h-2 w-2 rounded-full bg-hot align-middle" aria-label="new activity" />}
          </button>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[400px_1fr]">
        <div className={cn(tab === "chat" ? "block" : "hidden", "lg:block")}>
          {mode === "live" ? (
            <ChatPanel key={chatKey} source="demo_page" botName={botName} welcome={welcome} onUpdate={onLive} onReset={() => setLead(null)} />
          ) : (
            <PhoneFrame
              botName={botName}
              subtitle={player.scriptId ? `Scripted demo ${player.scriptId}` : "Scripted demo"}
              offline={player.localFallback}
              messages={player.messages}
              typing={player.typing}
              footer={
                <div className="flex items-center justify-between gap-2 bg-background px-4 py-3 text-xs text-muted" role="status">
                  <span>
                    {player.status === "playing" && "Playing…"}
                    {player.status === "paused" && "Paused"}
                    {player.status === "done" && "Demo finished"}
                    {player.status === "idle" && "Press a Play button"}
                  </span>
                  <button onClick={tryLive} className="font-semibold text-primary underline-offset-4 hover:underline">
                    Type your own →
                  </button>
                </div>
              }
            />
          )}
        </div>
        <div className={cn(tab === "owner" ? "block" : "hidden", "lg:block")}>
          <LeadCard lead={lead} config={config} />
        </div>
      </div>
    </section>
  );
}
