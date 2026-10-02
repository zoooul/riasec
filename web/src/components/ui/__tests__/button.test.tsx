import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders DaisyUI btn baseline classes", () => {
    const html = renderToStaticMarkup(
      <Button variant="primary" size="lg">
        Jetzt starten
      </Button>,
    );
    expect(html).toContain("btn");
    expect(html).toContain("btn-primary");
    expect(html).toContain("btn-lg");
  });

  it("merges custom className", () => {
    const html = renderToStaticMarkup(
      <Button variant="secondary" className="w-full">
        Abbrechen
      </Button>,
    );
    expect(html).toContain("btn-soft");
    expect(html).toContain("btn-primary");
    expect(html).toContain("w-full");
  });
});
