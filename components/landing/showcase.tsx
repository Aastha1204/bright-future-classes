"use client";

import { useState } from "react";
import { MapPin, Train } from "lucide-react";
import { FacultyAvatar } from "@/components/illustrations/scenes";
import { MumbaiMap } from "@/components/illustrations/mumbai-map";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

interface Branch {
  id: string;
  name: string;
  address: string;
  nearest_station: string;
  seats_per_batch: number;
}
interface Faculty {
  id: string;
  initials: string;
  name: string;
  subject: string;
  experience_years: number;
  bio: string;
}

export function Showcase({ business, branches, faculty }: { business: string; branches: Branch[]; faculty: Faculty[] }) {
  const [active, setActive] = useState<string | null>(null);
  return (
    <section id="sample-client" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20 sm:px-6">
      <Reveal>
        <h2 className="text-center text-3xl font-extrabold sm:text-4xl">The sample client: {business}</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-muted">
          A fictional Mumbai coaching institute. Everything the bot knows comes from one file, <code className="rounded bg-primary-light px-1.5 py-0.5 text-sm text-primary">config/client.json</code>. Swap the file and the same site becomes your client&apos;s.
        </p>
      </Reveal>

      <div className="mt-12 grid items-center gap-8 lg:grid-cols-2">
        <Reveal className="mx-auto aspect-[9/8] w-full max-w-md overflow-hidden rounded-3xl border border-line shadow-card">
          <MumbaiMap branches={branches} activeId={active} onActive={setActive} />
        </Reveal>
        <Stagger className="grid gap-3 sm:grid-cols-2">
          {branches.map((b) => (
            <StaggerItem key={b.id}>
              <div
                onMouseEnter={() => setActive(b.id)}
                onMouseLeave={() => setActive(null)}
                className={cn("h-full rounded-2xl border bg-surface p-4 shadow-card transition", active === b.id ? "border-primary ring-1 ring-primary" : "border-line")}
              >
                <p className="flex items-center gap-1.5 font-heading font-bold">
                  <MapPin className="h-4 w-4 text-hot" aria-hidden /> {b.name}
                </p>
                <p className="mt-1 text-xs text-muted">{b.address}</p>
                <p className="mt-2 flex items-center gap-1.5 text-xs font-medium">
                  <Train className="h-3.5 w-3.5 text-primary" aria-hidden /> {b.nearest_station}
                </p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>

      <Reveal>
        <h3 className="mt-16 text-center font-heading text-xl font-bold">Faculty (illustrated, fictional)</h3>
      </Reveal>
      <Stagger className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {faculty.map((f) => (
          <StaggerItem key={f.id}>
            <div className="flex h-full gap-4 rounded-2xl border border-line bg-surface p-4 shadow-card">
              <FacultyAvatar initials={f.initials} subject={f.subject} />
              <div>
                <p className="font-heading font-bold">{f.name}</p>
                <p className="text-xs font-semibold text-primary">
                  {f.subject} · {f.experience_years} yrs
                </p>
                <p className="mt-1 text-sm text-muted">{f.bio}</p>
              </div>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}
