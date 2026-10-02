#!/usr/bin/env python3
"""Extract 16 VIST profiles from skillster PDF into structured JSON.

Handles two-column bullet layouts from pdftotext -layout output.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PDF = ROOT / "skillster_daten-komprimiert.pdf"
OUT_DIR = ROOT / "web" / "data" / "profiles"
CACHE = Path("/tmp/skillster_komp.txt")

SECTION_HEADERS = [
    "Bestimmende Persönlichkeitseigenschaften",
    "Stärken",
    "Schwächen",
    "Motivationsfaktoren",
    "Demotivationsfaktoren",
    "Positives Konfliktverhalten",
    "Negatives Konfliktverhalten",
    "Rollen & Berufe",
    "Rolle im Team",
    "Talente in der Organisation",
    "Ihr idealer Chef",
    "Ihr Verhalten als Chef",
    "Wie andere mit Ihnen kommunizieren sollten",
    "Was andere in der Kommunikation mit Ihnen vermeiden sollten",
    "Stressverhalten",
    "Lernverhalten",
    "Entwicklungsmöglichkeiten",
    "Entwicklungspotential",
]

SECTION_KEY = {
    "Bestimmende Persönlichkeitseigenschaften": "eigenschaften",
    "Stärken": "staerken",
    "Schwächen": "schwaechen",
    "Motivationsfaktoren": "motivation",
    "Demotivationsfaktoren": "demotivation",
    "Positives Konfliktverhalten": "konflikt_positiv",
    "Negatives Konfliktverhalten": "konflikt_negativ",
    "Rollen & Berufe": "rollen_berufe",
    "Rolle im Team": "rolle_im_team",
    "Talente in der Organisation": "talente_organisation",
    "Ihr idealer Chef": "idealer_chef",
    "Ihr Verhalten als Chef": "verhalten_als_chef",
    "Wie andere mit Ihnen kommunizieren sollten": "kommunikation_sollten",
    "Was andere in der Kommunikation mit Ihnen vermeiden sollten": "kommunikation_vermeiden",
    "Stressverhalten": "stress",
    "Lernverhalten": "lernen",
    "Entwicklungsmöglichkeiten": "entwicklungspotential",
    "Entwicklungspotential": "entwicklungspotential",
}

ROLE_BY_CODE = {
    "ENTJ": "General",
    "ENFP": "Visionär",
    "ENFJ": "Lehrer",
    "ISTP": "Mechaniker",
    "ISTJ": "Inspektor",
    "ISFP": "Künstler",
    "ISFJ": "Versorger",
    "INTP": "Philosoph",
    "INTJ": "Forscher",
    "INFP": "Träumer",
    "INFJ": "Psychologe",
    "ESTP": "Unternehmer",
    "ESTJ": "Direktor",
    "ESFP": "Entertainer",
    "ESFJ": "Gastgeber",
    "ENTP": "Erfinder",
}

NOISE = re.compile(
    r"^(VIST|OceanofPDF\.com|PROFILERGEBNIS|\d+|System [12]|Bewusst|Unterbewusst)$",
    re.I,
)


def load_text() -> str:
    if CACHE.exists():
        return CACHE.read_text(encoding="utf-8", errors="replace")
    import subprocess

    subprocess.run(
        ["pdftotext", "-layout", str(PDF), str(CACHE)],
        check=True,
    )
    return CACHE.read_text(encoding="utf-8", errors="replace")


def split_two_columns(line: str) -> tuple[str, str]:
    """Split a layout line into left/right column text."""
    # Two bullets on one line
    m = re.match(r"^(.*•\s*.+?)\s{2,}(•\s*.+)$", line)
    if m:
        return m.group(1).strip(), m.group(2).strip()

    # Wide gap without second bullet (continuation of both columns)
    m = re.match(r"^(.{20,}?)\s{2,}(.{8,})$", line)
    if m:
        left, right = m.group(1).rstrip(), m.group(2).strip()
        # Avoid splitting short trait lists incorrectly when right looks like trait
        if len(left) >= 12:
            return left, right

    return line.strip(), ""


def parse_column_stream(lines: list[str]) -> list[str]:
    items: list[str] = []
    buf = ""
    for raw in lines:
        s = raw.strip()
        if not s or NOISE.match(s):
            continue
        if s.startswith("•"):
            if buf:
                items.append(re.sub(r"\s+", " ", buf).strip())
            buf = s.lstrip("•").strip()
        else:
            if re.fullmatch(r"- .+ -", s):
                continue
            buf = f"{buf} {s}".strip() if buf else s
    if buf:
        items.append(re.sub(r"\s+", " ", buf).strip())
    return [i for i in items if len(i) >= 3 and i not in SECTION_HEADERS]


def clean_bullet_block(raw: str) -> list[str]:
    left_lines: list[str] = []
    right_lines: list[str] = []
    for line in raw.splitlines():
        if not line.strip():
            continue
        left, right = split_two_columns(line)
        if left:
            left_lines.append(left)
        if right:
            right_lines.append(right)

    # Interleave left/right as visual reading order (L1,R1,L2,R2…) after full bullets
    left_items = parse_column_stream(left_lines)
    right_items = parse_column_stream(right_lines)

    # Prefer paired reading: zip then leftovers
    merged: list[str] = []
    n = max(len(left_items), len(right_items))
    for i in range(n):
        if i < len(left_items):
            merged.append(left_items[i])
        if i < len(right_items):
            merged.append(right_items[i])
    return merged


def split_sections(body: str) -> dict[str, list[str]]:
    pattern = "|".join(re.escape(h) for h in SECTION_HEADERS)
    matches = list(re.finditer(rf"(?:^|\n)\s*({pattern})\s*(?:\n|$)", body))
    sections: dict[str, list[str]] = {}
    for i, m in enumerate(matches):
        title = m.group(1)
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(body)
        chunk = body[start:end]
        for marker in (
            "PROFILERGEBNIS",
            "VIST Profile und Interpretationen",
            "Was der VIST misst",
            "Was ClaVis misst",
            "Daniel Kahneman",
            "OceanofPDF.com",
            "Copyright © 2021 by Daniel Kahneman",
        ):
            idx = chunk.find(marker)
            if idx >= 0:
                chunk = chunk[:idx]
        key = SECTION_KEY[title]
        bullets = clean_bullet_block(chunk)
        if not bullets:
            continue
        if key in sections:
            sections[key].extend(bullets)
        else:
            sections[key] = bullets
    return sections


def truncate_body(part: str, code: str) -> str:
    body = part
    for marker in (
        "VIST Profile und Interpretationen",
        "Was der VIST misst",
        "Daniel Kahneman",
        "Copyright © 2021 by Daniel Kahneman",
    ):
        idx = body.find(marker)
        if idx > 3000:
            return body[:idx]
        if 0 <= idx and code in {"ISTP", "INTP", "ENTP", "ENFP", "ISFP"}:
            return body[:idx]
    # Soft cap to avoid theory/Kahneman tails
    return body[:45000]


def extract_profiles(text: str) -> list[dict]:
    parts = re.split(r"PROFILERGEBNIS", text)
    profiles = []
    seen: set[str] = set()
    for part in parts[1:]:
        head = part[:500]
        code_m = re.search(r"\b([EI][NS][TF][JP])\b", head)
        if not code_m:
            continue
        code = code_m.group(1)
        if code in seen:
            continue
        role_m = re.search(r"-\s*([A-Za-zäöüÄÖÜ]+)\s*-", head)
        role = role_m.group(1) if role_m else ROLE_BY_CODE.get(code, "")
        body = truncate_body(part, code)
        sections = split_sections(body)
        if len(sections) < 5:
            continue
        seen.add(code)
        profiles.append(
            {
                "code": code,
                "role": role or ROLE_BY_CODE.get(code, ""),
                "system": "VIST/ClaVis",
                "source": {
                    "file": "skillster_daten-komprimiert.pdf",
                    "licenseLayer": "owned",
                    "notes": "Profiltexte aus eigener Lizenzquelle.",
                },
                "dimensions": {
                    "E_I": "E" if code[0] == "E" else "I",
                    "S_N": "S" if code[1] == "S" else "N",
                    "T_F": "T" if code[2] == "T" else "F",
                    "J_P": "J" if code[3] == "J" else "P",
                },
                "sections": sections,
            }
        )
    return profiles


def main() -> None:
    text = load_text()
    profiles = extract_profiles(text)
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    index = []
    for p in profiles:
        path = OUT_DIR / f"{p['code'].lower()}.json"
        path.write_text(json.dumps(p, ensure_ascii=False, indent=2), encoding="utf-8")
        index.append(
            {
                "code": p["code"],
                "role": p["role"],
                "file": path.name,
                "sectionCount": len(p["sections"]),
                "bulletCount": sum(len(v) for v in p["sections"].values()),
            }
        )

    (OUT_DIR / "index.json").write_text(
        json.dumps(
            {
                "count": len(index),
                "profiles": sorted(index, key=lambda x: x["code"]),
                "generatedBy": "scripts/extract_profiles.py",
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"Wrote {len(profiles)} profiles to {OUT_DIR}")
    for row in sorted(index, key=lambda x: x["code"]):
        print(
            f"  {row['code']:4} {row['role']:12} "
            f"sections={row['sectionCount']:2} bullets={row['bulletCount']}"
        )


if __name__ == "__main__":
    main()
