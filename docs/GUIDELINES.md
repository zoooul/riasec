# Skillster Guidelines

Product rules for profiling quality, fairness, UX copy, and outputs.
Testable rules are encoded as Vitest **soft** (heuristic/warn) or **hard** (must pass) assertions under `web/src/lib/__tests__/`.

Run: `cd web && npm test` · hard-only: `npm run test:hard`

---

## 1. Product rules

| Rule | Meaning |
|---|---|
| **HOW vs WHAT** | **HOW** = Persönlichkeit / Arbeitsstil (VIST-Achsen → Plain-Language + optionale Profil-Stichpunkte). **WHAT** = Interessen / Berufe (RIASEC → Felder + Occupation-Matches). Never mix letter-codes into the primary HOW view. |
| **Zwischenprofile** | When `|axis| < ZWISCHEN_THRESHOLD` (18), speak in everyday German (“teils …, teils …”) — never “zwischen E und I”. |
| **Private-first** | Answers live in `sessionStorage`. No URL payload of answers. Local/dev-first; no clinical backend. |
| **Unvalidated own items** | MVP pictorial items are `validationStatus: "unvalidated"`. UI and PDF must frame results as **Orientierung**, not diagnosis or aptitude. |

## 2. License layers

| Layer | Use |
|---|---|
| **core** | Free / later-sellable with attribution (IPIP PD, O\*NET CC BY, ESCO, own CC0 stimuli). Product path. |
| **extra** | Private/NC/research enrichment (PSE mixed, OASIS NC, PDII, UMS). Feature-flag only; swap before commercial ship. |
| **owned** | User-owned VIST profile narratives. Attribution as owned source. |

Source of truth: `web/data/licenses/sources.json`. Frontend footer shows core + owned; extra stays off by default.

## 3. Bias / fairness guards

Implemented in `web/src/lib/bias.ts` (heuristics — not psychometrics).

| Guard | Trigger | Effect |
|---|---|---|
| **Acquiescence** | ≥4 answers and ≥80% same choice index | `qualityLabel: unsicher`, confidence ≤ medium, caution preface |
| **Low coverage** | answered / items &lt; 0.5 | `qualityLabel: orientierung`, confidence low, ≤2 jobs, soften occupation claims |
| **Missing modules** | catalog stage unanswered (warmup → … → abschluss) | folds into low confidence / Orientierung preface |
| **Absolute language** | immer / nie / niemals / perfekt / absolut / stets | sanitizer → oft / selten / sehr gut / eher |
| **Trait exclusions** | always | fixed list (no clinical, IQ, ethnicity, politics/religion, orientation, medical claims) |
| **Catalog balance** | soft max/min ratios on RIASEC/axis abs weights | soft warn if ratio &gt; 2.5 (hits &gt; 3) |

## 4. UX copy rules

- Short German; Du-form.
- **Primary view** (hero, HOW, attractive fields, tips): no raw axis codes (`E_I`), no MBTI letter soup (`ENTJ` in hero lines — prefer role words). Codes OK only under “Details”.
- No clinical claims (“Diagnose”, “Störung”, “Therapie”) in primary copy.
- Sentence length soft cap for primary lines: ~140 chars (tips/how); oneLine may be slightly longer.
- Banned absolute words must not survive the sanitizer on result text.

### Aufgaben-Format (induktiv)

- Items are **Mini-Aufgaben** with `task.kind` ∈ `scene` | `pattern` | `solve` and a short `task.title` — not survey buttons.
- Copy invites noticing / first impulse (induction-style), never names the measured pole.
- Choices are **Lösungspfade** (Weg A/B): concrete situations + Bildsprache; no trait lexemes (`TRANSPARENCY_BANNED` in `assessmentStructure.ts`).
- Soft UI: solution cards over primary CTAs; journey/station framing over exam meters.

## 5. Output rules

### Ergebnis (`/ergebnis`)

1. Quality chip (`ok` / `unsicher` / `orientierung`) + role + oneLine + coverage
2. So arbeitest du (HOW bullets)
3. Was dich anzieht (fields + ≤3 jobs; ≤2 under Orientierung)
4. Tipps + short disclaimer
5. Optional HOW profile expand + Blend
6. **Was wir nicht messen** (exclusions — always when result is shown)
7. Details (codes & diagrams) collapsed

Incomplete mid-run → resume CTA; still surface exclusions + Orientierung framing when sparse.

### PDF (`buildProfilePdf`)

1. Zusammenfassung (+ Qualität label when not `ok`)
2. So arbeitest du
3. Passende Felder (+ occupation examples when present)
4. Tipps
5. Hinweis / Disclaimer + Ausschlüsse + Quellen footer

