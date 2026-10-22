"use client";

import { m, useReducedMotion, useTransform, type MotionValue } from "framer-motion";

/** Original 2D Mumbai-morning skyline: sea-link bridge, gateway-style arch, local train, buildings, sunrise. */

const FAR = [
  [0, 70, 120], [60, 100, 90], [150, 60, 150], [215, 90, 110], [310, 70, 170], [385, 110, 100], [500, 80, 140], [585, 60, 120],
  [650, 100, 160], [755, 70, 100], [830, 90, 150], [925, 60, 120], [990, 110, 90], [1105, 95, 140],
];
const NEAR = [
  [0, 90, 190], [95, 70, 150], [820, 100, 200], [925, 80, 160], [1010, 100, 240], [1115, 90, 180],
];

function Windows({ x, y, w, h, seed }: { x: number; y: number; w: number; h: number; seed: number }) {
  const cells: React.ReactNode[] = [];
  for (let r = 0; r < Math.floor((h - 16) / 22); r++) {
    for (let c = 0; c < Math.floor((w - 12) / 18); c++) {
      if ((r * 7 + c * 13 + seed) % 3 !== 0) continue; // sparse lit windows keep the SVG light
      cells.push(<rect key={`${r}-${c}`} x={x + 8 + c * 18} y={y + 12 + r * 22} width="8" height="11" rx="1.5" className={(r + c + seed) % 4 === 0 ? "fill-accent/80" : "fill-surface/40"} />);
    }
  }
  return <>{cells}</>;
}

