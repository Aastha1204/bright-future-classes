import Image from "next/image";
import seaLink from "@/public/images/mumbai/bandra-worli-sea-link.webp";
import skyline from "@/public/images/mumbai/mumbai-skyline-sunset.webp";
import desk from "@/public/images/mumbai/study-desk.webp";
import { Reveal } from "@/components/motion/reveal";

const PHOTOS = [
  { src: seaLink, alt: "Bandra-Worli Sea Link at sunrise", caption: "Built for Mumbai", by: "Amit Chivilkar" },
  { src: desk, alt: "Study desk with books and notes under a lamp", caption: "For students who study late", by: "Yen Vu" },
  { src: skyline, alt: "Mumbai skyline at sunset", caption: "Replies at 2 am too", by: "Garvit" },
];

export function PhotoStrip() {
  return (
    <section aria-label="Mumbai photos" className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {PHOTOS.map((p, i) => (
          <Reveal key={p.caption} delay={i * 0.1} className="group relative h-72 overflow-hidden rounded-3xl">
            <Image src={p.src} alt={p.alt} placeholder="blur" sizes="(min-width: 640px) 33vw, 100vw" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
              <p className="font-heading font-bold">{p.caption}</p>
              <p className="text-[11px] opacity-80">Photo: {p.by} / Unsplash</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
