import Image from "next/image";
import skyline from "@/public/images/mumbai/mumbai-skyline-sunset.webp";
import seaLink from "@/public/images/mumbai/bandra-worli-sea-link.webp";
import desk from "@/public/images/mumbai/study-desk.webp";

export const metadata = { title: "Photo credits" };

const CREDITS = [
  { img: seaLink, alt: "Bandra-Worli Sea Link at sunrise", title: "Bandra-Worli Sea Link", by: "Amit Chivilkar", profile: "https://unsplash.com/@amitchivilkar", src: "https://unsplash.com/photos/a-large-bridge-spanning-over-a-large-body-of-water-oBW1LHvQiAM" },
  { img: skyline, alt: "Mumbai skyline at sunset from the sea", title: "Mumbai skyline at sunset", by: "Garvit", profile: "https://unsplash.com/@photophilic_spook", src: "https://unsplash.com/photos/a-city-skyline-at-sunset-bAwT-vSd46Y" },
  { img: desk, alt: "Desk with open books, notes and a lamp", title: "Study desk", by: "Yen Vu", profile: "https://unsplash.com/@yenvu2410", src: "https://unsplash.com/photos/desk-with-open-book-laptop-and-study-materials-HNjWq8WPyoY" },
];

export default function Credits() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-extrabold">Photo credits</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Photographs are free to use under the{" "}
        <a className="text-primary underline underline-offset-4" href="https://unsplash.com/license">
          Unsplash License
        </a>{" "}
        and are stored locally. All illustrations (skyline, train, classroom, avatars, map, logo) are original SVG artwork. Bright Future Classes is a fictional business and no photo shows its staff or students.
      </p>
      <ul className="mt-8 grid gap-6 sm:grid-cols-3">
        {CREDITS.map((c) => (
          <li key={c.title} className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
            <Image src={c.img} alt={c.alt} placeholder="blur" sizes="(min-width: 640px) 33vw, 100vw" className="h-64 w-full object-cover" />
            <div className="p-4 text-sm">
              <p className="font-heading font-bold">{c.title}</p>
              <p className="text-muted">
                Photo by{" "}
                <a className="text-primary underline underline-offset-4" href={c.profile}>
                  {c.by}
                </a>{" "}
                on{" "}
                <a className="text-primary underline underline-offset-4" href={c.src}>
                  Unsplash
                </a>
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
