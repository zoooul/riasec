#!/usr/bin/env python3
"""Import O*NET interest profiles (+ optional ESCO DE labels) into a trimmed Skillster set.

Sources:
  - O*NET Database Interests + Occupation Data (CC BY 4.0)
  - ESCO preferred labels DE (EU reuse decision 2011/833/EU) — optional enrichment

Usage:
  python3 scripts/import_occupations.py
  python3 scripts/import_occupations.py --limit 350 --fetch-esco

Outputs:
  web/data/occupations/occupations.json   # processed matching set
  web/data/occupations/seed.json          # kept as tiny fallback companion
  web/data/occupations/README.md          # refresh instructions
"""

from __future__ import annotations

import argparse
import csv
import json
import math
import re
import ssl
import time
import urllib.parse
import urllib.request
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "web" / "data" / "occupations"
CACHE = Path("/tmp/skillster-occ")
CACHE.mkdir(parents=True, exist_ok=True)

ONET_BASE = "https://www.onetcenter.org/dl_files/database/db_29_2_text"
INTERESTS_URL = f"{ONET_BASE}/Interests.txt"
OCC_URL = f"{ONET_BASE}/Occupation%20Data.txt"

RIASEC_MAP = {
    "Realistic": "R",
    "Investigative": "I",
    "Artistic": "A",
    "Social": "S",
    "Enterprising": "E",
    "Conventional": "C",
}