Always include the orientation disclaimer. Never claim diagnosis or validated aptitude.

## 6. Soft vs hard tests

| Soft (heuristic) | Hard (must never fail) |
|---|---|
| UX copy: no axis jargon in primary plainProfile lines; sentence length caps; no absolute words after sanitizer | Nested weights: Big-Five E ≠ RIASEC E collision; scoring determinism |
| Catalog balance soft ratios | all-A ≠ all-B primary |
| Profile JSON core sections non-empty | acquiescence → unsicher; sparse → orientierung + ≤2 jobs |
| **Module map**: all items assigned; no orphan stages; stage intros ≤72 chars; prompts/labels/task titles short | exclusions always present; quality label set |
| **Progress math**: answered/total %, stage boundaries, Teil i/n | PDF helper does not throw; plainProfile has required keys |
| **AssessmentFlow smoke** (jsdom): first task + station chip + Lösungspfade render | Item catalog: unique ids, nested weights, 2 choices, canonical `ITEM_SEQUENCE` |
| | occupations.json loads; `matchOccupations` returns sorted scores |
| | **Coverage floors**: each axis ≥3 items; each RIASEC letter ≥1; every stage ≥2 items |
| | **Module × trait matrix**: Warmup E_I, Wahrnehmen S_N, Entscheiden T_F, Energie E_I/J_P, Interessen all RIASEC, Abschluss ≥6 |
| | Zwischenprofile when `\|axis\| < 18` still worded (“teils …”) |
| | **Task format**: every item has `task.kind` + title; scene/pattern/solve all present |
| | **Anti-transparency**: no `TRANSPARENCY_BANNED` / MBTI soup in choice labels+hints |
| | **Valence mix**: per HOW axis, left choice is not always the same sign |
| | **Soft boundary weights**: selected items keep \|axis\| in ~18–26 for Zwischenprofile |

### Assessment stages (source of truth)

Order in `web/src/lib/assessmentStructure.ts` + `mvp-pictorial.json` v7:

1. **Ankommen** (`warmup`) — inductive E_I openers  
2. **Wahrnehmen** (`wahrnehmen`) — S_N via scene/pattern/solve  
3. **Entscheiden** (`entscheiden`) — T_F  
4. **Energie** (`energie`) — remaining E_I + J_P  
5. **Anziehung** (`interessen`) — RIASEC interleaved as tasks  
6. **Druck & Antrieb** (`abschluss`) — stress ↔ motives mixed  

Progress UI shows station chip + Teil i/n + overall %; choice lock + session resume (“Weiter bei Aufgabe X”) stay mandatory.

---

## 7. Backlog — implement next

Prioritized from gaps found during this guidelines / hard-test pass:

1. **ESCO DE titles** — finish curated German occupation titles (`import_occupations.py --fetch-esco`); drop EN fallbacks in product UI.
2. **PSE / OASIS feature-flag toggle** — strict off-by-default extra stimuli; document swap path for commercial builds.
3. **Norming / validation** — replace unvalidated pictorial weights with at least a pilot norm sample; keep “Orientierung” until then.
4. **Playwright E2E** — Start → Assessment → Ergebnis → PDF smoke in CI (logical smoke exists; browser E2E still manual — see `web/e2e/README.md`).
5. **Fill VIST HOW gaps** — soft test found missing `stress` (ENTP, ISFP) and `rolle_im_team` (ESFJ, ESTP, INFJ); re-extract or hand-fill so all 16 profiles cover HOW_SECTIONS.
6. **Incomplete Ergebnis preview** — optional “vorläufige Orientierung ansehen” for sparse runs instead of only resume CTA (exclusions already shown on incomplete screen).
7. **Open Peeps / Humaaans core pack** — replace geometric SVG placeholders with accessible illustration tiles.
8. **RIASEC interest items expansion** — more balanced pictorial interest tiles if soft balance drifts.
9. **Accessibility pass** — focus order, contrast on DaisyUI badges/alerts, reduced-motion for transitions.
10. **Left/right valence alternation** — hard-tested polarity mix exists; keep expanding within-stage flips as the catalog grows.
11. **Richer inductive micro-tasks** — optional timed notice / dual-image morph without mid-test score reveal (still forced-choice scoring).

---

## Pointers

- Structure / stages: `web/src/lib/assessmentStructure.ts`
- Scoring: `web/src/lib/scoring.ts`
- Bias: `web/src/lib/bias.ts`
- Plain language: `web/src/lib/plainLanguage.ts`
- PDF: `web/src/lib/profilePdf.ts`
- Licenses: `web/data/licenses/sources.json`
- Manual smoke checklist: root `README.md`
