import { describe, expect, it, vi } from "vitest";
import { buildProfilePdf, profilePdfFilename } from "@/lib/profilePdf";
import type { AssessmentResult } from "@/lib/types";

vi.mock("jspdf", () => {
  class FakeDoc {
    internal = { pageSize: { getWidth: () => 210, getHeight: () => 297 } };
    setFont() {}
    setFontSize() {}
    setTextColor() {}
    text() {}
    addPage() {}
    splitTextToSize(text: string) {
      return [text];
    }
    save() {}
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

  it("does not throw on a sample AssessmentResult", () => {
    const result = {
      plainProfile: samplePlain,
      primaryCode: "INFJ",
    } as Pick<AssessmentResult, "plainProfile" | "primaryCode">;

    expect(() =>
      buildProfilePdf({
        plain: result.plainProfile,
        primaryCode: result.primaryCode,
        attribution: [
          { id: "onet", name: "O*NET", license: "CC BY 4.0" },
          { id: "ipip", name: "IPIP", license: "Public Domain" },
        ],
      }),
    ).not.toThrow();
  });
});
