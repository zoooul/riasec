# Skillster

Privates, lokal laufendes Profiling-Tool für Jobcoaching-Orientierung.

- **Hinten:** große Datenbasis (VIST-Profile, Items, Lizenzen, später O\*NET/ESCO/PSE/OASIS)
- **Vorne:** einfacher Bild-Flow für Laien
- **Strategie:** Kernquellen frei/später verkaufbar; Extra-Quellen (NC) getrennt und austauschbar

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
| `web/data/profiles/` | 16 Ergebnisprofile |
| `web/data/items/` | Bildgestützte MVP-Items |
| `web/data/licenses/sources.json` | Lizenzregister (core vs extra) |
| `web/data/stimuli/` | Platz für PSE/OASIS/PDII/CC0 |
| `web/src/app/` | UI: Start → Assessment → Ergebnis |

## Module (Roadmap)

1. Persönlichkeit (bildgestützt, IPIP-Konstrukte)
2. Interessen / RIASEC (eigene Bilditems + später O\*NET)
3. Motive / PSE (extra)
4. Selbststeuerung / OASIS (extra)
5. Mapping → Zwischenprofile + VIST-Texte

Alle eigenen Items sind als **unvalidiert** markiert.
