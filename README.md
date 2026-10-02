# Skillster

Privates, lokal laufendes Profiling-Tool für Jobcoaching-Orientierung.

- **Hinten:** große Datenbasis (VIST-Profile, Items, Lizenzen, später O\*NET/ESCO/PSE/OASIS)
- **Vorne:** einfacher Bild-Flow für Laien
- **Strategie:** Kernquellen frei/später verkaufbar; Extra-Quellen (NC) getrennt und austauschbar
- **Scoring:** parallele Persönlichkeit (VIST-Achsen) + Interessen (RIASEC), nested weights (kein Big-Five-E vs. RIASEC-E-Kollision), Zwischenprofile, Antworten in `sessionStorage`

## Start

```bash
cd web
npm install
npm run dev
```

Öffnen: [http://localhost:3000](http://localhost:3000)

Profile neu aus PDF extrahieren:

```bash
python3 scripts/extract_profiles.py
```

## Struktur

| Pfad | Inhalt |
|---|---|
| `skillster_daten-komprimiert.pdf` | Quell-PDF (VIST-Profile) |
| `scripts/extract_profiles.py` | PDF → JSON |
| `web/data/profiles/` | 16 Ergebnisprofile (VIST) |
| `web/data/items/` | Bildgestützte MVP-Items (nested weights) |
| `web/data/occupations/` | RIASEC-Berufsfeld-Seed |
| `web/data/licenses/sources.json` | Lizenzregister (core vs extra) |
| `web/data/stimuli/` | Platz für PSE/OASIS/PDII/CC0 |
| `web/src/lib/` | Types, Scoring, Session, Occupations |
| `web/src/app/` | UI: Start → Assessment → Ergebnis (HOW/WHAT) |

## Flow

1. Assessment speichert Antworten in `sessionStorage` (keine URL-Payload)
2. Ergebnisseite liest Session, scored clientseitig mit serverübergebenen Profilen/Seeds
3. **HOW:** VIST-Abschnitte (Stärken, Motivation, Team, Stress) + Blend aus Nebenclustern
4. **WHAT:** RIASEC-Balken + Berufsfeld-Matches aus dem Seed

## Module (Roadmap)

1. Persönlichkeit (bildgestützt, IPIP-Konstrukte)
2. Interessen / RIASEC (eigene Bilditems + später O\*NET)
3. Motive / PSE (extra)
4. Selbststeuerung / OASIS (extra)
5. Mapping → Zwischenprofile + VIST-Texte

Alle eigenen Items sind als **unvalidiert** markiert.
