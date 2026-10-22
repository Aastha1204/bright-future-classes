export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <svg viewBox="0 0 160 120" className="h-28 w-40" role="img" aria-label="Empty clipboard illustration">
        <ellipse cx="80" cy="108" rx="52" ry="7" className="fill-line" />
        <rect x="38" y="14" width="84" height="92" rx="10" className="fill-primary-light stroke-primary" strokeWidth="3" />
        <rect x="62" y="8" width="36" height="16" rx="6" className="fill-primary" />
        <g className="stroke-primary/50" strokeWidth="4" strokeLinecap="round">
          <path d="M52 44h56" />
          <path d="M52 60h40" />
          <path d="M52 76h48" />
        </g>
        <circle cx="116" cy="92" r="14" className="fill-accent" />
        <path d="M110 92h12M116 86v12" stroke="white" strokeWidth="3" strokeLinecap="round" transform="rotate(45 116 92)" />
      </svg>
      <p className="font-heading text-lg font-bold">{title}</p>
      {hint && <p className="max-w-xs text-sm text-muted">{hint}</p>}
    </div>
  );
}
