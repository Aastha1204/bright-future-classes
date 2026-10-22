import Link from "next/link";
import { CALL_URL, CONTACT_PHONE_DISPLAY, whatsappUrl } from "@/lib/site";
import { Badge } from "@/components/ui/badge";

export function Footer({ disclaimer }: { disclaimer: string }) {
  return (
    <footer className="mt-20 border-t border-line bg-surface">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-muted sm:px-6 md:flex-row md:items-center md:justify-between">
        <p>{disclaimer}</p>
        <div className="flex flex-wrap items-center gap-4">
          <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">
            WhatsApp {CONTACT_PHONE_DISPLAY}
          </a>
          <a href={CALL_URL} className="underline-offset-4 hover:underline">
            Call us
          </a>
          <Badge variant="outline">Demo — sample data</Badge>
          <Link href="/credits" className="underline-offset-4 hover:underline">
            Photo credits
          </Link>
        </div>
      </div>
    </footer>
  );
}
