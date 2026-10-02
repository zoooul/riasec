import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/button";
import { withMantine } from "@/lib/__tests__/mantine";

describe("Button", () => {
  it("renders glass typography baseline classes via Mantine", () => {
    const html = renderToStaticMarkup(
      withMantine(
        <Button variant="primary" size="lg">
          Jetzt starten
        </Button>,
      ),
    );
    expect(html).toContain("glass-btn");
    expect(html).toContain("glass-btn-primary");
    expect(html).toContain("glass-btn-lg");
  });

  it("merges custom className", () => {
    const html = renderToStaticMarkup(
      withMantine(
        <Button variant="secondary" className="w-full">
          Abbrechen
        </Button>,
      ),
    );
    expect(html).toContain("glass-btn-secondary");
    expect(html).toContain("w-full");
  });
});
