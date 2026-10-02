# Skillster Web-App

Next.js-Frontend für **Skillster** — bildgestütztes Assessment, Ergebnis in Alltagssprache, PDF-Export. Gesamtprojekt: [`../README.md`](../README.md) · Regeln: [`../docs/GUIDELINES.md`](../docs/GUIDELINES.md).

---

## Entwicklung

```bash
npm install
npm run dev        # http://localhost:3000
npm test
npm run test:hard
npm run build
npm run lint
```

NPM-Scripts aus dem Repo-Root:

- `npm run extract:profiles` → `python3 ../scripts/extract_profiles.py`
- `npm run import:occupations` → `python3 ../scripts/import_occupations.py`

---

## Routen

| Pfad | Beschreibung |
|------|----------------|
| `/` | Landing, CTA Assessment |
| `/assessment` | Bild-Flow (`AssessmentFlow`, `VisualCard`) |
| `/ergebnis` | Scoring client-seitig, HOW/WHAT, PDF |
| `/profile`, `/profile/[code]` | 16 VIST-Profilseiten (Referenz) |

**API:** `GET /api/health`, `GET /api/items`, `POST /api/score` — siehe [`../README.md`](../README.md#api-route-handlers).

---

## Wichtige Pfade

| Pfad | Rolle |
|------|--------|
| `data/items/mvp-pictorial.json` | Fragen, Gewichte, Motiv-IDs |
| `data/stimuli/index.json` | Katalog → `public/stimuli/core/*.svg` |
| `data/profiles/` | Ergebnis-HOW-Texte |
| `data/occupations/occupations.json` | RIASEC-Matching |
| `src/lib/scoring.ts`, `bias.ts`, `plainLanguage.ts`, `profilePdf.ts` | Kernlogik |
| `src/components/AssessmentFlow.tsx`, `VisualCard.tsx`, `ErgebnisClient.tsx` | UI |

Lib-Doku: [`src/lib/README.md`](src/lib/README.md).

---

## UI

**Free template baseline:** [DaisyUI Next.js Landing Page Template (TS)](https://github.com/robbins23/landing-nextjs-ts-template) — **MIT**. Classical patterns (navbar, hero, cards, footer) adapted to Skillster; DaisyUI `steps` for the assessment wizard. DaisyUI library: [MIT](https://github.com/saadeghi/daisyui/blob/master/LICENSE). No paid themes.

| Route | Template pattern |
|-------|------------------|
| `/` | Hero + CTA + feature card grid |
| `/assessment` | Navbar + steps wizard + choice cards |
| `/ergebnis` | Summary card + section cards + collapse details |
| `/profile` | Card grid / detail cards |
| Shell | `SiteHeader` navbar + `AppShell` footer |

- **DaisyUI 5** (`@plugin "daisyui"`) + custom theme `skillster` in `src/app/globals.css`
- Components: `btn` / `badge` / `card` / `progress` / `modal` / `collapse` / `steps` / `footer` / `hero`
- **Motion** for light transitions; Tabler Icons; Tailwind CSS v4
- Antworten nur in **`sessionStorage`** — keine URL-Payload

Stimuli-Layer: [`data/stimuli/README.md`](data/stimuli/README.md).

---

## Tests

Vitest unter `src/lib/__tests__/`. Hard-Guidelines: `npm run test:hard` (Katalog, Scoring, Bias, PDF, Exclusions). E2E-Plan: [`e2e/README.md`](e2e/README.md).
