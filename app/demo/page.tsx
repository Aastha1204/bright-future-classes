import { DemoSplit } from "@/components/demo/demo-split";
import { getClient } from "@/lib/client";
import type { ScriptId } from "@/lib/scripted";

export const metadata = { title: "Live demo — Bright Future Classes" };

export default function DemoPage({ searchParams }: { searchParams: { play?: string } }) {
  const c = getClient();
  const play = searchParams.play?.toUpperCase();
  const initialPlay = play === "A" || play === "B" || play === "C" ? (play as ScriptId) : undefined;
  return (
    <DemoSplit
      botName={`${c.business.name} Assistant`}
      welcome={`Hi! I'm the ${c.business.name} assistant. Ask me about courses, fees, batches or a free demo class — English or Hinglish both work.`}
      config={{ counsellor: c.handover.counsellor_name, templates: c.handover.templates }}
      initialPlay={initialPlay}
    />
  );
}