# Curated DE titles for high-traffic O*NET titles (product-facing).
DE_TITLES: dict[str, str] = {
    "Chief Executives": "Geschäftsführung / Vorstand",
    "General and Operations Managers": "Betriebsleitung / Operations Manager",
    "Marketing Managers": "Marketing-Leitung",
    "Sales Managers": "Vertriebsleitung",
    "Human Resources Managers": "Personalleitung / HR Manager",
    "Computer and Information Systems Managers": "IT-Leitung",
    "Financial Managers": "Finanzleitung / CFO-Bereich",
    "Industrial Production Managers": "Produktionsleitung",
    "Construction Managers": "Bauleitung / Projektleitung Bau",
    "Education Administrators, Kindergarten through Secondary": "Schulleitung",
    "Architectural and Engineering Managers": "Technische Leitung / Engineering Manager",
    "Medical and Health Services Managers": "Klinik- / Gesundheitsmanagement",
    "Social and Community Service Managers": "Leitung Sozialer Dienste",
    "Accountants and Auditors": "Buchhaltung / Wirtschaftsprüfung",
    "Financial Analysts": "Finanzanalyse",
    "Management Analysts": "Unternehmensberatung / Organisationsentwicklung",
    "Market Research Analysts and Marketing Specialists": "Marktforschung / Marketing-Analyse",
    "Software Developers": "Softwareentwicklung",
    "Web Developers": "Webentwicklung",
    "Computer Systems Analysts": "IT-Systemanalyse",
    "Information Security Analysts": "IT-Sicherheit / Cybersecurity",
    "Data Scientists": "Data Science / Datenanalyse",
    "Database Administrators": "Datenbankadministration",
    "Network and Computer Systems Administrators": "System- / Netzadministration",
    "Computer Network Architects": "Netzwerkarchitektur",
    "Computer Programmers": "Programmierung",
    "Software Quality Assurance Analysts and Testers": "Software-Qualitätssicherung / Testing",
    "Civil Engineers": "Bauingenieurwesen",
    "Mechanical Engineers": "Maschinenbau",
    "Electrical Engineers": "Elektrotechnik / Elektroingenieurwesen",
    "Industrial Engineers": "Wirtschaftsingenieurwesen / Industrial Engineering",
    "Chemical Engineers": "Chemieingenieurwesen",
    "Environmental Engineers": "Umweltingenieurwesen",
    "Architects, Except Landscape and Naval": "Architektur",
    "Landscape Architects": "Landschaftsarchitektur",
    "Graphic Designers": "Grafikdesign",
    "Industrial Designers": "Industriedesign",
    "Interior Designers": "Innenarchitektur / Interior Design",
    "Fashion Designers": "Modedesign",
    "Multimedia Artists and Animators": "Multimedia / Animation",
    "Photographers": "Fotografie",
    "Writers and Authors": "Schreiben / Autorenschaft",
    "Editors": "Redaktion / Lektorat",
    "Technical Writers": "Technische Redaktion",
    "Interpreters and Translators": "Dolmetschen / Übersetzen",
    "Public Relations Specialists": "Öffentlichkeitsarbeit / PR",
    "Advertising Sales Agents": "Werbevertrieb",
    "Sales Representatives, Wholesale and Manufacturing": "B2B-Vertrieb",
    "Retail Salespersons": "Einzelhandelsverkauf",
    "Real Estate Sales Agents": "Immobilienvertrieb",
    "Insurance Sales Agents": "Versicherungsvertrieb",
    "Securities, Commodities, and Financial Services Sales Agents": "Finanzvertrieb / Wertpapierberatung",
    "Customer Service Representatives": "Kundenservice",
    "Receptionists and Information Clerks": "Empfang / Auskunft",
    "Secretaries and Administrative Assistants": "Assistenz / Sekretariat",
    "Office Clerks, General": "Büroorganisation / Sachbearbeitung",
    "Bookkeeping, Accounting, and Auditing Clerks": "Buchhaltung (Sachbearbeitung)",
    "Payroll and Timekeeping Clerks": "Lohnbuchhaltung",
    "Human Resources Specialists": "Personalwesen / HR Fachkraft",
    "Training and Development Specialists": "Personalentwicklung / Training",
    "Recruiters": "Recruiting / Personalgewinnung",
    "Lawyers": "Rechtsanwalt / Rechtsanwältin",
    "Paralegals and Legal Assistants": "Rechtsanwaltsfachangestellte",
    "Judges, Magistrate Judges, and Magistrates": "Richteramt",
    "Police and Sheriff's Patrol Officers": "Polizeidienst",
    "Firefighters": "Feuerwehr",
    "Security Guards": "Sicherheitsdienst",
    "Registered Nurses": "Krankenpflege (examinierte Pflege)",
    "Licensed Practical and Licensed Vocational Nurses": "Pflegefachkraft",
    "Nurse Practitioners": "Advanced Nursing / Pflegeexpert:in",
    "Physicians, All Other": "Ärztliche Tätigkeit",
    "Family Medicine Physicians": "Hausarzt / Allgemeinmedizin",
    "Surgeons, All Other": "Chirurgie",
    "Dentists, General": "Zahnmedizin",
    "Pharmacists": "Apotheke / Pharmazie",
    "Physical Therapists": "Physiotherapie",
    "Occupational Therapists": "Ergotherapie",
    "Speech-Language Pathologists": "Logopädie",
    "Psychologists, All Other": "Psychologie",
    "Clinical and Counseling Psychologists": "Klinische Psychologie / Beratung",
    "Social Workers": "Soziale Arbeit",
    "Child, Family, and School Social Workers": "Sozialarbeit (Familie / Schule)",
    "Mental Health Counselors": "Psychologische Beratung",
    "Substance Abuse and Behavioral Disorder Counselors": "Sucht-/Verhaltensberatung",
    "Marriage and Family Therapists": "Paar- und Familientherapie",
    "Elementary School Teachers, Except Special Education": "Grundschullehrkraft",
    "Secondary School Teachers, Except Special and Career/Technical Education": "Lehrkraft Sekundarstufe",
    "Special Education Teachers, Secondary School": "Förderschullehrkraft",
    "Preschool Teachers, Except Special Education": "Erzieher:in / Kita",
    "Teaching Assistants": "Lehrassistenz / Schulbegleitung",
    "Instructional Coordinators": "Unterrichtsentwicklung / Didaktik",
    "Librarians and Media Collections Specialists": "Bibliothekswesen",
    "Chefs and Head Cooks": "Küchenleitung / Chefkoch",
    "Cooks, Restaurant": "Koch / Köchin",
    "Bakers": "Bäckerei",
    "Waiters and Waitresses": "Service / Gastronomie",
    "Bartenders": "Bar / Mixology",
    "Hotel, Motel, and Resort Desk Clerks": "Hotelrezeption",
    "Travel Agents": "Reiseberatung",
    "Flight Attendants": "Kabinenpersonal",
    "Airline Pilots, Copilots, and Flight Engineers": "Piloten / Flugzeugführung",
    "Automotive Service Technicians and Mechanics": "Kfz-Mechatronik",
    "Aircraft Mechanics and Service Technicians": "Fluggerätmechanik",
    "Electricians": "Elektroinstallation",
    "Plumbers, Pipefitters, and Steamfitters": "Sanitär / Rohrleitungsbau",
    "Carpenters": "Zimmerei / Tischlerei",
    "Construction Laborers": "Bauhelfer / Hochbau",
    "Welders, Cutters, Solderers, and Brazers": "Schweißtechnik",
    "Machinists": "Zerspanungsmechanik",
    "Industrial Machinery Mechanics": "Industriemechanik",
    "Maintenance and Repair Workers, General": "Instandhaltung / Facility",
    "Heating, Air Conditioning, and Refrigeration Mechanics and Installers": "SHK / Klimatechnik",
    "Farmers, Ranchers, and Other Agricultural Managers": "Landwirtschaft / Agrarmanagement",
    "Agricultural Workers": "Agrarwirtschaft / Feldarbeit",
    "Veterinary Assistants and Laboratory Animal Caretakers": "Tiermedizinische Assistenz",
    "Veterinarians": "Tiermedizin",
    "Zoologists and Wildlife Biologists": "Zoologie / Wildbiologie",
    "Biological Scientists": "Biologie / Life Sciences",
    "Chemists": "Chemie",
    "Materials Scientists": "Materialwissenschaft",
    "Physicists": "Physik",
    "Astronomers": "Astronomie",
    "Geoscientists, Except Hydrologists and Geographers": "Geowissenschaften",
    "Environmental Scientists and Specialists, Including Health": "Umweltwissenschaft",
    "Statisticians": "Statistik",
    "Mathematicians": "Mathematik",
    "Operations Research Analysts": "Operations Research / Analytics",
    "Economists": "Volkswirtschaft / Ökonomie",
    "Sociologists": "Soziologie",
    "Anthropologists and Archeologists": "Anthropologie / Archäologie",
    "Historians": "Geschichtswissenschaft",
    "Political Scientists": "Politikwissenschaft",
    "Urban and Regional Planners": "Stadt- / Raumplanung",
    "Journalists": "Journalismus",
    "Broadcast Announcers and Radio Disc Jockeys": "Moderation / Rundfunk",
    "Producers and Directors": "Film- / Fernsehproduktion",
    "Actors": "Schauspiel",
    "Musicians and Singers": "Musik / Gesang",
    "Dancers": "Tanz",
    "Coaches and Scouts": "Coaching / Sportscouting",
    "Athletic Trainers": "Athletiktraining",
    "Fitness Trainers and Aerobics Instructors": "Fitness- / Personal Training",
    "Recreation Workers": "Freizeitpädagogik",
    "Childcare Workers": "Kinderbetreuung",
    "Personal Care Aides": "Alltagsbegleitung / Pflegeassistenz",
    "Home Health Aides": "Ambulante Pflegehilfe",
    "Hairdressers, Hairstylists, and Cosmetologists": "Friseur / Kosmetik",
    "Barbers": "Barbier / Herrenfriseur",
    "Manicurists and Pedicurists": "Nagelpflege / Pediküre",
    "Massage Therapists": "Massage / Wellness",
    "Funeral Attendants": "Bestattungswesen",
    "Clergy": "Seelsorge / Pfarramt",
    "Directors, Religious Activities and Education": "Gemeindepädagogik",
    "Logisticians": "Logistikplanung",
    "Transportation, Storage, and Distribution Managers": "Logistikleitung",
    "Purchasing Managers": "Einkaufsleitung",
    "Buyers and Purchasing Agents": "Einkauf",
    "Compliance Officers": "Compliance / Regelkonformität",
    "Project Management Specialists": "Projektmanagement",
    "Business Operations Specialists, All Other": "Business Operations",
    "Industrial-Organizational Psychologists": "Wirtschaftspsychologie",
    "User Experience Designers": "UX-Design",
    "Web and Digital Interface Designers": "UI-/Interface-Design",
    "Video Game Designers": "Game Design",
    "Robotics Engineers": "Robotik-Engineering",
    "Mechatronics Engineers": "Mechatronik-Engineering",
    "Bioengineers and Biomedical Engineers": "Biomedizintechnik",
    "Pharmaceutical Scientists": "Pharmazeutische Forschung",
    "Medical Scientists, Except Epidemiologists": "Medizinische Forschung",
    "Epidemiologists": "Epidemiologie",
    "Dietitians and Nutritionists": "Ernährungsberatung / Diätetik",
    "Dental Hygienists": "Dentalhygiene",
    "Radiologic Technologists and Technicians": "Radiologie-Assistenz",
    "Surgical Technologists": "OP-Assistenz",
    "Emergency Medical Technicians": "Rettungsdienst / Notfallsanitäter",
    "Paramedics": "Notfallsanitäter / Paramedic",
    "Pharmacy Technicians": "Pharmazeutisch-technische Assistenz",
    "Veterinary Technologists and Technicians": "Tiermedizinische Fachkraft",
    "Agricultural Engineers": "Agrartechnik",
    "Mining and Geological Engineers, Including Mining Safety Engineers": "Bergbau- / Geotechnik",
    "Petroleum Engineers": "Erdöl-/Energietechnik",
    "Nuclear Engineers": "Kerntechnik",
    "Aerospace Engineers": "Luft- und Raumfahrttechnik",
    "Marine Engineers and Naval Architects": "Schiffbau / Marine Engineering",
    "Surveyors": "Vermessungswesen",
    "Cartographers and Photogrammetrists": "Kartografie",
    "Forest and Conservation Workers": "Forstwirtschaft",
    "Logging Workers": "Holzernte / Forstarbeit",
    "Fish and Game Wardens": "Wildhüter / Fischereiaufsicht",
    "Animal Caretakers": "Tierpflege",
    "Animal Trainers": "Tiertraining",
    "Butchers and Meat Cutters": "Fleischerei",
    "Food Scientists and Technologists": "Lebensmitteltechnologie",
    "Quality Control Analysts": "Qualitätskontrolle / QA",
    "Inspectors, Testers, Sorters, Samplers, and Weighers": "Prüftechnik / Qualitätsprüfung",
    "Production, Planning, and Expediting Clerks": "Arbeitsvorbereitung / Disposition",
    "Shipping, Receiving, and Inventory Clerks": "Warenannahme / Lagerverwaltung",
    "Stockers and Order Fillers": "Kommissionierung / Lager",
    "Industrial Truck and Tractor Operators": "Stapler / Flurförderzeuge",
    "Heavy and Tractor-Trailer Truck Drivers": "LKW-Transport",
    "Bus Drivers, Transit and Intercity": "Busverkehr",
    "Taxi Drivers": "Taxi / Personenbeförderung",
    "Delivery Drivers": "Lieferverkehr / Kurier",
    "Postal Service Mail Carriers": "Zustelldienst",
    "Janitors and Cleaners, Except Maids and Housekeeping Cleaners": "Gebäudereinigung",
    "Maids and Housekeeping Cleaners": "Housekeeping / Reinigung",
    "Landscaping and Groundskeeping Workers": "Garten- / Landschaftspflege",
    "Tree Trimmers and Pruners": "Baumpflege",
    "Pest Control Workers": "Schädlingsbekämpfung",
    "Sewing Machine Operators": "Textilfertigung",
    "Tailors, Dressmakers, and Custom Sewers": "Schneiderei",
    "Jewelers and Precious Stone and Metal Workers": "Goldschmiede / Schmuck",
    "Cabinetmakers and Bench Carpenters": "Möbeltischlerei",
    "Painters, Construction and Maintenance": "Maler / Lackierer",
    "Roofers": "Dachdeckerei",
    "Sheet Metal Workers": "Klempnerei / Blechbearbeitung",
    "Structural Iron and Steel Workers": "Stahlbau",
    "Brickmasons and Blockmasons": "Maurerhandwerk",
    "Tile and Stone Setters": "Fliesenlegehandwerk",
    "Glaziers": "Glaserei",
    "Insulation Workers": "Dämmtechnik",
    "Drywall and Ceiling Tile Installers": "Trockenbau",
    "Floor Layers, Except Carpet, Wood, and Hard Tiles": "Bodenleger",
    "Carpet Installers": "Teppichleger",
    "Cement Masons and Concrete Finishers": "Betonbau / Estrich",
    "Operating Engineers and Other Construction Equipment Operators": "Baumaschinenführung",
    "Crane and Tower Operators": "Kranführung",
    "Elevator and Escalator Installers and Repairers": "Aufzugstechnik",
    "Telecommunications Equipment Installers and Repairers": "Telekommunikationstechnik",
    "Audio and Video Technicians": "AV-Technik",
    "Broadcast Technicians": "Sendetechnik",
    "Sound Engineering Technicians": "Tontechnik",
    "Camera Operators, Television, Video, and Film": "Kameraführung",
    "Film and Video Editors": "Filmschnitt",
    "Lighting Technicians": "Beleuchtungstechnik",
    "Set and Exhibit Designers": "Bühnen- / Ausstellungsdesign",
    "Museum Technicians and Conservators": "Museumstechnik / Restaurierung",
    "Archivists": "Archivwesen",
    "Curators": "Kuratierung / Museum",
    "Tour Guides and Escorts": "Reiseleitung / Gästeführung",
    "Interpreters and Translators": "Dolmetschen / Übersetzen",
}


