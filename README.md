# Skillster

Privates, lokal laufendes Profiling-Tool für Jobcoaching-Orientierung.

- **Hinten:** VIST-Profile, pictorial Items, O\*NET/ESCO-Berufe, Stimuli, Lizenzen (PSE/OASIS extra)
- **Vorne:** einfacher Bild-Flow für Laien (liquid-glass UI)
- **Strategie:** Kernquellen frei/verkaufbar; Extra (NC) getrennt und austauschbar
- **Scoring:** Persönlichkeit (VIST-Achsen) + Interessen (RIASEC), nested weights, Zwischenprofile, `sessionStorage`

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

Alle eigenen Items sind als **unvalidiert** markiert.

## Ergebnis & PDF

Auf `/ergebnis` siehst du eine kurze Orientierung in Alltagssprache (kein Diagnosetest).

- Button **PDF speichern** erzeugt clientseitig `skillster-profil-<rolle>.pdf` (jsPDF).
- Alternativ: Browser-Druck — `@media print` bereitet die Seite auf.
- Profiling-Texte sind **Orientierung** für Jobcoaching, keine klinische Aussage.

