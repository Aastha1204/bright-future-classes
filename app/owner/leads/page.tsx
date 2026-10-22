import { LeadsTable } from "@/components/owner/leads-table";
import { getClient } from "@/lib/client";

export const metadata = { title: "Leads — Bright Future Classes" };

const CLASSES = ["Class 8", "Class 9", "Class 10", "JEE Foundation", "NEET Foundation"];

export default function LeadsPage() {
  const c = getClient();
  return (
    <LeadsTable
      config={{ counsellor: c.handover.counsellor_name, templates: c.handover.templates }}
      branches={c.branches.map((b) => b.name)}
      classes={CLASSES}
    />
  );
}
