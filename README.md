# Skillster

Privates, lokal laufendes Profiling-Tool für Jobcoaching-Orientierung.

**Product guidelines:** [`docs/GUIDELINES.md`](docs/GUIDELINES.md) — HOW vs WHAT, license layers, bias/fairness, UX copy, Ergebnis/PDF rules, soft vs hard tests, backlog.

- **Hinten:** VIST-Profile, pictorial Items, O\*NET/ESCO-Berufe, Stimuli, Lizenzen (PSE/OASIS extra)
- **Vorne:** einfacher Bild-Flow für Laien (liquid-glass UI)
- **Strategie:** Kernquellen frei/verkaufbar; Extra (NC) getrennt und austauschbar
- **Scoring:** Persönlichkeit (VIST-Achsen) + Interessen (RIASEC), nested weights, Zwischenprofile, `sessionStorage`
- **Bias-Guards:** Heuristiken gegen Antwortmuster + explizite Ausschlüsse (keine klinischen/geschützten Merkmals-Claims); unvalidiert

## Start

```bash
cd web
npm install
npm run dev
```

Öffnen: [http://localhost:3000](http://localhost:3000)

```bash
cd web
npm test            # soft + hard (Vitest)
npm run test:hard   # hard assertions only
npm run build
```

See `docs/GUIDELINES.md` for what soft vs hard means.

## Daten aktualisieren

```bash
# 16 VIST-Profile aus PDF (zwei Spalten → lesbare Bullets)
python3 scripts/extract_profiles.py

# O*NET Interests (+ optionale ESCO-DE-Labels) → getrimmtes Set (~200–350)
python3 scripts/import_occupations.py --limit 280
# optional: python3 scripts/import_occupations.py --limit 280 --fetch-esco

cd web && npm run build
```

Details: `web/data/occupations/README.md`, `web/data/stimuli/README.md`.

## Datenpfade

| Pfad | Inhalt |
|---|---|
| `skillster_daten-komprimiert.pdf` | Quell-PDF (VIST-Profile) |
| `scripts/extract_profiles.py` | PDF → `web/data/profiles/` |
| `scripts/import_occupations.py` | O\*NET/ESCO → `web/data/occupations/occupations.json` |
| `web/data/profiles/` | 16 Ergebnisprofile |
| `web/data/items/mvp-pictorial.json` | ~32 Bilditems (nested weights, unvalidated) |
| `web/data/occupations/occupations.json` | Getrimmte DE-Berufsliste mit RIASEC-Vektoren |
| `web/data/occupations/seed.json` | Kleiner Fallback-Seed |
| `web/data/stimuli/index.json` | Stimulus-Katalog (core SVGs + extra PSE/OASIS-Slots) |
| `web/public/stimuli/core/` | Generierte CC0-artige Motiv-SVGs |
| `web/data/licenses/sources.json` | Lizenzregister (core / extra / owned) |
| `web/src/lib/` | Types, Scoring, Session, Occupations (`lib/README.md`) |

## Flow

1. Assessment speichert Antworten in `sessionStorage` (keine URL-Payload)
2. Mid-session: Fortschritt bleibt; Sticky-Progress; Doppel-Tap-Schutz; „Neu starten“ mit Bestätigung
3. Ergebnisseite: Alltagssprache-Hero + Coverage; PDF/Druck; unvollständig → „Weiter im Test“
4. **HOW:** Plain-Language-Abschnitte primär; VIST-Stichpunkte optional einklappbar + Blend
5. **WHAT:** RIASEC + Top-3 Berufsvorschläge; Details mit Codes/Diagrammen
6. Footer: Lizenz-Attribution (core + owned)

## Extra-Layer (privat)

- **PSE** (`stimuli/extra/pse/`): Motive — nur CC0/CC-BY für Produktpfad; Katalog-Slots ohne Login-Download
- **OASIS** (`stimuli/extra/oasis/`): Affekt/Stress — NC/Research, vor Verkauf austauschen

## Manual smoke / Re-test

```bash
cd web
npm test          # incl. ux-smoke (session resume, plain profile, PDF build)
npm run build
npm run lint
npm run dev
```

Curl route check (SSR): `/` CTA + Marke, `/assessment`, `/ergebnis`, `/profile`, `/profile/enfj` all HTTP 200.

1. Startseite: Marke **Skillster**, CTA „Jetzt starten“, mobil tauglich
2. Assessment: Sticky-Progress; Doppel-Tap-Schutz; Reload setzt fort; „Neu starten“ mit Bestätigung
3. `/ergebnis`: Plain-Language-Hero, Coverage-Chip, PDF/Druck, „Kurzfassung kopieren“, Details
4. `/ergebnis` mit Teilantworten → „Noch nicht fertig“; ohne Session → „Noch kein Ergebnis“
5. `/profile` Liste + `/profile/<code>` Detail (glass layout)

## Next milestones

Prioritized backlog lives in [`docs/GUIDELINES.md`](docs/GUIDELINES.md) §7. Top items:

1. ESCO DE titles (curated German occupation labels)
2. Extra-Layer-Toggle (PSE/OASIS) strikt hinter Feature-Flag
3. Normierung / Validierung der eigenen Items (aktuell: unvalidated)
4. Playwright E2E smoke CI (logical smoke exists; see `web/e2e/README.md`)
5. CC0-Stimulus-Packs (Open Peeps/Humaaans) unter `stimuli/core/`

Alle eigenen Items sind als **unvalidiert** markiert. Bias-Guards in `web/src/lib/bias.ts` sind Heuristiken (Antwortmuster, Abdeckung, Text-Sanitizer, Ausschlussliste) — keine normierte Psychometrie.

## Ergebnis & PDF

Auf `/ergebnis` siehst du eine kurze Orientierung in Alltagssprache (kein Diagnosetest).

- Button **PDF speichern** erzeugt clientseitig `skillster-profil-<rolle>.pdf` (jsPDF).
- Alternativ: Browser-Druck — `@media print` bereitet die Seite auf.
- Profiling-Texte sind **Orientierung** für Jobcoaching, keine klinische Aussage.

