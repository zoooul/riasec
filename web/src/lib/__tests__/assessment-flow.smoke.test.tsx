/**
 * @vitest-environment jsdom
 *
 * Soft UX smoke: AssessmentFlow renders the first stage composition.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AssessmentFlow } from "@/components/AssessmentFlow";
import {
  MODULE_INTROS,
  MODULE_LABELS,
  orderAssessmentItems,
} from "@/lib/assessmentStructure";
import { loadMvpItems } from "./helpers";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));

vi.mock("@/lib/session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/session")>();
  const empty = Object.freeze({}) as Record<string, string>;
  return {
    ...actual,
    getAnswersSnapshot: () => empty,
    getServerAnswersSnapshot: () => empty,
    saveAnswers: vi.fn(),
    clearAnswers: vi.fn(),
  };
});

vi.mock("motion/react", async () => {
  const React = await import("react");
  const stripMotion = (rest: Record<string, unknown>) => {
    const out = { ...rest };
    for (const key of Object.keys(out)) {
      if (
        key.startsWith("initial") ||
        key.startsWith("animate") ||
        key.startsWith("exit") ||
        key.startsWith("transition") ||
        key.startsWith("while") ||
        key === "layout" ||
        key === "layoutId"
      ) {
        delete out[key];
      }
    }
    return out;
  };
  const Pass = ({
    children,
    className,
    ...rest
  }: {
    children?: React.ReactNode;
    className?: string;
  }) =>
    React.createElement("div", { className, ...stripMotion(rest) }, children);

  const MotionBtn = ({
    children,
    className,
    ...rest
  }: {
    children?: React.ReactNode;
    className?: string;
  }) =>
    React.createElement(
      "button",
      { className, type: "button", ...stripMotion(rest) },
      children,
    );

  return {
    AnimatePresence: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    motion: {
      div: Pass,
      button: MotionBtn,
    },
    useReducedMotion: () => true,
  };
});

describe("soft · AssessmentFlow smoke", () => {
  it("renders first item with stage chip, intro, and equal choice cards", () => {
    const items = orderAssessmentItems(loadMvpItems());
    const first = items[0]!;
    const html = renderToStaticMarkup(<AssessmentFlow items={items} />);

    expect(html).toContain(MODULE_LABELS.warmup);
    expect(html).toContain(MODULE_INTROS.warmup);
    expect(html).toContain(first.prompt);
    if (first.task?.title) {
      expect(html).toContain(first.task.title);
    }
    expect(html).toContain("Teil 1/");
    expect(html).toContain("Reise");
    expect(html).toContain(first.choices[0]!.label);
    expect(html).toContain(first.choices[1]!.label);
    expect(html).toContain("solution-card");
    expect(html).toContain("card bg-base-100");
    expect(html).toContain("Zwei Lösungspfade");
    expect(html).toContain("Weg A");
    expect(html).toContain("Weg B");
    expect(html).toContain("steps");
    expect(html).toContain("progress progress-primary");
    expect(html).toContain("badge");
  });

  it("uses viewport-fit shell classes so the step can compress without page scroll", () => {
    const items = orderAssessmentItems(loadMvpItems());
    const html = renderToStaticMarkup(<AssessmentFlow items={items} />);

    expect(html).toContain("assessment-flow");
    expect(html).toContain("assessment-rail");
    expect(html).toContain("assessment-prompt");
    expect(html).toContain("assessment-status-strip");
    expect(html).toContain("split-lg");
    expect(html).toContain("assessment-choice-grid");
    expect(html).toContain("assessment-choice");
    expect(html).toContain("grid-cols-2");
    expect(html).toContain("min-h-0");
    expect(html).toContain("flex-1");
    expect(html).not.toContain("min-h-[12.5rem]");
    expect(html).not.toContain("sm:min-h-[14rem]");
    expect(html).not.toContain("absolute inset-x-0 -top-1");
    expect(html).not.toContain("glass-panel");
    expect(html).not.toContain("GlassShell");
  });
});
