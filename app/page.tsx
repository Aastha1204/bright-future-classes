import { ChatBubble } from "@/components/chat/chat-bubble";
import { DemoCta } from "@/components/landing/demo-cta";
import { Faq } from "@/components/landing/faq";
import { Features } from "@/components/landing/features";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { PhotoStrip } from "@/components/landing/photo-strip";
import { Pricing } from "@/components/landing/pricing";
import { Showcase } from "@/components/landing/showcase";
import { Stats } from "@/components/landing/stats";
import { CtaButton } from "@/components/landing/cta-button";
import { Reveal } from "@/components/motion/reveal";
import { getClient } from "@/lib/client";
import { PRICE } from "@/lib/site";

export default function Home() {
  const c = getClient();
  return (
    <>
      <Hero price={PRICE} />
      <Stats />
      <div className="cv-auto">
        <HowItWorks />
      </div>
      <div className="cv-auto">
        <PhotoStrip />
      </div>
      <div className="cv-auto">
        <Features />
      </div>
      <div className="cv-auto">
        <DemoCta />
      </div>
      <div className="cv-auto">
        <Showcase business={c.business.name} branches={c.branches} faculty={c.faculty} />
      </div>
      <div className="cv-auto">
        <Pricing price={PRICE} />
      </div>
      <div className="cv-auto">
        <Faq />
      </div>
      <section className="cv-auto mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
        <Reveal>
          <h2 className="text-3xl font-extrabold sm:text-4xl">Stop losing leads after 9 pm.</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted">Get an AI assistant that answers every enquiry and hands you only the leads worth a call.</p>
          <div className="mt-8">
            <CtaButton label="Book this for your business" />
          </div>
        </Reveal>
      </section>
      <ChatBubble
        botName={`${c.business.name} Assistant`}
        welcome={`Hi! I'm the ${c.business.name} assistant. Ask me about courses, fees, batches or a free demo class.`}
      />
    </>
  );
}
