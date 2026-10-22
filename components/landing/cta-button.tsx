import { MessageCircle, Phone } from "lucide-react";
import { Magnetic } from "@/components/motion/magnetic";
import { Button } from "@/components/ui/button";
import { CALL_URL, CONTACT_PHONE_DISPLAY, whatsappUrl } from "@/lib/site";

/** "Book this for your business": WhatsApp chat and a phone call. */
export function CtaButton({ label }: { label: string }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
      <Magnetic>
        <Button asChild size="lg" variant="accent">
          <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-5 w-5" aria-hidden /> {label} on WhatsApp
          </a>
        </Button>
      </Magnetic>
      <Button asChild size="lg" variant="outline">
        <a href={CALL_URL} aria-label={`Call ${CONTACT_PHONE_DISPLAY}`}>
          <Phone className="h-5 w-5" aria-hidden /> Call {CONTACT_PHONE_DISPLAY}
        </a>
      </Button>
    </div>
  );
}