def fetch(url: str, dest: Path) -> Path:
    if dest.exists() and dest.stat().st_size > 1000:
        return dest
    print(f"Downloading {url} …")
    ctx = ssl.create_default_context()
    req = urllib.request.Request(url, headers={"User-Agent": "Skillster/1.0 (private research)"})
    with urllib.request.urlopen(req, context=ctx, timeout=120) as resp:
        dest.write_bytes(resp.read())
    return dest


def load_occupation_titles(path: Path) -> dict[str, str]:
    titles: dict[str, str] = {}
    with path.open(encoding="utf-8", errors="replace", newline="") as f:
        reader = csv.DictReader(f, delimiter="\t")
        for row in reader:
            code = row["O*NET-SOC Code"].strip()
            titles[code] = row["Title"].strip()
    return titles


def load_interest_vectors(path: Path) -> dict[str, dict[str, float]]:
    """Build RIASEC vectors from OI (Occupational Interests) scale 1–7."""
    raw: dict[str, dict[str, float]] = defaultdict(dict)
    with path.open(encoding="utf-8", errors="replace", newline="") as f:
        reader = csv.DictReader(f, delimiter="\t")
        for row in reader:
            if row.get("Scale ID") != "OI":
                continue
            name = row.get("Element Name", "")
            letter = RIASEC_MAP.get(name)
            if not letter:
                continue
            code = row["O*NET-SOC Code"].strip()
            try:
                value = float(row["Data Value"])
            except (TypeError, ValueError):
                continue
            # Normalize 1–7 → roughly 0–100
            raw[code][letter] = round((value - 1) / 6 * 100, 1)
    # Fill missing letters with 0
    out: dict[str, dict[str, float]] = {}
    for code, vec in raw.items():
        out[code] = {k: float(vec.get(k, 0.0)) for k in "RIASEC"}
    return out


