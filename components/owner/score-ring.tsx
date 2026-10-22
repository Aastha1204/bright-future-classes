"use client";

import { useEffect, useState } from "react";
import { animate, m, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Badge } from "@/lib/scoring";

const COLOR: Record<Badge, string> = { HOT: "text-hot", WARM: "text-warm", COLD: "text-cold" };

export function ScoreRing({ score, badge, size = 120 }: { score: number; badge: Badge; size?: number }) {
  const reduce = useReducedMotion();
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const mv = useMotionValue(0);
  const [shown, setShown] = useState(0);
  const offset = useTransform(mv, (v) => c * (1 - v / 100));

  useEffect(() => {
    const controls = animate(mv, score, {
      duration: reduce ? 0 : 1.1,
      ease: "easeOut",
      onUpdate: (v) => setShown(Math.round(v)),
    });
    return () => controls.stop();
  }, [score, mv, reduce]);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`Lead score ${score} out of 100, ${badge}`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-line" />
        <m.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          style={{ strokeDashoffset: offset }}
          className={cn("stroke-current transition-colors duration-500", COLOR[badge])}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-heading text-3xl font-extrabold leading-none">{shown}</span>
        <span className="text-[11px] font-medium text-muted">/ 100</span>
      </div>
    </div>
  );
}
