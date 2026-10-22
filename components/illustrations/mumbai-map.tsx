"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/** Stylised, original 2D map of Mumbai (not geographically exact) with a pulsing pin per branch. */

const PINS: Record<string, { x: number; y: number }> = {
  borivali: { x: 150, y: 70 },
  andheri: { x: 138, y: 150 },
  dadar: { x: 128, y: 240 },
  thane: { x: 262, y: 120 },
};

export function MumbaiMap({ branches, activeId, onActive }: { branches: { id: string; name: string }[]; activeId?: string | null; onActive?: (id: string | null) => void }) {
  const [hover, setHover] = useState<string | null>(null);
  const current = activeId ?? hover;
  return (
    <svg viewBox="0 0 360 320" className="h-full w-full" role="img" aria-label="Stylised map of Mumbai with four branch pins: Borivali, Andheri, Dadar and Thane">
      <rect width="360" height="320" rx="20" className="fill-primary-light" />
      {/* sea (west) */}
      <path d="M0 0 H92 C70 60 118 110 96 170 C82 210 112 260 92 320 H0Z" className="fill-primary/20" />
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M${14 + i * 22} ${40 + i * 30} q10 -8 20 0 t20 0`} fill="none" strokeWidth="2" className="stroke-primary/40" />
      ))}
      {/* peninsula + mainland */}
      <path d="M92 0 H360 V320 H92 C112 260 82 210 96 170 C118 110 70 60 92 0Z" className="fill-surface" />
      {/* creek separating Thane */}
      <path d="M210 0 C226 60 200 100 236 150 C262 190 240 250 262 320" fill="none" strokeWidth="14" strokeLinecap="round" className="stroke-primary/25" />
      {/* Western line + Central line */}
      <path d="M150 20 L138 150 L128 300" fill="none" strokeWidth="3" strokeDasharray="7 6" className="stroke-accent" />
      <path d="M312 40 L262 120 L190 220 L134 290" fill="none" strokeWidth="3" strokeDasharray="7 6" className="stroke-primary/60" />
      <text x="26" y="300" className="fill-primary/70 text-[11px] font-semibold">Arabian Sea</text>

      {branches.map((b) => {
        const p = PINS[b.id];
        if (!p) return null;
        const on = current === b.id;
        return (
          <g
            key={b.id}
            transform={`translate(${p.x} ${p.y})`}
            tabIndex={0}
            role="button"
            aria-label={`${b.name} branch`}
            className="cursor-pointer outline-none"
            onMouseEnter={() => (setHover(b.id), onActive?.(b.id))}
            onMouseLeave={() => (setHover(null), onActive?.(null))}
            onFocus={() => (setHover(b.id), onActive?.(b.id))}
            onBlur={() => (setHover(null), onActive?.(null))}
          >
            <circle r="16" className={cn("origin-center fill-hot/25 [transform-box:fill-box]", on && "animate-ping")} />
            <circle r="9" className="fill-hot" />
            <circle r="3.5" className="fill-white" />
            <text y="-18" textAnchor="middle" className={cn("fill-ink text-[11px] font-bold transition-opacity", on ? "opacity-100" : "opacity-80")}>
              {b.name.split(" ")[0]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
