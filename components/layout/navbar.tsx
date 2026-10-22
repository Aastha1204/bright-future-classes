"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, MessageCircle, Phone, X } from "lucide-react";
import { CALL_URL, CONTACT_PHONE_DISPLAY, whatsappUrl } from "@/lib/site";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "./theme-toggle";

const links = [
  { href: "/demo", label: "Demo" },
  { href: "/owner", label: "Owner view" },
  { href: "/owner/leads", label: "Leads" },
  { href: "/owner/analytics", label: "Analytics" },
];

export function Navbar({ name }: { name: string }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-background/80 backdrop-blur">
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" aria-label={`${name} — home`} className="flex items-center gap-2 font-heading font-extrabold">
          <Image src="/illustrations/logo.svg" alt="" width={32} height={32} priority />
          <span className="hidden sm:inline">{name}</span>
        </Link>
        <ul className="ml-4 hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={path === l.href ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-ink",
                  path === l.href && "bg-primary-light text-primary",
                )}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="outline" className="hidden lg:inline-flex">
            Demo — sample data
          </Badge>
          <a
            href={whatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat with us on WhatsApp"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#128C7E] px-3 text-sm font-semibold text-white transition hover:brightness-110"
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
          <a
            href={CALL_URL}
            aria-label={`Call ${CONTACT_PHONE_DISPLAY}`}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-sm font-semibold hover:bg-primary-light"
          >
            <Phone className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Call</span>
          </a>
          <ThemeToggle />
          <button
            className="rounded-lg p-2 md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>
      {open && (
        <ul className="border-t border-line bg-background px-4 py-2 md:hidden">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-3 text-sm font-medium">
                {l.label}
              </Link>
            </li>
          ))}
          <li className="px-3 py-2">
            <Badge variant="outline">Demo — sample data</Badge>
          </li>
        </ul>
      )}
    </header>
  );
}
