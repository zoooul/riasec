# RIASEC Typology — Interactive Career Questionnaire

Frontend-only web app for the Holland RIASEC interest inventory.  
No build step, no server required. Open `index.html` or drop the folder on any static host.

Interactive implementation of the RIASEC questionnaire (© herbwood coaching, 2018).

---

## Languages

| Code | Language | File |
|------|----------|------|
| `de` | Deutsch | `js/locales/de.js` |
| `en` | English | `js/locales/en.js` |
| `fa` | فارسی (Persian) | `js/locales/fa.js` |
| `es` | Español | `js/locales/es.js` |
| `fr` | Français | `js/locales/fr.js` |
| `tr` | Türkçe | `js/locales/tr.js` |

The UI follows the browser language when possible, and remembers the last choice in `localStorage`. RTL layout is enabled automatically (e.g. Persian).

### Add your own language

You can add languages without a build tool:

1. Copy [`js/locales/_template.js`](js/locales/_template.js) to `js/locales/it.js` (use the ISO 639-1 code).
2. Replace `'xx'` with `'it'` and translate all strings. Keep type letters `R I A S E C` and the colour values.
3. Load the file in [`index.html`](index.html) next to the other locale scripts:

```html
<script src="js/locales/it.js"></script>
```

4. Optional: add `'it'` to `LOCALE_ORDER` in [`js/i18n.js`](js/i18n.js) so it appears in a specific place in the language menu.

The language dropdown is built from every locale that called `registerLocale()`. Unused template files must not be included in `index.html`.

For right-to-left languages set `meta.dir` to `'rtl'`.

---

## Run locally

Double-click `index.html`, or serve the folder:

```bash
# optional
python -m http.server 8080
```

Then open `http://localhost:8080`.

Progress is stored in the browser (`localStorage`).

---

## Put it on your website

This is a static site. Copy the whole project folder onto your web space (Apache, nginx, IIS, S3, Netlify, GitHub Pages, …).

Examples:

- `https://example.com/riasec/` → upload the contents of this repo into a `/riasec/` directory
- GitHub Pages: Settings → Pages → Deploy from branch `main` / root (`/`)

Paths are relative (`css/`, `js/`), so the app works in a subdirectory.

**PDF export** uses a local copy of jsPDF (`js/lib/jspdf.umd.min.js`) and works offline. Non-Latin scripts (Persian, and some others) may not render fully in the PDF because the built-in PDF font is Helvetica. The on-screen questionnaire is complete in all languages.

---

## Scoring

| Part | Items per type | Scale | Counted |
|------|----------------|-------|---------|
| Activities | 11 × 6 = 66 | Like / Dislike | “Like” |
| Abilities | 11 × 6 = 66 | Yes / No | “Yes” |
| Occupations | 14 × 6 = 84 | Yes / No | “Yes” |
| Self-assessment | 12 traits (2 per type) | 1–7 | Sum of both traits |

**228** answer steps. Per type:

```
Total = Activities + Abilities + Occupations + Self-assessment
```

Maximum per type: **50**. Holland code = the three highest types (ties broken in R-I-A-S-E-C order).

---

## Project layout

```
riasec/
├── index.html
├── css/styles.css
├── js/
│   ├── i18n.js              # language system
│   ├── locales/
│   │   ├── _template.js     # copy this to add a language
│   │   ├── de.js
│   │   ├── en.js
│   │   ├── fa.js
│   │   ├── es.js
│   │   ├── fr.js
│   │   └── tr.js
│   ├── data.js
│   ├── scoring.js
│   ├── pdf-report.js
│   ├── lib/jspdf.umd.min.js
│   └── app.js
├── .gitignore
└── README.md
```

Vanilla HTML, CSS and JavaScript. No Node.js, no bundler.

---

## Features

- One question per screen, compact viewport layout (mobile and desktop)
- Six languages out of the box; more can be added as a single JS file
- Section intros, pauses, progress bar, resume after interrupt
- Results: Holland code, hexagon profile, score table, type cards, PDF download
- RTL support

---

## Credits

- RIASEC model: John L. Holland
- Questionnaire content: © herbwood coaching, 2018
- This repository: interactive web implementation (frontend)

---

## Deutsch

Interaktive Web-Umsetzung des RIASEC-Fragebogens. Die App läuft ohne Installation im Browser und kann als Ordner auf jede Website oder nach GitHub Pages kopiert werden.

**Sprache selbst ergänzen:** `_template.js` kopieren, übersetzen, Script-Tag in `index.html` einfügen. Die Sprachauswahl füllt sich automatisch.

Auswertung: Gesamtwert = Tätigkeiten + Fähigkeiten + Berufe + Selbsteinschätzung (max. 50). Holland-Code = die drei höchsten Typen.
