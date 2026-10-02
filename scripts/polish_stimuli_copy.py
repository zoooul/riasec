#!/usr/bin/env python3
"""One-off polish: SVG semantic accents + mvp-pictorial label/hint tightening."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CORE = ROOT / "web" / "public" / "stimuli" / "core"
ITEMS = ROOT / "web" / "data" / "items" / "mvp-pictorial.json"

# Insert before closing </svg> (idempotent: skip if marker present)
SVG_INSERTS: dict[str, tuple[str, str]] = {
    "group-energy": (
        "energy-rays",
        '<path d="M80 48 L80 20 M80 48 L56 30 M80 48 L104 30" stroke="#c9a86a" stroke-width="2.25" stroke-linecap="round" opacity="0.9"/>',
    ),
    "warm-team": (
        "team-heart",
        '<path d="M80 64 C73 55, 58 58, 58 68 C58 78, 80 92, 80 92 C80 92, 102 78, 102 68 C102 58, 87 55, 80 64 Z" fill="#d8899a" opacity="0.5"/>',
    ),
    "circle-talk": (
        "values-bubble",
        '<path d="M48 38 h22 a6 6 0 0 1 6 6 v10 a6 6 0 0 1 -6 6 H54 l-8 8 v-8 H48 a6 6 0 0 1 -6 -6 V44 a6 6 0 0 1 6 -6 z" fill="rgba(216,137,154,0.25)" stroke="#d8899a" stroke-width="1.5"/>'
        '<path d="M90 38 h22 a6 6 0 0 1 6 6 v10 a6 6 0 0 1 -6 6 h-6 l-8 8 v-8 h-2 a6 6 0 0 1 -6 -6 V44 a6 6 0 0 1 6 -6 z" fill="rgba(94,200,214,0.2)" stroke="#5ec8d6" stroke-width="1.5"/>',
    ),
    "logic-blocks": (
        "logic-flow",
        '<path d="M60 57 h5 l3 -4 l3 4 h5" fill="none" stroke="#b8c9da" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
        '<path d="M95 57 h5 l3 -4 l3 4 h5" fill="none" stroke="#b8c9da" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    ),
    "quiet-desk": (
        "focus-headphones",
        '<path d="M48 44 a28 28 0 0 1 64 0" fill="none" stroke="#6fbe9a" stroke-width="2.5" stroke-linecap="round"/>'
        '<rect x="44" y="44" width="8" height="14" rx="3" fill="#6fbe9a" opacity="0.85"/>'
        '<rect x="108" y="44" width="8" height="14" rx="3" fill="#6fbe9a" opacity="0.85"/>',
    ),
    "solo-morning": (
        "solo-journal",
        '<path d="M52 66 h28 M52 72 h20" stroke="#b8c9da" stroke-width="1.75" stroke-linecap="round" opacity="0.7"/>',
    ),
    "coffee-chat": (
        "second-cup",
        '<path d="M94 44 h28 a10 10 0 0 1 0 20 h-28 z" fill="rgba(255,255,255,0.06)" stroke="#5ec8d6" stroke-width="1.5"/>',
    ),
    "grid-error": (
        "detail-lens",
        '<circle cx="112" cy="72" r="12" fill="none" stroke="#c9a86a" stroke-width="1.75"/>'
        '<path d="M120 80 l8 8" stroke="#c9a86a" stroke-width="2" stroke-linecap="round"/>',
    ),
    "gestalt-wave": (
        "scatter-dots",
        '<circle cx="36" cy="34" r="3" fill="#b8c9da" opacity="0.6"/>'
        '<circle cx="52" cy="28" r="3" fill="#b8c9da" opacity="0.6"/>'
        '<circle cx="68" cy="36" r="3" fill="#b8c9da" opacity="0.6"/>'
        '<circle cx="92" cy="30" r="3" fill="#b8c9da" opacity="0.6"/>'
        '<circle cx="124" cy="32" r="3" fill="#b8c9da" opacity="0.6"/>',
    ),
    "calm-plan": (
        "plan-steps",
        '<circle cx="50" cy="52" r="5" fill="#6fbe9a"/><circle cx="50" cy="68" r="5" fill="#6fbe9a"/>'
        '<text x="62" y="55" fill="#b8c9da" font-size="8" font-family="system-ui,sans-serif">1.</text>'
        '<text x="62" y="71" fill="#b8c9da" font-size="8" font-family="system-ui,sans-serif">2.</text>',
    ),
    "office-order": (
        "folder-tabs",
        '<path d="M36 30 h16 v8 h-16 z M36 46 h12 v8 h-12 z M36 62 h14 v8 h-14 z" fill="#6fbe9a" opacity="0.35"/>',
    ),
    "workshop": (
        "wrench-tool",
        '<path d="M108 38 a10 10 0 1 0 4 16 l-6 10" fill="none" stroke="#c9a86a" stroke-width="2.25" stroke-linecap="round"/>',
    ),
    "warm-support": (
        "support-embrace",
        '<path d="M68 72 Q80 82 92 72" fill="none" stroke="#d8899a" stroke-width="2.5" stroke-linecap="round"/>',
    ),
    "lesson-board": (
        "lesson-check",
        '<path d="M42 46 l4 4 8 -9" fill="none" stroke="#6fbe9a" stroke-width="2" stroke-linecap="round"/>',
    ),
    "breathe": (
        "breath-arrows",
        '<path d="M80 28 v-6 M76 24 l4 -4 l4 4" fill="none" stroke="#6fbe9a" stroke-width="2" stroke-linecap="round"/>'
        '<path d="M80 92 v6 M76 96 l4 4 l4 -4" fill="none" stroke="#5ec8d6" stroke-width="2" stroke-linecap="round"/>',
    ),
    "soft-pause": (
        "pause-label",
        '<text x="80" y="98" text-anchor="middle" fill="#b8c9da" font-size="7" font-family="system-ui,sans-serif" opacity="0.8">Pause</text>',
    ),
    "focus-beam": (
        "beam-cut",
        '<path d="M118 52 h16 M118 68 h10" stroke="#d8899a" stroke-width="2" stroke-linecap="round" opacity="0.85"/>',
    ),
    "direct-arrow": (
        "direct-label",
        '<text x="72" y="68" fill="#b8c9da" font-size="7" font-family="system-ui,sans-serif">klar</text>',
    ),
    "soft-feedback": (
        "soft-heart",
        '<path d="M88 44 C84 40, 78 42, 78 48 C78 54, 88 58, 88 58 C88 58, 98 54, 98 48 C98 42, 92 40, 88 44 Z" fill="#d8899a" opacity="0.55"/>',
    ),
    "belong-circle": (
        "belong-link",
        '<path d="M52 42 L80 58 L108 42" fill="none" stroke="#d8899a" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>',
    ),
    "safe-frame": (
        "safe-lock",
        '<rect x="76" y="54" width="8" height="10" rx="2" fill="none" stroke="#6fbe9a" stroke-width="1.5"/>'
        '<path d="M74 54 a6 6 0 0 1 12 0" fill="none" stroke="#6fbe9a" stroke-width="1.5"/>',
    ),
}

COPY: dict[str, dict[str, dict[str, str]]] = {
    "ei_01": {"a": {"label": "Mit anderen", "hint": "Gespräch, Reize von außen, gemeinsame Energie."}, "b": {"label": "Für mich allein", "hint": "Ruhe, Fokus, innere Verarbeitung."}},
    "ei_02": {"a": {"label": "Kurzer Austausch", "hint": "Erst reden, dann in den Tag."}, "b": {"label": "Stiller Einstieg", "hint": "Allein ankommen, Kopf frei machen."}},
    "ei_03": {"a": {"label": "Noch weiterreden", "hint": "Nach dem Meeting dranbleiben."}, "b": {"label": "Pause allein", "hint": "Abstand gewinnen, wieder zu dir kommen."}},
    "sn_01": {"a": {"label": "Das eine Detail", "hint": "Abweichung, Fehler, konkrete Stelle."}, "b": {"label": "Das große Bild", "hint": "Muster, Trend, Gesamtform zuerst."}},
    "sn_02": {"a": {"label": "Genau prüfen", "hint": "Liste, Check, Unstimmigkeit finden."}, "b": {"label": "Ideen verknüpfen", "hint": "Neue Zusammenhänge und Möglichkeiten."}},
    "sn_03": {"a": {"label": "Schritt für Schritt", "hint": "Beispiele, Anleitung, Bewährtes."}, "b": {"label": "Warum & Zusammenhang", "hint": "Theorie, Modell, große Linie."}},
    "sn_04": {"a": {"label": "Zahlen zuerst", "hint": "Tabellen, Fakten, harte Daten."}, "b": {"label": "Story zuerst", "hint": "Richtung, Bedeutung, Was-wenn."}},
    "tf_01": {"a": {"label": "Fakten & Daten", "hint": "Belegbar, nachvollziehbar, sachlich."}, "b": {"label": "Menschen & Werte", "hint": "Fairness, Stimmigkeit, Beziehung."}},
    "tf_02": {"a": {"label": "Klare Logik", "hint": "Argumente, Regeln, Konsistenz."}, "b": {"label": "Gute Stimmung", "hint": "Teamgefühl und Harmonie mitdenken."}},
    "tf_03": {"a": {"label": "Direkt sagen", "hint": "Klar benennen, was nicht passt."}, "b": {"label": "Behutsam formulieren", "hint": "Gefühl schützen, Beziehung wahren."}},
    "tf_04": {"a": {"label": "Sachlage klären", "hint": "Fakten sammeln, dann entscheiden."}, "b": {"label": "Stimmung hören", "hint": "Gefühle und Fairness zuerst."}},
    "jp_01": {"a": {"label": "Plan & Struktur", "hint": "Termine, Schritte, Abschlüsse."}, "b": {"label": "Offen bleiben", "hint": "Optionen, spontan reagieren."}},
    "jp_02": {"a": {"label": "Meilensteine setzen", "hint": "Rahmen, Deadlines, Klarheit."}, "b": {"label": "Erst ausprobieren", "hint": "Ins Tun, später sortieren."}},
    "jp_03": {"a": {"label": "Aufgeräumt", "hint": "Alles hat seinen festen Platz."}, "b": {"label": "Sichtbares Chaos", "hint": "Ideen liegen offen herum."}},
    "r_01": {"a": {"label": "Handwerk & Werkzeug", "hint": "Anfassen, bauen, reparieren."}, "b": {"label": "Menschen begleiten", "hint": "Helfen, erklären, coachen."}},
    "r_02": {"a": {"label": "Draußen / Technik", "hint": "Praktisch, körperlich, Geräte."}, "b": {"label": "Büro & Ablauf", "hint": "Listen, Systeme, Ordnung."}},
    "i_01": {"a": {"label": "Forschen & verstehen", "hint": "Fragen stellen, analysieren."}, "b": {"label": "Ordnen & pflegen", "hint": "Tabellen, Prozesse, Struktur."}},
    "i_02": {"a": {"label": "Hypothesen testen", "hint": "Daten, Ursachen, Labor-Denken."}, "b": {"label": "Praktisch lösen", "hint": "Anpacken, ausprobieren, fixen."}},
    "a_01": {"a": {"label": "Gestalten & ausdrücken", "hint": "Form, Farbe, eigener Stil."}, "b": {"label": "Überzeugen & pushen", "hint": "Pitch, Wirkung, Menschen gewinnen."}},
    "a_02": {"a": {"label": "Etwas erschaffen", "hint": "Kunst, Design, Handwerk."}, "b": {"label": "Andere stützen", "hint": "Zuhören, helfen, Gemeinschaft."}},
    "a_03": {"a": {"label": "Visuell gestalten", "hint": "Layout, Ausdruck, Ästhetik."}, "b": {"label": "Struktur schaffen", "hint": "Abläufe, Übersicht, Regeln."}},
    "s_01": {"a": {"label": "Begleiten & fördern", "hint": "Menschen wachsen lassen."}, "b": {"label": "Denken & modellieren", "hint": "Systeme, Analyse, Whiteboard."}},
    "e_01": {"a": {"label": "Verkaufen & vernetzen", "hint": "Deals, Bühne, Überzeugen."}, "b": {"label": "Prozesse schärfen", "hint": "Qualität, Regeln, Zuverlässigkeit."}},
    "e_02": {"a": {"label": "Führen & tempo", "hint": "Richtung, Entscheidungen."}, "b": {"label": "Story & Look", "hint": "Marke, Botschaft, Gestaltung."}},
    "c_01": {"a": {"label": "Daten exakt pflegen", "hint": "Genauigkeit, Nachvollziehbarkeit."}, "b": {"label": "Kunden gewinnen", "hint": "Gespräche, Deals, Überzeugung."}},
    "stress_01": {"a": {"label": "Plan schreiben", "hint": "Schritte festlegen, Klarheit."}, "b": {"label": "Erst pausieren", "hint": "Abstand, runterfahren, sortieren."}},
    "stress_02": {"a": {"label": "Fokus schärfen", "hint": "Wesentliches wählen, Rest parken."}, "b": {"label": "Kurz reden", "hint": "Entlastung durch Austausch."}},
    "stress_03": {"a": {"label": "Struktur zurück", "hint": "Listen, Rituale, kleine Siege."}, "b": {"label": "Atmen & bewegen", "hint": "Körper, Spannung lösen."}},
    "stress_04": {"a": {"label": "Analyse & Lernen", "hint": "Sachlich verstehen, was schiefging."}, "b": {"label": "Zuspruch & Nähe", "hint": "Gehalten werden, zugehört werden."}},
    "motive_01": {"a": {"label": "Wirkung sichtbar", "hint": "Ziele, Erfolg, vorankommen."}, "b": {"label": "Dazugehören", "hint": "Team, Vertrauen, gemeinsam."}},
    "motive_02": {"a": {"label": "Meisterschaft", "hint": "Etwas richtig gut beherrschen."}, "b": {"label": "Mitgestalten", "hint": "Einfluss, Richtung setzen."}},
    "motive_03": {"a": {"label": "Freiraum", "hint": "Eigene Wege, wenig Vorgaben."}, "b": {"label": "Sicherer Rahmen", "hint": "Klare Regeln, Verlässlichkeit."}},
}


def patch_svgs() -> list[str]:
    touched: list[str] = []
    for motif, (marker, fragment) in SVG_INSERTS.items():
        path = CORE / f"{motif}.svg"
        if not path.exists():
            continue
        text = path.read_text(encoding="utf-8")
        if marker in text:
            continue
        if "</svg>" not in text:
            continue
        text = text.replace("</svg>", f"\n  <!-- {marker} -->\n  {fragment}\n</svg>", 1)
        path.write_text(text, encoding="utf-8")
        touched.append(motif)
    return touched


def patch_items() -> int:
    data = json.loads(ITEMS.read_text(encoding="utf-8"))
    data["version"] = 5
    data["notes"] = (
        "Pictorial MVP v5: Denkmuster-Copy + klarere SVG-Kontraste (VIST/RIASEC/Stress). "
        "Nested weights unchanged. Unvalidated until norming."
    )
    changes = 0
    for item in data["items"]:
        item_id = item["id"]
        spec = COPY.get(item_id)
        if not spec:
            continue
        for idx, key in enumerate(("a", "b")):
            choice = item["choices"][idx]
            suffix = choice["id"].split("_")[-1]
            if suffix != key and choice["id"].endswith(f"_{key}"):
                pass
            patch = spec[key]
            for field in ("label", "hint"):
                if choice.get(field) != patch[field]:
                    choice[field] = patch[field]
                    changes += 1
        if item_id == "tf_04":
            a_motif = "charts"
            b_motif = "belong-circle"
            if item["choices"][0]["visual"]["motif"] != a_motif:
                item["choices"][0]["visual"]["motif"] = a_motif
                changes += 1
            if item["choices"][1]["visual"]["motif"] != b_motif:
                item["choices"][1]["visual"]["motif"] = b_motif
                changes += 1
    ITEMS.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return changes


def main() -> None:
    svg = patch_svgs()
    n = patch_items()
    print(f"SVG motifs updated: {len(svg)} -> {', '.join(svg)}")
    print(f"Item copy/motif field changes: {n}")


if __name__ == "__main__":
    main()
