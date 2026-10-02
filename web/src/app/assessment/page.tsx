import { AssessmentFlow } from "@/components/AssessmentFlow";
import { SiteHeader } from "@/components/SiteHeader";
import { Chip } from "@/components/ui/chip";
import { getMvpItems } from "@/lib/items.server";

export default function AssessmentPage() {
  const items = getMvpItems();

  return (
    <main className="assessment-viewport flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <SiteHeader
        sticky={false}
        right={<Chip className="badge-secondary">Bildaufgaben</Chip>}
      />
      <AssessmentFlow items={items} />
    </main>
  );
}
