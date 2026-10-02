#!/usr/bin/env python3
"""Extract 16 VIST profiles from skillster PDF into structured JSON.

Improves two-column bullet layouts from `pdftotext -layout` by detecting a
stable column gutter per section, then parsing left/right streams separately
before merging complete bullets (avoids mid-sentence column mash).
"""

from __future__ import annotations

import json
import re
import statistics
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

# Mid-bullet orphan fragments often left after bad merges
ORPHAN = re.compile(
    r"^(mit Ihren eigenen Regeln und Gesetzen\.?|"
    r"erkennen\.?|"
    r"belastbar\.?|"
    r"Tempo Schritt zu halten\.?|"
    r"von Kontrolle und Ordnung\.?|"
    r"als Vorbild)$",
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


def detect_gutter(lines: list[str]) -> int | None:
    """Find a stable column split position from dual-bullet / wide-gap lines."""
    gaps: list[int] = []
    for line in lines:
        # Two bullets on one line — strong signal
        m = re.search(r"•", line)
        if not m:
            continue
        # Find second bullet
        second = line.find("•", m.start() + 1)
        if second > 20:
            gaps.append(second)
            continue
        # Wide whitespace run after some content
        for gm in re.finditer(r"\S(\s{3,})\S", line):
            pos = gm.start(1)
            if 25 <= pos <= 70:
                gaps.append(pos + 1)
                break
    if not gaps:
        return None
    # Prefer median of second-bullet positions when available
    return int(statistics.median(gaps))


def split_at_gutter(line: str, gutter: int | None) -> tuple[str, str]:
    # Prefer an explicit second bullet as the column break.
    first = line.find("•")
    second = line.find("•", first + 1) if first >= 0 else -1
    if second > 15:
        return line[:second].rstrip(), line[second:].strip()

    if gutter is None or len(line) <= gutter:
        m = re.match(r"^(.{20,}?)\s{3,}(.{8,})$", line)
        if m:
            return m.group(1).rstrip(), m.group(2).strip()
        return line.rstrip(), ""

    left = line[:gutter].rstrip()
    right = line[gutter:].strip()
    # Safety: never keep a leaked second bullet in the left cell
    leaked = left.find("•", 1)
    if leaked > 15:
        right = (left[leaked:] + " " + right).strip()
        left = left[:leaked].rstrip()
    if right and not (
        right.startswith("•")
        or right[:1].isalnum()
        or right[:1] in "„\"'("
        or re.match(r"^[a-zäöü]", right)
    ):
        return line.rstrip(), ""
    return left, right


def parse_column_stream(lines: list[str]) -> list[str]:
    items: list[str] = []
    buf = ""
    for raw in lines:
        s = re.sub(r"[ \t]+", " ", raw).strip()
        # Drop stray mid-line bullets that leaked from the other column
        if s.startswith("•"):
            body = s[1:]
            body = re.sub(r"\s*•\s*", " ", body)
            s = "• " + body.strip()
        else:
            s = re.sub(r"\s*•\s*", " ", s).strip()
        s = re.sub(r" {2,}", " ", s).strip()
        if not s or NOISE.match(s):
            continue
        if re.fullmatch(r"- .+ -", s):
            continue
        if s.startswith("•"):
            if buf:
                items.append(re.sub(r"\s+", " ", buf).strip())
            buf = s.lstrip("•").strip()
        else:
            if buf.endswith("-") and s and s[0].islower():
                buf = buf[:-1] + s
            else:
                buf = f"{buf} {s}".strip() if buf else s
    if buf:
        items.append(re.sub(r"\s+", " ", buf).strip())

    cleaned: list[str] = []
    for item in items:
        item = re.sub(r"\s+", " ", item).replace("•", " ").strip()
        item = re.sub(r" {2,}", " ", item)
        item = item.replace("kön- nen", "können").replace("Hintergrün- digkeit", "Hintergründigkeit")
        item = item.replace("eben- so", "ebenso").replace("Not- wendigkeiten", "Notwendigkeiten")
        item = item.replace("Be- wegung", "Bewegung").replace("ver- folgen", "verfolgen")
        item = item.replace("Entwicklungs- möglichkeiten", "Entwicklungsmöglichkeiten")
        if len(item) < 3:
            continue
        if item in SECTION_HEADERS:
            continue
        if ORPHAN.fullmatch(item):
            continue
        cleaned.append(item)
    return cleaned


def stitch_orphans(items: list[str]) -> list[str]:
    """Attach short trailing fragments to the previous bullet when obvious."""
    if not items:
        return items
    out: list[str] = []
    for item in items:
        attach = False
        if out and len(item) < 50:
            if item[0].islower():
                attach = True
            elif item.startswith(("mit ", "zu ", "und ", "oder ", "als ", "von ", "Tempo ")):
                attach = True
            elif ORPHAN.fullmatch(item):
                attach = True
        if attach:
            prev = out[-1].rstrip()
            joined = f"{prev} {item}".strip()
            if not joined.endswith((".", "!", "?")):
                joined += "."
            out[-1] = joined
            continue
        out.append(item)
    return out


def clean_bullet_block(raw: str) -> list[str]:
    lines = [ln.rstrip("\n") for ln in raw.splitlines() if ln.strip()]
    gutter = detect_gutter(lines)

    left_lines: list[str] = []
    right_lines: list[str] = []
    for line in lines:
        left, right = split_at_gutter(line, gutter)
        if left.strip():
            left_lines.append(left)
        if right.strip():
            right_lines.append(right)

    left_items = stitch_orphans(parse_column_stream(left_lines))
    right_items = stitch_orphans(parse_column_stream(right_lines))

    # Reading order: complete left column, then complete right column.
    # (Interleaving mid-bullet caused the classic column mash.)
    if right_items:
        return left_items + right_items
    return left_items


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
        # Keep the first rich occurrence of each section (later hits are often repeats).
        if key in sections and len(sections[key]) >= 3:
            continue
        bullets = clean_bullet_block(chunk)
        if not bullets:
            continue
        if key in sections:
            # Replace a thin first hit with a richer later one
            if len(bullets) > len(sections[key]):
                sections[key] = bullets
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


def mash_score(bullets: list[str]) -> int:
    """Heuristic: count likely column-mash artifacts."""
    bad = 0
    for b in bullets:
        if re.search(r"\bzu [A-ZÄÖÜ]", b):
            bad += 1
        if re.search(r"\.\s+[a-zäöü]", b):
            bad += 1
        if "•" in b:
            bad += 1
        if re.search(r"[a-zäöü]\s+Sie [a-z]", b):
            bad += 1
    return bad


def main() -> None:
    text = load_text()
    profiles = extract_profiles(text)
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    index = []
    for p in profiles:
        path = OUT_DIR / f"{p['code'].lower()}.json"
        path.write_text(json.dumps(p, ensure_ascii=False, indent=2), encoding="utf-8")
        bullets = [b for secs in p["sections"].values() for b in secs]
        index.append(
            {
                "code": p["code"],
                "role": p["role"],
                "file": path.name,
                "sectionCount": len(p["sections"]),
                "bulletCount": len(bullets),
                "mashScore": mash_score(bullets),
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
            f"sections={row['sectionCount']:2} bullets={row['bulletCount']:3} "
            f"mash={row['mashScore']}"
        )


if __name__ == "__main__":
    main()