export function HeroSkyline({ mx, my }: { mx: MotionValue<number>; my: MotionValue<number> }) {
  const reduce = useReducedMotion();
  const px = (f: number) => useTransform(mx, (v) => (reduce ? 0 : v * f)); // eslint-disable-line react-hooks/rules-of-hooks
  const py = (f: number) => useTransform(my, (v) => (reduce ? 0 : v * f * 0.5)); // eslint-disable-line react-hooks/rules-of-hooks
  const sunX = px(-6), sunY = py(-6);
  const farX = px(-10), farY = py(-10);
  const seaX = px(14), seaY = py(14);
  const nearX = px(22), nearY = py(22);

  const cables: React.ReactNode[] = [];
  for (const tx of [720, 930]) {
    for (let i = 1; i <= 7; i++) {
      cables.push(<line key={`l${tx}${i}`} x1={tx} y1={210 + i * 4} x2={tx - i * 22} y2={338} />);
      cables.push(<line key={`r${tx}${i}`} x1={tx} y1={210 + i * 4} x2={tx + i * 22} y2={338} />);
    }
  }

  return (
    <svg viewBox="0 0 1200 520" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full" role="img" aria-label="Illustrated Mumbai skyline at sunrise with a sea link bridge, a stone arch and a local train">
      <defs>
        <linearGradient id="sky-base" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: "var(--sky-c)" }} />
          <stop offset="0.6" style={{ stopColor: "var(--sky-b)" }} />
          <stop offset="1" style={{ stopColor: "var(--sky-a)" }} />
        </linearGradient>
        <linearGradient id="sky-glow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: "var(--sky-glow-1)" }} />
          <stop offset="1" style={{ stopColor: "var(--sky-glow-2)" }} />
        </linearGradient>
        <radialGradient id="sun-halo">
          <stop offset="0" stopColor="#FDE68A" stopOpacity="0.9" />
          <stop offset="1" stopColor="#FDE68A" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="1200" height="520" fill="url(#sky-base)" />
      {/* slow sunrise loop: a warmer glow fades in and out */}
      <m.rect width="1200" height="520" fill="url(#sky-glow)" animate={reduce ? { opacity: 0.5 } : { opacity: [0.15, 0.85, 0.15] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }} />

      <m.g style={{ x: sunX, y: sunY }}>
        <m.g animate={reduce ? undefined : { y: [14, -22, 14] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}>
          <circle cx="600" cy="290" r="150" fill="url(#sun-halo)" />
          <circle cx="600" cy="290" r="56" fill="#FBBF24" />
        </m.g>
      </m.g>

      {/* far buildings */}
      <m.g style={{ x: farX, y: farY }} className="fill-primary/20">
        {FAR.map(([x, w, h], i) => (
          <rect key={i} x={x} y={400 - h} width={w} height={h + 40} rx="3" />
        ))}
      </m.g>

      {/* sea */}
      <m.g style={{ x: seaX, y: seaY }}>
        <rect x="-60" y="395" width="1320" height="60" className="fill-primary/30" />
        {[0, 1].map((k) => (
          <m.path
            key={k}
            d="M-120 410 q 30 -10 60 0 t 60 0 t 60 0 t 60 0 t 60 0 t 60 0 t 60 0 t 60 0 t 60 0 t 60 0 t 60 0 t 60 0 t 60 0 t 60 0 t 60 0 t 60 0 t 60 0 t 60 0 t 60 0 t 60 0 t 60 0 t 60 0"
            fill="none"
            strokeWidth="3"
            className="stroke-surface/50"
            transform={`translate(0 ${k * 16})`}
            animate={reduce ? undefined : { x: [0, 60] }}
            transition={{ duration: 4 + k, repeat: Infinity, ease: "linear" }}
          />
        ))}

        {/* sea-link: deck, two pylons, fanned cables */}
        <g className="stroke-ink/40" strokeWidth="1.6">{cables}</g>
        <rect x="480" y="336" width="640" height="8" rx="3" className="fill-ink/45" />
        {[720, 930].map((tx) => (
          <path key={tx} d={`M${tx - 9} 345 L${tx - 5} 205 L${tx + 5} 205 L${tx + 9} 345 Z`} className="fill-ink/50" />
        ))}

        {/* Gateway-style arch */}
        <g className="fill-ink/55" transform="translate(190 0)">
          <path d="M150 395 V300 q0 -70 80 -70 q80 0 80 70 V395 h-34 V300 q0 -36 -46 -36 q-46 0 -46 36 V395 Z" />
          <rect x="134" y="226" width="192" height="12" rx="2" />
          {[142, 190, 262, 310].map((x) => (
            <g key={x}>
              <rect x={x} y="190" width="14" height="40" />
              <path d={`M${x - 2} 190 q9 -20 18 0 Z`} />
            </g>
          ))}
        </g>
      </m.g>

      {/* near buildings */}
      <m.g style={{ x: nearX, y: nearY }}>
        {NEAR.map(([x, w, h], i) => (
          <g key={i}>
            <rect x={x} y={445 - h} width={w} height={h + 40} rx="3" className="fill-background" />
            <rect x={x} y={445 - h} width={w} height={h + 40} rx="3" className="fill-primary/60" />
            <Windows x={x} y={445 - h} w={w} h={h} seed={i} />
          </g>
        ))}
        {/* ground + track */}
        <rect x="-60" y="445" width="1320" height="90" className="fill-ink/70" />
        <rect x="-60" y="478" width="1320" height="4" className="fill-surface/50" />
        {Array.from({ length: 48 }).map((_, i) => (
          <rect key={i} x={-40 + i * 28} y="482" width="10" height="3" className="fill-surface/30" />
        ))}
      </m.g>

      {/* local train: crosses roughly every 12 s */}
      <m.g
        initial={{ x: -480 }}
        animate={reduce ? { x: 300 } : { x: [-480, 1300] }}
        transition={reduce ? { duration: 0 } : { duration: 7, repeat: Infinity, repeatDelay: 5, ease: "linear" }}
      >
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(${i * 152} 0)`}>
            <rect x="0" y="432" width="146" height="44" rx="9" className="fill-surface" />
            <rect x="0" y="456" width="146" height="9" className="fill-primary" />
            <rect x="0" y="430" width="146" height="5" rx="2" className="fill-accent" />
            {[10, 46, 82, 118].map((wx) => (
              <rect key={wx} x={wx} y="440" width="20" height="13" rx="3" className="fill-primary/40" />
            ))}
            <circle cx="24" cy="478" r="5" className="fill-ink" />
            <circle cx="122" cy="478" r="5" className="fill-ink" />
          </g>
        ))}
      </m.g>
    </svg>
  );
}
