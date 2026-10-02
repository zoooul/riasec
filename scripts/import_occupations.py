#!/usr/bin/env python3
"""Import O*NET Career Interest Types into Skillster occupation JSON.

Downloads (or reuses) the O*NET text database, builds RIASEC vectors per
occupation, trims to a balanced subset, and writes:

  web/data/occupations/occupations.json

German titles: uses Occupation Data English title as `titleDe` fallback and
keeps seed DE labels merged. Full ESCO DE merge can be added later when a
stable download URL is available.

License: O*NET Database CC BY 4.0 — attribution required.
"""

from __future__ import annotations

import csv
import io
import json
import zipfile
from collections import defaultdict
from pathlib import Path
import argparse
from urllib.request import urlretrieve

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "web" / "data" / "occupations" / "occupations.json"
SEED = ROOT / "web" / "data" / "occupations" / "seed.json"
CACHE_ZIP = Path("/tmp/onet_db_31_0_text.zip")
CACHE_DIR = Path("/tmp/onet_db_31_0_text")

ONET_URL = "https://www.onetcenter.org/dl_files/database/db_31_0_text.zip"

ELEMENT_TO_RIASEC = {
    "Realistic": "R",
    "Investigative": "I",
    "Artistic": "A",
    "Social": "S",
    "Enterprising": "E",
    "Conventional": "C",
}

PER_HIGHPOINT = 55  # ~330 occupations after trim


def ensure_onet() -> Path:
    if (CACHE_DIR / "Career Interest Types.txt").exists():
        return CACHE_DIR
    nested = Path("/tmp/onet_db/db_31_0_text")
    if (nested / "Career Interest Types.txt").exists():
        return nested

    print(f"Downloading O*NET database from {ONET_URL} …")
    urlretrieve(ONET_URL, CACHE_ZIP)
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(CACHE_ZIP) as zf:
        zf.extractall(CACHE_DIR.parent)
    # zip contains db_31_0_text/
    extracted = CACHE_DIR.parent / "db_31_0_text"
    if extracted.exists():
        return extracted
    return CACHE_DIR


def read_tsv(path: Path) -> list[dict[str, str]]:
    text = path.read_text(encoding="utf-8", errors="replace")
    return list(csv.DictReader(io.StringIO(text), delimiter="\t"))


def load_titles(base: Path) -> dict[str, str]:
    rows = read_tsv(base / "Occupation Data.txt")
    return {r["O*NET-SOC Code"].strip(): r["Title"].strip() for r in rows if r.get("Title")}


def load_vectors(base: Path) -> dict[str, dict[str, float]]:
    rows = read_tsv(base / "Career Interest Types.txt")
    vectors: dict[str, dict[str, float]] = defaultdict(lambda: {k: 0.0 for k in "RIASEC"})
    for row in rows:
        code = row.get("O*NET-SOC Code", "").strip()
        name = row.get("Element Name", "").strip()
        scale = row.get("Scale ID", "").strip()
        if scale != "OI":
            continue
        letter = ELEMENT_TO_RIASEC.get(name)
        if not code or not letter:
            continue
        try:
            value = float(row["Data Value"])
        except (KeyError, ValueError):
            continue
        # OI roughly 1–7 → 0–100
        vectors[code][letter] = max(0.0, min(100.0, (value / 7.0) * 100.0))
    return vectors


def highpoint(vector: dict[str, float]) -> str:
    ordered = sorted(vector.items(), key=lambda kv: (-kv[1], kv[0]))
    return "".join(letter for letter, _ in ordered[:3])


def trim_balanced(
    items: list[dict],
    per_bucket: int,
) -> list[dict]:
    buckets: dict[str, list[dict]] = defaultdict(list)
    for item in items:
        buckets[item["riasec"][:1] or "X"].append(item)
    for key in buckets:
        buckets[key].sort(key=lambda o: -max(o["vector"].values()))
    out: list[dict] = []
    for key in "RIASEC":
        out.extend(buckets.get(key, [])[:per_bucket])
    # stable unique by id
    seen = set()
    unique = []
    for o in out:
        if o["id"] in seen:
            continue
        seen.add(o["id"])
        unique.append(o)
    return unique


def load_seed() -> list[dict]:
    if not SEED.exists():
        return []
    data = json.loads(SEED.read_text(encoding="utf-8"))
    return data.get("occupations", [])


def main() -> None:
    parser = argparse.ArgumentParser(description="Import O*NET RIASEC occupations")
    parser.add_argument("--limit", type=int, default=0, help="Max occupations after trim (0 = use PER_HIGHPOINT buckets)")
    parser.add_argument("--fetch-esco", action="store_true", help="Reserved: ESCO DE title enrich (not yet wired)")
    args = parser.parse_args()
    if args.fetch_esco:
        print("Note: --fetch-esco is reserved; using O*NET English titles as titleDe fallback.")
    base = ensure_onet()
    titles = load_titles(base)
    vectors = load_vectors(base)

    imported: list[dict] = []
    for soc, vector in vectors.items():
        title = titles.get(soc)
        if not title:
            continue
        if sum(vector.values()) <= 0:
            continue
        imported.append(
            {
                "id": f"onet_{soc}",
                "titleDe": title,  # EN fallback until ESCO DE merge
                "titleEn": title,
                "riasec": highpoint(vector),
                "vector": {k: round(vector[k], 2) for k in "RIASEC"},
                "source": "onet",
                "onetSoc": soc,
            }
        )

    trimmed = trim_balanced(imported, PER_HIGHPOINT)
    if args.limit and args.limit > 0:
        trimmed = trimmed[: args.limit]
    seed = load_seed()
    # Prefer seed DE labels first, then O*NET trim
    merged = []
    seen = set()
    for o in seed + trimmed:
        oid = o["id"]
        if oid in seen:
            continue
        seen.add(oid)
        merged.append(
            {
                "id": oid,
                "titleDe": o["titleDe"],
                "riasec": o["riasec"],
                "vector": o["vector"],
            }
        )

    payload = {
        "version": 2,
        "notes": (
            "Merged seed (DE) + trimmed O*NET Career Interest Types (CC BY 4.0). "
            "titleDe for O*NET rows is currently English until ESCO DE titles are linked. "
            "This service uses information from the O*NET 31.0 Database by the U.S. "
            "Department of Labor, Employment and Training Administration (USDOL/ETA). "
            "Used under the CC BY 4.0 license. O*NET® is a trademark of USDOL/ETA."
        ),
        "count": len(merged),
        "occupations": merged,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(merged)} occupations → {OUT}")
    print(
        "Buckets:",
        {k: sum(1 for o in trimmed if o["riasec"].startswith(k)) for k in "RIASEC"},
    )


if __name__ == "__main__":
    main()
