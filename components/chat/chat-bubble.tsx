"use client";

import { useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import { ChatPanel } from "./chat-panel";

/** Floating bottom-right chat launcher that opens the same chatbot (source: landing_bubble). */
export function ChatBubble({ botName, welcome }: { botName: string; welcome: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      <AnimatePresence>
        {open && (
          <m.div
            id="chat-bubble-panel"
            role="dialog"
            aria-label="Chat with the admission assistant"
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="w-[min(380px,calc(100vw-2rem))]"
          >
            <ChatPanel source="landing_bubble" botName={botName} welcome={welcome} height="h-[min(560px,calc(100vh-7rem))]" />
          </m.div>
        )}
      </AnimatePresence>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="chat-bubble-panel"
        aria-label={open ? "Close chat" : "Open chat"}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-card transition hover:-translate-y-0.5 hover:brightness-110 dark:text-slate-950"
      >
        {!open && <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-primary/40 motion-reduce:hidden" aria-hidden />}
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}
