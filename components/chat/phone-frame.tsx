"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  text: string;
}

export function TypingDots() {
  const reduce = useReducedMotion();
  return (
    <div className="flex w-fit items-center gap-1 rounded-2xl rounded-bl-sm bg-primary-light px-4 py-3" role="status" aria-label="Assistant is typing">
      {[0, 1, 2].map((i) => (
        <m.span
          key={i}
          className="h-2 w-2 rounded-full bg-primary"
          animate={reduce ? { opacity: [0.4, 1, 0.4] } : { y: [0, -5, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

interface Props {
  botName: string;
  subtitle: string;
  offline?: boolean;
  onRestart?: () => void;
  messages: ChatMsg[];
  typing: boolean;
  chips?: string[];
  onChip?: (c: string) => void;
  footer: React.ReactNode;
  className?: string;
  height?: string;
}

/** Phone-style chat shell shared by the live chat, the scripted player and the floating bubble. */
export function PhoneFrame({ botName, subtitle, offline, onRestart, messages, typing, chips = [], onChip, footer, className, height = "h-[600px]" }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-[380px] flex-col overflow-hidden rounded-[2rem] border-[6px] border-ink/90 bg-surface shadow-card dark:border-line",
        height,
        className,
      )}
    >
      <header className="flex items-center gap-3 bg-primary px-4 py-3 text-white dark:text-slate-950">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold" aria-hidden>
          BF
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{botName}</p>
          <p className="truncate text-xs opacity-80">{subtitle}</p>
        </div>
        {offline && <Badge className="shrink-0 bg-white/20 px-2 text-[10px] text-white dark:text-slate-950">Offline demo mode</Badge>}
        {onRestart && (
          <button onClick={onRestart} aria-label="Restart chat" className="rounded-lg p-1.5 hover:bg-white/20">
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
      </header>

      <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto bg-background p-4" aria-live="polite" aria-label="Chat messages">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <m.div
              key={msg.id}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25 }}
              className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
            >
              <p
                className={cn(
                  "max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                  msg.role === "user" ? "rounded-br-sm bg-primary text-white dark:text-slate-950" : "rounded-bl-sm border border-line bg-surface",
                )}
              >
                {msg.text}
              </p>
            </m.div>
          ))}
          {typing && (
            <m.div key="typing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <TypingDots />
            </m.div>
          )}
        </AnimatePresence>
      </div>

      {chips.length > 0 && !typing && onChip && (
        <div className="flex flex-wrap gap-2 border-t border-line bg-background px-3 pt-3">
          {chips.map((c) => (
            <button
              key={c}
              onClick={() => onChip(c)}
              className="rounded-full border border-primary/40 bg-primary-light px-3 py-1.5 text-xs font-semibold text-primary transition hover:-translate-y-0.5 hover:bg-primary hover:text-white dark:hover:text-slate-950"
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {footer}
    </div>
  );
}