def riasec_code(vec: dict[str, float]) -> str:
    ordered = sorted(vec.keys(), key=lambda k: (-vec[k], k))
    return "".join(ordered[:3])


def diversity_score(vec: dict[str, float]) -> float:
    vals = [vec[k] for k in "RIASEC"]
    mean = sum(vals) / 6
    var = sum((v - mean) ** 2 for v in vals) / 6
    top = max(vals)
    return top + math.sqrt(var)


def simplify_de_title(en: str) -> str:
    if en in DE_TITLES:
        return DE_TITLES[en]
    # Light heuristic cleanup for remaining English titles
    t = en
    t = re.sub(r", All Other$", "", t)
    t = re.sub(r", Except .+$", "", t)
    t = re.sub(r" and ", " / ", t)
    return t


def esco_de_label(query: str) -> str | None:
    q = urllib.parse.quote(query)
    url = (
        "https://ec.europa.eu/esco/api/search?"
        f"language=de&type=occupation&text={q}&limit=1"
    )
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Skillster/1.0"})
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        results = data.get("_embedded", {}).get("results", [])
        if not results:
            return None
        pref = results[0].get("preferredLabel") or {}
        label = pref.get("de") or results[0].get("title")
        if not label:
            return None
        # Prefer first gender form before slash
        return label.split("/")[0].strip()
    except Exception as exc:  # noqa: BLE001
        print(f"  ESCO miss for {query!r}: {exc}")
        return None


