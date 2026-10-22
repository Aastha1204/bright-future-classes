"use client";

import { useCallback, useRef, useState } from "react";
import { Send } from "lucide-react";
import type { ChatOutput } from "@/lib/chat-engine";
import { PhoneFrame, type ChatMsg } from "./phone-frame";

export type { ChatMsg };

export type ChatUpdate = Pick<ChatOutput, "sessionId" | "lead" | "changed" | "cost_chat_inr" | "alert" | "needs_human"> & {
  mode: "live" | "offline";
};

interface Props {
  source: "landing_bubble" | "demo_page";
  botName: string;
  welcome: string;
  onUpdate?: (u: ChatUpdate) => void;
  onReset?: () => void;
  className?: string;
  height?: string;
}

const MAX = 500;
const DEFAULT_CHIPS = ["Fees kitni hai?", "Free demo class", "Branches", "Batch timings"];
let counter = 0;
const nid = () => `m${++counter}-${Date.now()}`;

export function ChatPanel({ source, botName, welcome, onUpdate, onReset, className, height }: Props) {
  const [messages, setMessages] = useState<ChatMsg[]>([{ id: "welcome", role: "assistant", text: welcome }]);
  const [chips, setChips] = useState<string[]>(DEFAULT_CHIPS);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [offline, setOffline] = useState(false);
  const [limited, setLimited] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim().slice(0, MAX);
      if (!text || typing) return;
      setInput("");
      setChips([]);
      setMessages((m) => [...m, { id: nid(), role: "user", text }]);
      setTyping(true);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ sessionId, message: text, source }),
        });
        const data = await res.json();
        if (res.status === 429) setLimited(true);
        // brief pause so the typing indicator is visible even on fast replies
        await new Promise((r) => setTimeout(r, 500));
        setMessages((m) => [...m, { id: nid(), role: "assistant", text: data.reply ?? "Ek second, main counsellor se confirm karke batati hoon." }]);
        setChips(data.quick_replies ?? []);
        if (data.sessionId) setSessionId(data.sessionId);
        if (data.mode) setOffline(data.mode === "offline");
        if (data.lead) onUpdate?.(data as ChatUpdate);
      } catch {
        setOffline(true);
        setMessages((m) => [...m, { id: nid(), role: "assistant", text: "Connection issue — please try again, or use the scripted demo buttons." }]);
      } finally {
        setTyping(false);
        inputRef.current?.focus();
      }
    },
    [sessionId, source, typing, onUpdate],
  );

  const reset = () => {
    setMessages([{ id: "welcome", role: "assistant", text: welcome }]);
    setChips(DEFAULT_CHIPS);
    setSessionId(undefined);
    setLimited(false);
    onReset?.();
  };

  return (
    <PhoneFrame
      className={className}
      height={height}
      botName={botName}
      subtitle={offline ? "Knowledge-base replies" : "Online · replies instantly"}
      offline={offline}
      onRestart={reset}
      messages={messages}
      typing={typing}
      chips={chips}
      onChip={send}
      footer={
        <form
          className="flex items-center gap-2 bg-background p-3"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={MAX}
            disabled={limited}
            aria-label="Type your message"
            placeholder={limited ? "Demo limit reached" : "Type a message…"}
            className="h-10 min-w-0 flex-1 rounded-full border border-line bg-surface px-4 text-sm placeholder:text-muted focus-visible:ring-2 focus-visible:ring-primary"
          />
          <button
            type="submit"
            aria-label="Send message"
            disabled={!input.trim() || typing || limited}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white transition hover:brightness-110 disabled:opacity-40 dark:text-slate-950"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      }
    />
  );
}
