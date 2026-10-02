/**
 * Soft · DaisyUI theme coverage — skillster tokens and classical shell.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(__dirname, "../..");

function read(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

describe("soft · DaisyUI skillster theme", () => {
  it("registers named theme skillster via DaisyUI 5 plugin", () => {
    const css = read("app/globals.css");
    expect(css).toContain('@plugin "daisyui"');
    expect(css).toContain('@plugin "daisyui/theme"');
    expect(css).toContain('name: "skillster"');
    expect(css).toContain("--color-primary:");
    expect(css).toContain("--color-base-100:");
    expect(css).toContain("--font-display");
    expect(css).not.toContain("glass-panel");
    expect(css).not.toContain("liquid-glass");
  });

  it("applies data-theme=skillster with Figtree/Fraunces fonts", () => {
    const layout = read("app/layout.tsx");
    expect(layout).toContain('data-theme="skillster"');
    expect(layout).toContain("Figtree");
    expect(layout).toContain("Fraunces");
    expect(layout).toContain("AppShell");
    expect(layout).not.toContain("MantineRoot");
    expect(layout).not.toContain("GlassShell");
  });

  it("depends on daisyui without mantine packages", () => {
    const pkg = read("../package.json");
    expect(pkg).toContain('"daisyui"');
    expect(pkg).not.toMatch(/@mantine\//);
  });

  it("keeps classical layout: clamped stimuli, no hero text/media z-fight", () => {
    const css = read("app/globals.css");
    const landing = read("app/page.tsx");
    const flow = read("components/AssessmentFlow.tsx");
    const visual = read("components/VisualCard.tsx");

    expect(css).toContain("assessment-choice-visual");
    expect(css).toContain("max-height: min(20vh, 8.5rem)");
    expect(css).toContain(".assessment-progress");
    expect(css).toContain(".assessment-steps");
    expect(css).toMatch(/--text-hero:\s*clamp\(2\.75rem/);

    expect(landing).toContain("landing-hero-figure");
    expect(landing).toContain("lg:grid-cols-");
    expect(landing).not.toContain("z-[2]");
    expect(landing).not.toContain("absolute inset-0");
    expect(landing).not.toContain("absolute inset-[8%]");

    expect(flow).toContain("assessment-choice-figure");
    expect(flow).toContain("card-body");
    expect(flow).toContain("assessment-status-strip");
    expect(flow).not.toContain("relative z-[1]");

    expect(visual).toContain("assessment-choice-visual");
    expect(visual).toContain("aspect-[5/3]");
    expect(visual).not.toContain("min-h-0 flex-1");
  });
});
