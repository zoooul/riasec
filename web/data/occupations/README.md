# Occupations data

## Files

| File | Role |
|---|---|
| `occupations.json` | Primary matching set (seed DE + trimmed O\*NET RIASEC) |
| `seed.json` | Small DE domain-bucket fallback |

## Refresh

```bash
# From repo root — uses cached /tmp O*NET text DB or downloads db_31_0_text.zip
python3 scripts/import_occupations.py
python3 scripts/import_occupations.py --limit 200

# --fetch-esco is reserved (prints a note); DE titles for O*NET rows
# currently use English until ESCO merge is wired.
```

Or from `web/`:

```bash
npm run import:occupations
```

Then:

```bash
cd web && npm test && npm run build
```

## Licenses

- **O\*NET® Database** — CC BY 4.0 (attribution required). O\*NET® is a trademark of the U.S. Department of Labor.
- **ESCO** — planned for DE titles; EU reuse decision 2011/833/EU.
