# Skillster

**Skillster** ist ein privates, lokal laufendes Orientierungstool für Jobcoaching: Persönlichkeit und Arbeitsstil (**HOW**) plus Interessen und Berufsfelder (**WHAT**) — ohne Cloud-Pflicht, ohne Diagnose-Anspruch.

Produktregeln, Bias-Guards und Teststufen: [`docs/GUIDELINES.md`](docs/GUIDELINES.md).

---

## Was Skillster macht

| Ebene | Inhalt | Quelle |
|--------|--------|--------|
| **HOW** | Denk- und Verhaltensmuster entlang der VIST-Achsen (E/I, S/N, T/F, J/P) in Alltagssprache | Eigene bildgestützte Items + 16 VIST-Profiltexte (owned) |
| **WHAT** | RIASEC-Interessen → passende Felder und Top-Berufe | O\*NET-Interessenvektoren, optional ESCO-DE-Titel |
| **Qualität** | Zwischenprofile, Coverage-Chip, Bias-Heuristiken | `web/src/lib/bias.ts` — **keine normierte Psychometrie** |

Alle MVP-Bilditems sind `validationStatus: "unvalidated"`. Ergebnisse sind **Orientierung** für Coaching, keine klinische oder validierte Eignungsdiagnose.

---

## Quick Start

```bash
cd web
npm install
npm run dev          # http://localhost:3000
```

**Tests & Build:**

```bash
cd web
npm test             # Soft- + Hard-Guidelines (Vitest)
npm run test:hard    # Nur Hard-Assertions (Guidelines §6)
npm run build
npm run lint
```

**Daten aktualisieren (Repo-Root):**

```bash
# 16 VIST-Profile aus PDF → web/data/profiles/
python3 scripts/extract_profiles.py

# O*NET (+ optional ESCO-DE) → web/data/occupations/occupations.json
python3 scripts/import_occupations.py --limit 280
# optional: python3 scripts/import_occupations.py --limit 280 --fetch-esco

cd web && npm run build
```

Details: [`web/data/occupations/README.md`](web/data/occupations/README.md), [`web/data/stimuli/README.md`](web/data/stimuli/README.md).

---

## UX-Flow

```text
Landing (/)  →  Assessment (/assessment, bildgestützt)  →  Ergebnis (/ergebnis)  →  PDF/Druck
                      ↓
              sessionStorage (Antworten nur lokal)
```

1. **Landing:** Marke Skillster, CTA „Jetzt starten“, mobil tauglich.
2. **Assessment:** Zwei Bildkarten pro Frage (`VisualCard` + SVG-Motive in `public/stimuli/core/`); Sticky-Fortschritt, Doppel-Tap-Schutz, „Neu starten“ mit Bestätigung, Reload setzt fort.
3. **Ergebnis:** Qualitäts-Chip, HOW in Alltagssprache, RIASEC-Felder + ≤3 Berufe, Tipps, Ausschlüsse („Was wir nicht messen“), Details eingeklappt.
4. **PDF:** Clientseitig (`skillster-profil-<rolle>.pdf` via jsPDF) oder Browser-Druck.

