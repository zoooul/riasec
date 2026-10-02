import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders glass typography baseline classes", () => {
    const html = renderToStaticMarkup(
      <Button variant="primary" size="lg">
        Jetzt starten
      </Button>,
    );
    expect(html).toContain("glass-btn");
    expect(html).toContain("glass-btn-primary");
    expect(html).toContain("glass-btn-lg");
  });

  it("merges custom className", () => {
    const html = renderToStaticMarkup(
      <Button variant="secondary" className="w-full">
        Abbrechen
      </Button>,
    );
    expect(html).toContain("glass-btn-secondary");
    expect(html).toContain("w-full");
  });
});
