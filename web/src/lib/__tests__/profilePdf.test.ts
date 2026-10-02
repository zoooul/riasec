import { describe, expect, it, vi } from "vitest";
import { TRAIT_EXCLUSIONS } from "@/lib/bias";
import { buildProfilePdf, profilePdfFilename } from "@/lib/profilePdf";
import type { AssessmentResult } from "@/lib/types";

const textLog: string[] = [];

vi.mock("jspdf", () => {
  class FakeDoc {
    internal = { pageSize: { getWidth: () => 210, getHeight: () => 297 } };
    setFont() {}
    setFontSize() {}
    setTextColor() {}
    text(input: string | string[]) {
      if (Array.isArray(input)) textLog.push(...input.map(String));
      else textLog.push(String(input));
    }
    addPage() {}
    splitTextToSize(text: string) {
      return [text];
    }
    save() {}
    getNumberOfPages() {
      return 1;
    }
  }
  return { jsPDF: FakeDoc };
});

const samplePlain = {
  oneLine: "Du arbeitest oft wie jemand, der als „Psychologe“ beschrieben wird.",
  howYouWork: [
    "Du brauchst oft Ruhe und Zeit für dich.",
    "Du denkst gern in Mustern und Möglichkeiten.",
    "Bei Entscheidungen zählen für dich Menschen und Werte.",
  ],
  attractiveFields: ["Sozial-begleitend", "Untersuchend", "Gestalterisch"],
  tips: ["Plane kurze Pausen allein ein — das lädt dich wieder auf."],
  roleLabel: "Psychologe",
};

describe("profile PDF helper", () => {
  it("builds a filename from role/code", () => {
    expect(profilePdfFilename("Psychologe")).toBe(
      "skillster-profil-psychologe.pdf",
    );
    expect(profilePdfFilename("INFJ")).toBe("skillster-profil-infj.pdf");
  });

  it("does not throw and writes Qualität + Ausschlüsse + disclaimer", () => {
    textLog.length = 0;
    const result = {
      plainProfile: samplePlain,
      primaryCode: "INFJ",
    } as Pick<AssessmentResult, "plainProfile" | "primaryCode">;

    expect(() =>
      buildProfilePdf({
        plain: result.plainProfile,
        primaryCode: result.primaryCode,
        qualityLabel: "unsicher",
        exclusions: [...TRAIT_EXCLUSIONS],
        coverageHint: "Basierend auf 32 von 32 Fragen",
        occupations: [
          {
            titleDe: "Coach",
            why: "Könnte zu deinem Hang zu sozial-begleitend passen.",
          },
        ],
        attribution: [
          { id: "onet", name: "O*NET", license: "CC BY 4.0" },
          { id: "ipip", name: "IPIP", license: "Public Domain" },
        ],
      }),
    ).not.toThrow();

    const blob = textLog.join("\n");
    expect(blob).toMatch(/Skillster-Profil/);
    expect(blob).toMatch(/Zusammenfassung/);
    expect(blob).toMatch(/So arbeitest du/);
    expect(blob).toMatch(/Passende Felder/);
    expect(blob).toMatch(/Tipps/);
    expect(blob).toMatch(/Hinweis/);
    expect(blob).toMatch(/Orientierung/);
    expect(blob).toMatch(/Diagnose/);
    expect(blob).toMatch(/Qualität: Etwas unsicher/);
    expect(blob).toMatch(/Was wir nicht messen/);
    expect(blob).toMatch(/klinische/);
    expect(blob).toMatch(/Coach/);
  });
});
