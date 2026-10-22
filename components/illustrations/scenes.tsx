import { Atom, BookOpen, Calculator, Dna, FlaskConical, Globe2 } from "lucide-react";

/** Original flat 2D scenes (faceless on purpose: no real or lookalike people). */

const SKIN = "#E8B88A";

function Frame({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <svg viewBox="0 0 240 200" className="h-full w-full" role="img" aria-label={label}>
      <ellipse cx="120" cy="184" rx="96" ry="10" className="fill-line" />
      {children}
    </svg>
  );
}

export function ParentOnPhone() {
  return (
    <Frame label="Illustration of a parent chatting on a phone">
      <rect x="62" y="96" width="70" height="86" rx="26" className="fill-primary" />
      <circle cx="97" cy="70" r="24" fill={SKIN} />
      <path d="M72 66 q25 -34 50 0 q-10 -10 -25 -10 q-15 0 -25 10Z" className="fill-ink" />
      <rect x="120" y="96" width="34" height="58" rx="7" transform="rotate(14 137 125)" className="fill-ink" />
      <rect x="124" y="101" width="26" height="46" rx="4" transform="rotate(14 137 125)" className="fill-surface" />
      <g transform="rotate(14 137 125)">
        <rect x="127" y="106" width="16" height="8" rx="4" className="fill-primary-light" />
        <rect x="131" y="118" width="16" height="8" rx="4" className="fill-primary" />
        <rect x="127" y="130" width="12" height="8" rx="4" className="fill-primary-light" />
      </g>
      <rect x="150" y="48" width="64" height="34" rx="14" className="fill-accent" />
      <path d="M160 82 l-6 12 l16 -12Z" className="fill-accent" />
      <g className="fill-ink/70"><circle cx="170" cy="65" r="3.5" /><circle cx="182" cy="65" r="3.5" /><circle cx="194" cy="65" r="3.5" /></g>
    </Frame>
  );
}

export function StudentStudying() {
  return (
    <Frame label="Illustration of a student studying at a desk">
      <rect x="30" y="132" width="180" height="10" rx="4" className="fill-ink/70" />
      <rect x="44" y="142" width="8" height="40" className="fill-ink/60" />
      <rect x="188" y="142" width="8" height="40" className="fill-ink/60" />
      <rect x="70" y="86" width="64" height="50" rx="22" className="fill-accent" />
      <circle cx="102" cy="64" r="22" fill={SKIN} />
      <path d="M80 62 q22 -32 44 0 q-8 -6 -22 -6 q-14 0 -22 6Z" className="fill-ink" />
      <path d="M78 130 l24 -18 l24 18Z" className="fill-primary-light" />
      <rect x="82" y="118" width="40" height="14" rx="3" className="fill-primary" />
      <rect x="142" y="104" width="6" height="30" className="fill-ink/60" />
      <path d="M130 104 h30 l-8 -24 h-14Z" className="fill-accent" />
      <path d="M134 108 L120 132 H168 L154 108Z" fill="#FDE68A" opacity="0.35" />
      <g className="fill-primary" ><rect x="176" y="112" width="24" height="20" rx="2" /><rect x="180" y="100" width="20" height="14" rx="2" className="fill-accent" /></g>
    </Frame>
  );
}

export function CounsellorDesk() {
  return (
    <Frame label="Illustration of a counsellor at a desk with a lead dashboard">
      <rect x="24" y="130" width="192" height="10" rx="4" className="fill-ink/70" />
      <rect x="34" y="140" width="8" height="42" className="fill-ink/60" />
      <rect x="198" y="140" width="8" height="42" className="fill-ink/60" />
      <rect x="112" y="46" width="96" height="66" rx="8" className="fill-ink" />
      <rect x="118" y="52" width="84" height="54" rx="4" className="fill-surface" />
      <rect x="124" y="58" width="36" height="10" rx="5" className="fill-hot" />
      <rect x="124" y="74" width="70" height="5" rx="2" className="fill-line" />
      <rect x="124" y="84" width="56" height="5" rx="2" className="fill-line" />
      <rect x="124" y="94" width="40" height="5" rx="2" className="fill-primary/60" />
      <rect x="156" y="112" width="12" height="18" className="fill-ink" />
      <rect x="44" y="84" width="56" height="48" rx="22" className="fill-primary" />
      <circle cx="72" cy="62" r="21" fill={SKIN} />
      <path d="M50 60 q22 -30 44 0 q-8 6 -22 6 q-14 0 -22 -6Z" className="fill-ink" />
    </Frame>
  );
}

export function ClassroomScene() {
  return (
    <Frame label="Illustration of a classroom with a whiteboard and desks">
      <rect x="28" y="30" width="184" height="86" rx="8" className="fill-primary-light stroke-primary" strokeWidth="3" />
      <g className="stroke-primary/60" strokeWidth="4" strokeLinecap="round" fill="none">
        <path d="M46 56h70" /><path d="M46 74h100" /><path d="M46 92h54" />
      </g>
      <circle cx="176" cy="68" r="16" className="fill-accent" />
      <rect x="40" y="136" width="52" height="8" rx="3" className="fill-ink/70" />
      <rect x="148" y="136" width="52" height="8" rx="3" className="fill-ink/70" />
      <circle cx="66" cy="118" r="12" fill={SKIN} /><rect x="54" y="126" width="24" height="12" rx="6" className="fill-primary" />
      <circle cx="174" cy="118" r="12" fill={SKIN} /><rect x="162" y="126" width="24" height="12" rx="6" className="fill-accent" />
      <rect x="48" y="144" width="5" height="32" className="fill-ink/60" /><rect x="156" y="144" width="5" height="32" className="fill-ink/60" />
    </Frame>
  );
}

const SUBJECT_ICON: [RegExp, typeof Atom][] = [
  [/math/i, Calculator],
  [/physics/i, Atom],
  [/chem/i, FlaskConical],
  [/bio/i, Dna],
  [/social|english/i, Globe2],
];

/** Faculty are illustrated: initials in a gradient circle with a subject icon (no faces or stock photos). */
export function FacultyAvatar({ initials, subject, size = 64 }: { initials: string; subject: string; size?: number }) {
  const Icon = SUBJECT_ICON.find(([re]) => re.test(subject))?.[1] ?? BookOpen;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} aria-hidden>
      <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent font-heading text-lg font-extrabold text-white">{initials}</div>
      <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-surface bg-surface text-primary shadow-card">
        <Icon className="h-3.5 w-3.5" />
      </span>
    </div>
  );
}
