"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

/** Card with a soft radial glow that follows the cursor. */
export function GlowCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      className={cn("group relative overflow-hidden rounded-2xl border border-line bg-surface shadow-card", className)}
      onMouseMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--gx", `${e.clientX - r.left}px`);
        el.style.setProperty("--gy", `${e.clientY - r.top}px`);
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 motion-reduce:hidden"
        style={{ background: "radial-gradient(240px circle at var(--gx, 50%) var(--gy, 50%), rgb(var(--accent) / 0.22), transparent 70%)" }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