def select_occupations(
    titles: dict[str, str],
    vectors: dict[str, dict[str, float]],
    limit: int,
) -> list[dict]:
    candidates = []
    for code, vec in vectors.items():
        title_en = titles.get(code)
        if not title_en:
            continue
        curated_boost = 40.0 if title_en in DE_TITLES else 0.0
        # Prefer primary SOC rows
        primary_boost = 8.0 if code.endswith(".00") else 0.0
        # Mild preference for clearer professional titles (shorter, fewer commas)
        clarity = max(0.0, 12.0 - title_en.count(","))
        score = diversity_score(vec) + curated_boost + primary_boost + clarity
        candidates.append((score, code, title_en, vec))
    candidates.sort(key=lambda x: -x[0])

    # Always include curated titles first when vectors exist
    selected: list[tuple] = []
    seen_titles: set[str] = set()
    title_to_row = {row[2]: row for row in candidates}
    for en in DE_TITLES:
        row = title_to_row.get(en)
        if not row:
            continue
        selected.append(row)
        seen_titles.add(en.lower())

    # Prefer curated-only product set; optionally fill under-represented letters
    if len(selected) >= limit:
        selected = selected[:limit]
    else:
        buckets: dict[str, list] = defaultdict(list)
        for row in candidates:
            if row[2].lower() in seen_titles:
                continue
            top = max("RIASEC", key=lambda k: row[3][k])
            buckets[top].append(row)

        curated_top = Counter(
            max("RIASEC", key=lambda k: row[3][k]) for row in selected
        )
        # Fill letters that are under-represented relative to others
        target_each = max(20, limit // 6)
        for letter in "AISCE":  # deprioritize raw R fill
            while curated_top[letter] < target_each and buckets[letter] and len(selected) < limit:
                row = buckets[letter].pop(0)
                key = row[2].lower()
                if key in seen_titles:
                    continue
                seen_titles.add(key)
                selected.append(row)
                curated_top[letter] += 1

    occupations = []
    for _, code, title_en, vec in selected[:limit]:
        occupations.append(
            {
                "id": f"onet_{code.replace('.', '_')}",
                "onetSoc": code,
                "titleEn": title_en,
                "titleDe": simplify_de_title(title_en),
                "riasec": riasec_code(vec),
                "vector": {k: round(vec[k], 1) for k in "RIASEC"},
                "source": "onet+curated-de" if title_en in DE_TITLES else "onet",
            }
        )
    return occupations


def enrich_esco(occupations: list[dict], max_calls: int = 80) -> None:
    calls = 0
    for occ in occupations:
        if occ["titleDe"] != occ["titleEn"] and occ["titleEn"] in DE_TITLES:
            continue  # already curated
        if calls >= max_calls:
            break
        # Only try ESCO when still English-looking
        if re.search(r"[A-Za-z]{4,}", occ["titleDe"]) and " / " not in occ["titleDe"]:
            label = esco_de_label(occ["titleEn"].split(",")[0])
            calls += 1
            time.sleep(0.15)
            if label:
                occ["titleDe"] = label
                occ["source"] = "onet+esco"


def write_outputs(occupations: list[dict], meta: dict) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    payload = {
        "version": 2,
        "meta": meta,
        "occupations": occupations,
    }
    (OUT_DIR / "occupations.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    # Keep a small seed companion for smoke tests / offline demos
    seed = {
        "version": 2,
        "notes": "Tiny fallback seed. Primary matching uses occupations.json (O*NET + DE labels).",
        "occupations": occupations[:8],
    }
    # Prefer keeping the original hand seed if present and occupations empty
    if occupations:
        # Do not overwrite the classic seed clusters — keep them as seed.json for domain buckets
        pass

    readme = """# Occupations data

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
"""
    (OUT_DIR / "README.md").write_text(readme, encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=350)
    parser.add_argument("--fetch-esco", action="store_true")
    parser.add_argument("--esco-calls", type=int, default=60)
    args = parser.parse_args()

    interests = fetch(INTERESTS_URL, CACHE / "Interests.txt")
    occ_data = fetch(OCC_URL, CACHE / "Occupation Data.txt")

    titles = load_occupation_titles(occ_data)
    vectors = load_interest_vectors(interests)
    print(f"Loaded {len(titles)} titles, {len(vectors)} interest profiles")

    occupations = select_occupations(titles, vectors, args.limit)
    if args.fetch_esco:
        print(f"Enriching up to {args.esco_calls} DE labels via ESCO…")
        enrich_esco(occupations, max_calls=args.esco_calls)

    meta = {
        "count": len(occupations),
        "onetVersionHint": "db_29_2_text",
        "licenses": [
            {
                "id": "onet-database",
                "license": "CC BY 4.0",
                "attribution": "This product uses the O*NET Database developed by the U.S. Department of Labor.",
            },
            {
                "id": "esco",
                "license": "EU reuse 2011/833/EU",
                "attribution": "This service uses the ESCO classification of the European Commission.",
            },
        ],
        "notes": "Trimmed DE-facing set for Skillster matching. Re-run script to refresh full/larger sets.",
    }
    write_outputs(occupations, meta)
    print(f"Wrote {len(occupations)} occupations → {OUT_DIR / 'occupations.json'}")
    sample = ", ".join(o["titleDe"] for o in occupations[:5])
    print(f"Sample: {sample}")


if __name__ == "__main__":
    main()
