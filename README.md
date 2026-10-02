# Skillster

Privates, lokal laufendes Profiling-Tool für Jobcoaching-Orientierung.

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
npm test
npm run build
```

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
| `web/data/items/mvp-pictorial.json` | ~30 Bilditems (nested weights, unvalidated) |
| `web/data/occupations/occupations.json` | Getrimmte DE-Berufsliste mit RIASEC-Vektoren |
| `web/data/occupations/seed.json` | Kleiner Fallback-Seed |
| `web/data/stimuli/index.json` | Stimulus-Katalog (core SVGs + extra PSE/OASIS-Slots) |
| `web/public/stimuli/core/` | Generierte CC0-artige Motiv-SVGs |
| `web/data/licenses/sources.json` | Lizenzregister (core / extra / owned) |
| `web/src/lib/` | Types, Scoring, Session, Occupations (`lib/README.md`) |

## Flow

1. Assessment speichert Antworten in `sessionStorage`
2. Ergebnis scored clientseitig mit serverübergebenen Profilen/Occupations
3. **HOW:** VIST-Abschnitte + Blend aus Nebenclustern
4. **WHAT:** RIASEC + Matches aus `occupations.json`
5. Footer: Lizenz-Attribution (core + owned)

## Extra-Layer (privat)

- **PSE** (`stimuli/extra/pse/`): Motive — nur CC0/CC-BY für Produktpfad; Katalog-Slots ohne Login-Download
- **OASIS** (`stimuli/extra/oasis/`): Affekt/Stress — NC/Research, vor Verkauf austauschen

1. Assessment speichert Antworten in `sessionStorage` (keine URL-Payload)
2. Mid-session: Fortschritt bleibt; Sticky-Progress; Doppel-Tap-Schutz; „Neu starten“ mit Bestätigung
3. Ergebnisseite liest Session, scored clientseitig mit serverübergebenen Profilen/Seeds
4. Unvollständige Antworten → Hinweis + CTA „Weiter im Test“ (Coverage: „Basierend auf X von Y“)
5. **HOW:** VIST-Abschnitte (einklappbar) + Blend aus Nebenclustern
6. **WHAT:** RIASEC-Balken + Top-3 Berufsvorschläge in Alltagssprache
7. Footer: Lizenz-Attribution (core + owned)

## Manual smoke / Re-test

```bash
cd web
npm test          # Vitest unit + integration (session restore, coverage, catalog, all-A vs all-B)
npm run build
npm run dev
```

1. Startseite: Marke **Skillster**, CTA „Jetzt starten“ im unteren Thumb-Bereich
2. Assessment: Modul-Wechsel sichtbar, Fortschritt sticky, Wahl mit kurzem Pop; Reload mid-session setzt fort
3. „Neu starten“ → Bestätigungsdialog; Abbruch behält Antworten
4. Alle Items → `/ergebnis`: Hero-Muster, Coverage-Hinweis, Achsen, Top-3 Berufe, HOW einklappbar, „Kurzfassung kopieren“
5. `/ergebnis` mit Teilantworten → „Noch nicht fertig“; ohne Session → „Noch kein Ergebnis“

## Next milestones

1. O\*NET / ESCO Occupation-Import (core layer) + Attribution
2. CC0-Stimulus-Packs (Open Peeps/Humaaans) unter `stimuli/core/`
3. Normierung / Validierung der eigenen Items (aktuell: unvalidated)
4. Extra-Layer-Toggle (PSE/OASIS) strikt hinter Feature-Flag
5. Optional: Playwright smoke CI für Start → Assessment → Ergebnis

Alle eigenen Items sind als **unvalidiert** markiert. Bias-Guards in `web/src/lib/bias.ts` sind Heuristiken (Antwortmuster, Abdeckung, Text-Sanitizer, Ausschlussliste) — keine normierte Psychometrie.

## Ergebnis & PDF

Auf `/ergebnis` siehst du eine kurze Orientierung in Alltagssprache (kein Diagnosetest).

- Button **PDF speichern** erzeugt clientseitig `skillster-profil-<rolle>.pdf` (jsPDF).
- Alternativ: Browser-Druck — `@media print` bereitet die Seite auf.
- Profiling-Texte sind **Orientierung** für Jobcoaching, keine klinische Aussage.

