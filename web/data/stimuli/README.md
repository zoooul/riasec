# Stimuli layers

Pictorial assets for AssessmentFlow / VisualCard. Catalog: `index.json`.

## core/ (prefer for product path)

| Source | License | Status |
|---|---|---|
| Generated geometric motifs in `web/public/stimuli/core/` | CC0-style / own construction | **shipped** (fallback + catalog) |
| [Open Peeps](https://www.openpeeps.com/) | CC0 | Drop PNGs/SVGs here; set `assetPath` in `index.json` |
| [Humaaans](https://www.humaaans.com/) | CC0 | Same as Open Peeps |

UI resolves `choice.visual.motif` → catalog `assetPath`. If missing, VisualCard draws the SVG motif.

## extra/ (private enrichment, swappable)

### `extra/pse/` — Picture Story Exercise
- Source: https://osf.io/pqckn/
- Licenses: **per-image** (prefer CC0 / CC-BY for any product path)
- Download: OSF often requires account; if blocked, keep catalog entries without `assetPath` and use in-app motifs
- Drop allowed images + update `index.json` rows (`layer: "extra"`)

### `extra/oasis/` — OASIS affective set
- Source: https://osf.io/6pnd7/
- License: research / reportedly CC BY-NC-SA → **private only**
- Swap out before commercial ship

### `extra/pdii/`
- Pictorial interest images if obtained; otherwise own CC0 job scenes

## Sidecar schema

Each `index.json` entry:

```json
{
  "id": "core-workshop",
  "motif": "workshop",
  "kind": "scene",
  "sourceId": "own-generated-patterns",
  "license": "CC0 / own_construction",
  "layer": "core",
  "attribution": "…",
  "validationStatus": "unvalidated",
  "assetPath": "/stimuli/core/workshop.svg"
}
```

## Refresh

1. Add files under `web/public/stimuli/…`
2. Update `web/data/stimuli/index.json`
3. `npm run build` in `web/`
