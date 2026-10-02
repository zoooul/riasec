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
});
