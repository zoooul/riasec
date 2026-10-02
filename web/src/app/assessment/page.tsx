import { AssessmentFlow } from "@/components/AssessmentFlow";
import { SiteHeader } from "@/components/SiteHeader";
import { getMvpItems } from "@/lib/items.server";

export default function AssessmentPage() {
  const items = getMvpItems();

  return (
    <main className="flex flex-1 flex-col">
      <SiteHeader
        right={<span className="glass-chip text-[var(--neon-mint)]">Bildaufgaben</span>}
      />
      <AssessmentFlow items={items} />
    </main>
  );
}
