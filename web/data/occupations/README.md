# Occupations data

## Files

| File | Role |
|---|---|
| `occupations.json` | Primary matching set (~trimmed O*NET RIASEC + DE titles) |
| `seed.json` | Small domain-bucket fallback / smoke set |

## Refresh

```bash
# From repo root — downloads O*NET Interests + Occupation Data into /tmp/skillster-occ
python3 scripts/import_occupations.py --limit 350

# Optional: enrich missing DE titles via ESCO API (rate-limited)
python3 scripts/import_occupations.py --limit 350 --fetch-esco
```

Then rebuild:

```bash
cd web && npm run build
```

## Licenses

- **O*NET® Database** — CC BY 4.0 (attribution required). O*NET® is a trademark of the U.S. Department of Labor.
- **ESCO** — European Commission reuse decision 2011/833/EU. Attribution: This service uses the ESCO classification of the European Commission.
