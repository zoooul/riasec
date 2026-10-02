# E2E / browser smoke

Playwright is **not** wired yet (setup &gt;15 min deferred). Use logical Vitest smoke + the manual checklist below.

## Automated (current)

```bash
cd web
npm test            # includes ux-smoke logical path
npm run test:hard   # hard guidelines only
```

Critical path covered logically in `src/lib/__tests__/ux-smoke.test.ts` and `hard-guidelines.test.ts`:
session resume → scoreAssessment → plainProfile → PDF build → exclusions/quality.

## Manual checklist

1. `npm run dev` → `/` shows **Skillster** + CTA „Jetzt starten“
2. Assessment: sticky progress, choice lock, reload resumes, „Neu starten“ confirms
3. Finish all items → `/ergebnis`: Qualität-Chip, plain hero, exclusions („Was wir nicht messen“), PDF speichern
4. Sparse answers: incomplete screen or Orientierung framing; never diagnostic language
5. Acquiescence (always same side): chip „Etwas unsicher“
6. `/profile` + `/profile/enfj` load

## When adding Playwright

Suggested package: `@playwright/test`. Smoke: home → assessment (2 choices) → ergebnis empty/incomplete → full fixture via sessionStorage seed → assert role heading + exclusions text + PDF button.
