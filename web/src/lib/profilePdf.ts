import { jsPDF } from "jspdf";
import type { AssessmentResult, PlainProfile } from "./types";

export type PdfAttribution = {
  id: string;
  name: string;
  license: string;
};

export type ProfilePdfInput = {
  plain: PlainProfile;
  primaryCode: string;
  attribution?: PdfAttribution[];
};

const DISCLAIMER =
  "Dies ist eine Orientierung für Jobcoaching — keine Diagnose, kein klinischer Befund und kein Eignungstest.";

function slugPart(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function profilePdfFilename(codeOrRole: string): string {
  const slug = slugPart(codeOrRole) || "profil";
  return `skillster-profil-${slug}.pdf`;
}

function wrapLines(doc: jsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text, maxWidth) as string[];
}

/**
 * Builds a high-contrast, sectioned Skillster result PDF (client-side).
 */
export function buildProfilePdf(input: ProfilePdfInput): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 22;
  const pageW = doc.internal.pageSize.getWidth();
  const maxW = pageW - margin * 2;
  let y = 24;

  const ensureSpace = (need: number) => {
    if (y + need > 280) {
      doc.addPage();
      y = 24;
    }
  };

  const heading = (n: number, title: string) => {
    ensureSpace(16);
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(10, 20, 40);
    doc.text(`${n}. ${title}`, margin, y);
    y += 8;
  };

  const body = (text: string, size = 11) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    doc.setTextColor(25, 35, 50);
    const lines = wrapLines(doc, text, maxW);
    ensureSpace(lines.length * 6 + 4);
    doc.text(lines, margin, y);
    y += lines.length * 5.5 + 3;
  };

  const bullets = (items: string[]) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(25, 35, 50);
    for (const item of items) {
      const lines = wrapLines(doc, `• ${item}`, maxW);
      ensureSpace(lines.length * 6 + 2);
      doc.text(lines, margin, y);
      y += lines.length * 5.5 + 2;
    }
    y += 2;
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(8, 16, 32);
  doc.text("Dein Skillster-Profil", margin, y);
  y += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 90, 110);
  doc.text(
    "Inhalt: 1 Zusammenfassung · 2 So arbeitest du · 3 Passende Felder · 4 Tipps · 5 Hinweis",
    margin,
    y,
  );
  y += 10;

  heading(1, "Zusammenfassung");
  body(input.plain.oneLine, 12);

  heading(2, "So arbeitest du");
  bullets(input.plain.howYouWork);

  heading(3, "Passende Felder");
  bullets(
    input.plain.attractiveFields.length
      ? input.plain.attractiveFields
      : ["Noch keine klaren Felder — mach den Test vollständig."],
  );

  heading(4, "Tipps");
  bullets(
    input.plain.tips.length
      ? input.plain.tips
      : ["Beobachte, wann du dich bei der Arbeit wohlfühlst."],
  );

  heading(5, "Hinweis");
  body(DISCLAIMER, 10);

  y += 4;
  ensureSpace(24);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 110, 120);
  const attrs =
    input.attribution?.map((a) => `${a.name} (${a.license})`).join(" · ") ||
    "O*NET · ESCO · eigene Profiltexte";
  const footerLines = wrapLines(
    doc,
    `Quellen: ${attrs}. Skillster · Mustercode ${input.primaryCode} (nur zur Einordnung).`,
    maxW,
  );
  doc.text(footerLines, margin, y);

  return doc;
}

/** Save helper used by the Ergebnis UI. */
export function downloadProfilePdf(
  result: Pick<AssessmentResult, "plainProfile" | "primaryCode">,
  attribution?: PdfAttribution[],
): string {
  const filename = profilePdfFilename(
    result.plainProfile.roleLabel || result.primaryCode,
  );
  const doc = buildProfilePdf({
    plain: result.plainProfile,
    primaryCode: result.primaryCode,
    attribution,
  });
  doc.save(filename);
  return filename;
}
