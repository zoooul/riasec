import { AssessmentFlow } from "@/components/AssessmentFlow";
import { getMvpItems } from "@/lib/items";
import Link from "next/link";

export default function AssessmentPage() {
  const items = getMvpItems();

  return (
    <main className="flex-1">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 pt-6">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]"
        >
          Skillster
        </Link>
        <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-medium text-[var(--accent)]">
          Bildaufgaben
        </span>
      </header>
      <AssessmentFlow items={items} />
    </main>
  );
}