Profil-Referenz: [`/profile`](http://localhost:3000/profile) und `/profile/<code>` (16 VIST-Codes).

---

## Profiling-Modell

- **VIST / HOW:** Nested Weights auf Achsen `E_I`, `S_N`, `T_F`, `J_P` (+ Big-Five-Hilfsgewichte). Bei `|Achse| < 18` → **Zwischenprofile** in Worten („teils …, teils …“), keine Buchstabensuppe in der Hauptansicht.
- **RIASEC / WHAT:** Realistic, Investigative, Artistic, Social, Enterprising, Conventional — aus Interessen-Items und Abgleich mit `occupations.json`.
- **Bias-Guards:** Acquiescence, niedrige Coverage, fehlende Module, Absolutismen-Sanitizer, feste Trait-Ausschlüsse — siehe Guidelines §3.
- **Scoring:** Pure Function `scoreAssessment` — primär **client-seitig** auf `/ergebnis`; Server-Spiegel für Tests.

Scoring & Types: [`web/src/lib/README.md`](web/src/lib/README.md).

---

## Architektur (kurz)

```text
Skillster/
├── docs/GUIDELINES.md          # Produkt- & Testregeln
├── scripts/                    # PDF-Profile, O*NET-Import
├── skillster_daten-komprimiert.pdf   # Quell-PDF (VIST)
└── web/                        # Next.js App (App Router, DaisyUI classical UI)
    ├── data/
    │   ├── items/mvp-pictorial.json   # ~32 Bildfragen
    │   ├── profiles/                  # 16 Ergebnisprofile
    │   ├── occupations/               # RIASEC-Berufe
    │   ├── stimuli/index.json         # Motiv-Katalog
    │   └── licenses/sources.json
    ├── public/stimuli/core/*.svg      # CC0-artige Kernmotive
    └── src/lib/                       # Scoring, Bias, PDF, Session
```

Stack: Next.js 16, React 19, **DaisyUI 5** + Tailwind 4 (theme `skillster`), Tabler icons, Motion, Vitest.

Mehr zur Web-App: [`web/README.md`](web/README.md).

### UI-Baseline (kostenloses DaisyUI-Template)

| | |
|--|--|
| **Template** | DaisyUI Next.js Landing Page Template (TypeScript) |
| **URL** | https://github.com/robbins23/landing-nextjs-ts-template |
| **Lizenz** | MIT ([LICENSE](https://github.com/robbins23/landing-nextjs-ts-template/blob/main/LICENSE)) |
| **Komponenten** | Offizielle DaisyUI-Klassen (MIT) — navbar, hero, card, footer, steps, progress, modal, collapse |

**Seiten-Mapping:** Landing `/` → hero + feature cards · Assessment `/assessment` → steps-Wizard + choice cards · Ergebnis `/ergebnis` → summary/detail cards + collapse · Profile `/profile` → card grid · Shell → navbar (`SiteHeader`) + footer (`AppShell`).

Kein Paid-Theme. DaisyUI selbst: [MIT](https://github.com/saadeghi/daisyui/blob/master/LICENSE).

### Design-MCP (kostenlos)

Projekt-MCP [`.cursor/mcp.json`](.cursor/mcp.json): **`figma-mcp-go`** ([npm](https://www.npmjs.com/package/@vkhanhqui/figma-mcp-go)) — kein Figma-API-Key, keine Rate-Limits (Plugin-Bridge statt REST).

1. Cursor neu starten (MCP lädt nur beim Start).
2. **Figma Desktop** öffnen → *Plugins → Development → Import plugin from manifest* → `manifest.json` aus dem [plugin.zip Release](https://github.com/vkhanhqui/figma-mcp-go/releases).
3. Plugin in einer Datei starten, dann im Chat Design lesen/bauen lassen.

Offizielle Figma-Dev-Mode-MCPs brauchen oft bezahlte Kontingente — deshalb bewusst die freie Variante.

---

## Datenquellen & Lizenzen

| Layer | Beispiele | Lizenz / Hinweis |
|-------|-----------|------------------|
| **core** | IPIP-nahe Items (eigene pictorial weights), O\*NET CC BY, ESCO, generierte SVG-Stimuli | Verkaufbar mit Attribution |
| **owned** | VIST-Profilnarrative aus PDF | Eigentum, im Footer genannt |
| **extra** | PSE-Motive, OASIS-Affekt (NC) | Feature-Flag, vor Commercial-Ship austauschen |

Register: `web/data/licenses/sources.json`. PSE/OASIS: Katalog-Slots unter `web/data/stimuli/` — siehe [`web/data/stimuli/README.md`](web/data/stimuli/README.md).

---

## API (Route Handlers)

| Route | Methode | Zweck |
|-------|---------|--------|
| `/api/health` | GET | Liveness |
| `/api/items` | GET | Item-Katalog-Meta (ohne Weight-Dump) |
| `/api/score` | POST | Body `{ "answers": { "<itemId>": "<choiceId>" } }` → `AssessmentResult` |

---

## Bildstimuli & Denkmuster

Jede Assessment-Option verknüpft `visual.motif` → Eintrag in `web/data/stimuli/index.json` → SVG unter `/stimuli/core/`. Fallback: inline-Motive in `VisualCard.tsx`.

| Dimension | Kontrast in Motiv & Copy |
|-----------|---------------------------|
| **E/I** | Gruppenenergie vs. ruhiger Fokus |
| **S/N** | Detail/Fehler vs. Muster/Gestalt |
| **T/F** | Fakten/Logik vs. Menschen/Werte |
| **J/P** | Plan/Struktur vs. Flexibilität |
| **RIASEC** | R–C typische Szenen (Werkstatt, Labor, Studio, …) |
| **Stress** | Plan/strukturieren vs. Pause/Atem |

Item-Texte: `web/data/items/mvp-pictorial.json` (`label`, `hint` — kurzes Deutsch für Laien).

---

## Testing

| Befehl | Bedeutung |
|--------|-----------|
| `npm test` | Vollsuite inkl. Struktur-, Katalog-, Scoring-, Bias-, UX-Smoke-Tests |
| `npm run test:hard` | Hard-Guidelines + Modul-Coverage — darf nicht brechen |

Soft vs. hard: Guidelines §6 (inkl. 6 Test-Stufen Warmup→Abschluss). Browser-E2E: [`web/e2e/README.md`](web/e2e/README.md) (Playwright-CI noch Backlog).

**Manueller Smoke (nach `npm run dev`):**

- `/`, `/assessment`, `/ergebnis`, `/profile`, `/profile/enfj` → HTTP 200
- Assessment durchklicken → Ergebnis + PDF; Teilantworten → „Weiter im Test“

---

## Roadmap / Backlog

Priorisiert in [`docs/GUIDELINES.md`](docs/GUIDELINES.md) §7, u. a.:

1. ESCO-DE-Berufstitel kuratiert
2. PSE/OASIS strikt hinter Feature-Flag
3. Normierung / Validierung der pictorial Items
4. Playwright E2E in CI
5. CC0-Illustrations-Packs (Open Peeps / Humaaans) unter `stimuli/core/`

---

## Rechtlicher Rahmen

Ergebnis- und PDF-Texte: Orientierung für Jobcoaching. Keine Diagnose, keine IQ-/Gesundheits-/Schutzmerkmals-Claims. Footer: Core- + Owned-Attribution.
