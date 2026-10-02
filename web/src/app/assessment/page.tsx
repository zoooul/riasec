import { AssessmentFlow } from "@/components/AssessmentFlow";
import { SiteHeader } from "@/components/SiteHeader";
import { Chip } from "@/components/ui/chip";
import { getMvpItems } from "@/lib/items.server";

export default function AssessmentPage() {
  const items = getMvpItems();

  return (
    <main className="flex flex-1 flex-col">
      <SiteHeader
        right={<Chip className="text-[var(--neon-mint)]">Bildaufgaben</Chip>}
      />
      <AssessmentFlow items={items} />
    </main>
  );
}
