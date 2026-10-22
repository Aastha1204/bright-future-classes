import { OwnerView } from "@/components/owner/owner-view";
import { getClient } from "@/lib/client";

export const metadata = { title: "Owner view — Bright Future Classes" };

export default function OwnerPage() {
  const c = getClient();
  return <OwnerView config={{ counsellor: c.handover.counsellor_name, templates: c.handover.templates }} />;
}
