# RIASEC Typology — Interactive Career Questionnaire

**Live demo:** [zoooul.github.io/riasec](https://zoooul.github.io/riasec/) · **Repo:** [github.com/zoooul/riasec](https://github.com/zoooul/riasec)

**[English](#english)** · **[Deutsch](#deutsch)**

Interactive Holland RIASEC questionnaire for coaching and career self-reflection — 228 questions, eight languages, local progress, printable PDF. Based on the herbwood coaching questionnaire (© 2018). Vanilla HTML/CSS/JS, no build step.

**Features:** Holland code · hexagon profile · score breakdown · coaching-ready PDF · Deutsch · English · فارسی · Español · Français · Türkçe · Українська · Русский · mobile-friendly · works offline

---

# English

## Find career directions that actually fit — in minutes, in your language.

An interactive Holland RIASEC test for coaching and self-reflection. Eight languages, no installation, one question per screen. Open it in the browser or put the folder on any website.

### What this test is for

This questionnaire does not pick “the one right job”. It makes **vocational interests and abilities visible**, so you can talk about them with a coach, a trusted person, or in your own career planning.

It is based on John L. Holland’s **congruence theory**: satisfaction, success and career stability tend to be higher when a person’s orientation matches the orientation of the work environment.

You receive a **Holland code** — the three strongest of six types — plus a profile you can take into a coaching session.

| Letter | Type |
|--------|------|
| **R** | Realistic — practical, technical, hands-on |
| **I** | Investigative — analytical, scientific, problem-solving |
| **A** | Artistic — creative, expressive, independent |
| **S** | Social — helpful, cooperative, people-focused |
| **E** | Enterprising — persuasive, leadership, business |
| **C** | Conventional — structured, detail-oriented, organised |

### How it is structured

Four parts, **228** steps, six types (R, I, A, S, E, C):

| Part | Items | Scale | What is counted |
|------|--------|-------|-----------------|
| Activities | 11 × 6 = 66 | Like / Dislike | “Like” |
| Abilities | 11 × 6 = 66 | Yes / No | “Yes” |
| Occupations | 14 × 6 = 84 | Yes / No | “Yes” |
| Self-assessment | 12 traits (2 per type) | 1–7 | Sum of both traits |

Per type:

```
Total = Activities + Abilities + Occupations + Self-assessment
```

Maximum per type: **50**. The Holland code is the three highest types (ties broken in R–I–A–S–E–C order).

### How it works

1. Choose a language (detected from the browser, or via the menu). Your choice is remembered.
2. Answer **one question per screen**. Progress is saved locally — you can pause and continue later.
3. Short breaks between parts; a clear instruction before self-assessment.
4. Results: Holland code, hexagon profile, score table, top-type cards, and a **PDF download** with personalised interpretation.

No account, no server, no tracking beyond your own browser storage. Starting a new test while saved progress exists asks for confirmation first — **Continue** always resumes where you left off.

### Why it is useful

- **Ready in a click** — open `index.html`, use the [live demo](https://zoooul.github.io/riasec/), or drop the folder on your site. No login, no backend.
- **Built for phones and desktops** — one question per screen, clear green/red answer buttons, no page scrolling while answering.
- **Truly multilingual** — Deutsch, English, فارسی, Español, Français, Türkçe, Українська, Русский, plus RTL. Add another language with a single file.
- **Coaching-ready** — transparent scoring, detailed PDF report with Holland-code interpretation, language you can share with clients.
- **Yours to host** — static files only. GitHub Pages, any web space, or a USB stick.

### Languages

| Code | Language | File |
|------|----------|------|
| `de` | Deutsch | `js/locales/de.js` |
| `en` | English | `js/locales/en.js` |
| `fa` | فارسی (Persian) | `js/locales/fa.js` |
| `es` | Español | `js/locales/es.js` |
| `fr` | Français | `js/locales/fr.js` |
| `tr` | Türkçe | `js/locales/tr.js` |
| `uk` | Українська (Ukrainian) | `js/locales/uk.js` |
| `ru` | Русский (Russian) | `js/locales/ru.js` |

The UI follows the browser language when possible and stores the last choice in `localStorage`. RTL layout is enabled automatically (e.g. Persian).

#### Add your own language

No build tool required:

1. Copy [`js/locales/_template.js`](js/locales/_template.js) to `js/locales/it.js` (use the ISO 639-1 code).
2. Replace `'xx'` with `'it'` and translate all strings. Keep type letters `R I A S E C` and the colour values.
3. Load the file in [`index.html`](index.html) next to the other locale scripts:

```html
<script src="js/locales/it.js"></script>
```

4. Optional: add `'it'` to `LOCALE_ORDER` in [`js/i18n.js`](js/i18n.js) so it appears in a specific place in the language menu.

The language dropdown is built from every locale that called `registerLocale()`. Do not include `_template.js` in `index.html`.

For right-to-left languages set `meta.dir` to `'rtl'`.

### Run locally

Double-click `index.html`, or serve the folder:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`. Progress is stored in the browser.

### Put it on your website

This is a static site. Copy the whole project folder onto your web space (Apache, nginx, IIS, S3, Netlify, GitHub Pages, …).

- `https://example.com/riasec/` → upload this repo into a `/riasec/` directory
- GitHub Pages: Settings → Pages → Deploy from branch `main`, folder `/` (root) → **https://zoooul.github.io/riasec/**

Paths are relative (`css/`, `js/`), so the app works in a subdirectory.

**PDF export** uses a local copy of jsPDF (`js/lib/jspdf.umd.min.js`) with embedded Unicode fonts (**DejaVu Sans** for Latin/Cyrillic, **Vazirmatn** for Persian) so Deutsch, English, Español, Français, Türkçe, Українська, Русский and فارسی render correctly offline. Persian uses logical Unicode with RTL alignment so PDF viewers can apply OpenType shaping. The report includes industries, example occupations, and a structured interpretation for your top types.

### Project layout

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
│   │   ├── tr.js
│   │   ├── uk.js
│   │   └── ru.js
│   ├── data.js
│   ├── scoring.js
│   ├── pdf-report.js
│   ├── lib/
│   │   ├── jspdf.umd.min.js
│   │   └── fonts/           # DejaVu + Vazirmatn (base64) + licenses
│   └── app.js
├── .gitignore
└── README.md
```

Vanilla HTML, CSS and JavaScript. No Node.js, no bundler.

### Credits

- RIASEC model: John L. Holland
- Questionnaire content: © herbwood coaching, 2018
- This repository: interactive web implementation (frontend)

---

# Deutsch

## Berufliche Richtungen finden, die wirklich passen — in Minuten, in Ihrer Sprache.

Ein interaktiver Holland-RIASEC-Test für Coaching und Selbstklärung. Acht Sprachen, keine Installation, eine Frage pro Bildschirm. Im Browser öffnen oder als Ordner auf jede Website legen.

### Wozu dieser Test da ist

Der Fragebogen bestimmt nicht „den einen richtigen Beruf“. Er macht **berufliche Interessen und Fähigkeiten sichtbar**, damit Sie sie mit einem Coach, Vertrauten oder in Ihrer eigenen Planung besprechen können.

Grundlage ist John L. Hollands **Kongruenz-Theorie**: Zufriedenheit, Erfolg und Stabilität der Karriere sind tendenziell höher, wenn die Orientierung der Person zur Orientierung des Arbeitsumfelds passt.

Sie erhalten einen **Holland-Code** — die drei stärksten von sechs Typen — plus ein Profil für das Coaching-Gespräch.

| Buchstabe | Typ |
|-----------|-----|
| **R** | Realistisch — praktisch, technisch, handlungsorientiert |
| **I** | Forschend — analytisch, wissenschaftlich, problemlösend |
| **A** | Künstlerisch — kreativ, expressiv, unabhängig |
| **S** | Sozial — hilfsbereit, kooperativ, menschenbezogen |
| **E** | Unternehmerisch — überzeugend, führungsstark, geschäftlich |
| **C** | Traditionell — strukturiert, detailorientiert, organisiert |

### Wie der Test aufgebaut ist

Vier Teile, **228** Schritte, sechs Typen (R, I, A, S, E, C):

| Teil | Items | Skala | Gewertet |
|------|--------|-------|----------|
| Tätigkeiten | 11 × 6 = 66 | Gern / Ungern | „Gern“ |
| Fähigkeiten | 11 × 6 = 66 | Ja / Nein | „Ja“ |
| Berufliche Sympathien | 14 × 6 = 84 | Ja / Nein | „Ja“ |
| Selbsteinschätzung | 12 Eigenschaften (2 pro Typ) | 1–7 | Summe beider Eigenschaften |

Pro Typ:

```
Gesamtwert = Tätigkeiten + Fähigkeiten + Berufe + Selbsteinschätzung
```

Maximum pro Typ: **50**. Der Holland-Code sind die drei höchsten Typen (Gleichstand in der Reihenfolge R–I–A–S–E–C).

### Wie er funktioniert

1. Sprache wählen (Browsererkennung oder Menü). Die Wahl wird gespeichert.
2. **Eine Frage pro Bildschirm** beantworten. Der Fortschritt bleibt lokal erhalten — Unterbrechen und später weitermachen ist möglich.
3. Kurze Pausen zwischen den Teilen; eine klare Anleitung vor der Selbsteinschätzung.
4. Auswertung: Holland-Code, Hexagon-Profil, Wertetabelle, Typkarten und **PDF-Download** mit personalisierter Interpretation.

Kein Konto, kein Server, keine Tracking-Daten außerhalb Ihres Browsers. Beim Neustart mit gespeichertem Fortschritt erscheint eine Rückfrage — **Fortsetzen** setzt immer dort fort, wo Sie aufgehört haben.

### Der Mehrwert

- **Sofort startklar** — `index.html` öffnen, [Live-Demo](https://zoooul.github.io/riasec/) nutzen oder den Ordner auf die Website legen. Kein Login, kein Backend.
- **Für Handy und Desktop gebaut** — eine Frage pro Bildschirm, klare grün/rote Antwortbuttons, kein Seitenscrollen während des Tests.
- **Wirklich mehrsprachig** — Deutsch, English, فارسی, Español, Français, Türkçe, Українська, Русский, plus RTL. Weitere Sprache mit einer Datei.
- **Coaching-tauglich** — nachvollziehbare Berechnung, ausführlicher PDF-Bericht mit Holland-Code-Interpretation, Sprache der Klientinnen und Klienten.
- **Selbst hosten** — nur statische Dateien. GitHub Pages, jeder Webspace oder ein USB-Stick.

### Sprachen

| Code | Sprache | Datei |
|------|---------|-------|
| `de` | Deutsch | `js/locales/de.js` |
| `en` | English | `js/locales/en.js` |
| `fa` | فارسی (Persisch) | `js/locales/fa.js` |
| `es` | Español | `js/locales/es.js` |
| `fr` | Français | `js/locales/fr.js` |
| `tr` | Türkçe | `js/locales/tr.js` |
| `uk` | Українська (Ukrainisch) | `js/locales/uk.js` |
| `ru` | Русский (Russisch) | `js/locales/ru.js` |

Die Oberfläche folgt möglichst der Browsersprache und merkt sich die letzte Wahl in `localStorage`. RTL wird automatisch aktiv (z. B. Persisch).

#### Eigene Sprache ergänzen

Kein Build-Schritt nötig:

1. [`js/locales/_template.js`](js/locales/_template.js) nach `js/locales/it.js` kopieren (ISO-639-1-Code).
2. `'xx'` durch `'it'` ersetzen und alle Texte übersetzen. Buchstaben `R I A S E C` und die Farben beibehalten.
3. Die Datei in [`index.html`](index.html) neben den anderen Locale-Scripts laden:

```html
<script src="js/locales/it.js"></script>
```

4. Optional `'it'` in `LOCALE_ORDER` in [`js/i18n.js`](js/i18n.js) eintragen, damit die Sprache an einer bestimmten Stelle im Menü steht.

Das Sprachmenü entsteht aus jeder Datei, die `registerLocale()` aufruft. `_template.js` nicht in `index.html` einbinden.

Für Rechts-nach-links-Sprachen `meta.dir` auf `'rtl'` setzen.

### Lokal starten

Doppelklick auf `index.html` oder Ordner bereitstellen:

```bash
python -m http.server 8080
```

Danach `http://localhost:8080` öffnen. Der Fortschritt liegt im Browser.

### Auf die eigene Website bringen

Statische Seite. Den gesamten Projektordner auf den Webspace kopieren (Apache, nginx, IIS, S3, Netlify, GitHub Pages, …).

- `https://example.com/riasec/` → Inhalt dieses Repos in ein Verzeichnis `/riasec/` legen
- GitHub Pages: Settings → Pages → Deploy from branch `main`, Ordner `/` (root) → **https://zoooul.github.io/riasec/**

Pfade sind relativ (`css/`, `js/`), die App läuft also auch in einem Unterordner.

**PDF-Export** nutzt eine lokale Kopie von jsPDF (`js/lib/jspdf.umd.min.js`) mit eingebetteten Unicode-Schriften (**DejaVu Sans** für Latein/Kyrillisch, **Vazirmatn** für Persisch), sodass Deutsch, English, Español, Français, Türkçe, Українська, Русский und فارسی offline korrekt dargestellt werden. Persisch nutzt logisches Unicode mit RTL-Ausrichtung, damit PDF-Viewer OpenType-Shaping anwenden können. Der Bericht enthält Branchen, Beispielberufe und eine strukturierte Interpretation der Top-Typen.

### Projektstruktur

```
riasec/
├── index.html
├── css/styles.css
├── js/
│   ├── i18n.js              # Sprachsystem
│   ├── locales/
│   │   ├── _template.js     # Vorlage für neue Sprachen
│   │   ├── de.js
│   │   ├── en.js
│   │   ├── fa.js
│   │   ├── es.js
│   │   ├── fr.js
│   │   ├── tr.js
│   │   ├── uk.js
│   │   └── ru.js
│   ├── data.js
│   ├── scoring.js
│   ├── pdf-report.js
│   ├── lib/
│   │   ├── jspdf.umd.min.js
│   │   └── fonts/           # DejaVu + Vazirmatn (Base64) + Lizenzen
│   └── app.js
├── .gitignore
└── README.md
```

Reines HTML, CSS und JavaScript. Kein Node.js, kein Bundler.

### Credits

- RIASEC-Modell: John L. Holland
- Fragebogen-Inhalt: © herbwood coaching, 2018
- Dieses Repository: interaktive Web-Umsetzung (Frontend)
