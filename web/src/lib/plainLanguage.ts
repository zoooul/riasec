import {
  AXIS_IDS,
  RIASEC_IDS,
  RIASEC_LABELS,
  ZWISCHEN_THRESHOLD,
} from "./constants";
import type {
  AxisId,
  AxisScore,
  ClusterMatch,
  OccupationMatch,
  PlainProfile,
  RiasecId,
  VistProfile,
} from "./types";

/** Mixed axes in everyday German — never letter codes. */
const ZWISCHEN_WORDS: Record<AxisId, string> = {
  E_I: "teils für dich, teils mit anderen",
  S_N: "teils Details, teils große Ideen",
  T_F: "teils Fakten, teils Menschen",
  J_P: "teils planvoll, teils flexibel",
};

const HOW_BY_AXIS: Record<
  AxisId,
  { low: string; high: string; mixed: string }
> = {
  E_I: {
    low: "Du brauchst oft Ruhe und Zeit für dich.",
    high: "Du holst Energie oft aus dem Austausch mit anderen.",
    mixed: "Du brauchst beides: Menschen und Rückzug.",
  },
  S_N: {
    low: "Du magst klare Fakten und greifbare Schritte.",
    high: "Du denkst gern in Mustern und Möglichkeiten.",
    mixed: "Du wechselst zwischen Details und dem großen Bild.",
  },
  T_F: {
    low: "Bei Entscheidungen zählst du oft auf Logik und Fakten.",
    high: "Bei Entscheidungen zählen für dich Menschen und Werte.",
    mixed: "Du wägst Fakten und Gefühle gemeinsam ab.",
  },
  J_P: {
    low: "Du magst Pläne und Dinge zu Ende bringen.",
    high: "Du bleibst gern offen und passt dich an.",
    mixed: "Du bist teils planvoll, teils flexibel.",
  },
};

const TIPS_BY_AXIS: Record<
  AxisId,
  { low: string; high: string; mixed: string }
> = {
  E_I: {
    low: "Plane kurze Pausen allein ein — das lädt dich wieder auf.",
    high: "Plane auch kurze Ruhezeiten, damit du nicht ausbrennst.",
    mixed: "Wechsle bewusst zwischen Teamzeit und stiller Zeit.",
  },
  S_N: {
    low: "Lass dir manchmal Raum für neue Ideen.",
    high: "Schreib wichtige Details auf, damit nichts untergeht.",
    mixed: "Prüfe große Ideen an einem konkreten nächsten Schritt.",
  },
  T_F: {
    low: "Hör auch auf die Stimmung im Raum — nicht nur auf Zahlen.",
    high: "Nimm dir Zeit, Fakten zu prüfen, bevor du entscheidest.",
    mixed: "Sag klar, wann du Fakten brauchst und wann Beziehung zählt.",
  },
  J_P: {
    low: "Bau kleine Puffer ein — nicht alles muss sofort fertig sein.",
    high: "Setz dir ein oder zwei feste Termine, wenn vieles offen bleibt.",
    mixed: "Nutze grobe Pläne — und erlaube dir Änderungen.",
  },
};

/** True when a primary line still leaks MBTI/VIST letter soup. */
export function containsAxisCodeJargon(text: string): boolean {
  if (/\bzwischen\s+[EISTNFJP]\s+und\s+[EISTNFJP]\b/i.test(text)) return true;
  if (/\b(MBTI|VIST|Big\s*Five|RIASEC)\b/i.test(text)) return true;
  if (/\b[EI][NS][TF][JP]\b/.test(text)) return true;
  if (/\b(Typ|Pole|Achse)\s+[EISTNFJP]\b/i.test(text)) return true;
  return false;
}

export function zwischenLabelsInWords(
  axes: Record<AxisId, number> | AxisScore[],
): string[] {
  const values: Record<AxisId, number> = Array.isArray(axes)
    ? (Object.fromEntries(axes.map((a) => [a.id, a.value])) as Record<
        AxisId,
        number
      >)
    : axes;

  return AXIS_IDS.filter(
    (id) => Math.abs(values[id] ?? 0) < ZWISCHEN_THRESHOLD,
  ).map((id) => ZWISCHEN_WORDS[id]);
}

function pickHowLine(id: AxisId, value: number): string {
  const pack = HOW_BY_AXIS[id];
  if (Math.abs(value) < ZWISCHEN_THRESHOLD) return pack.mixed;
  return value > 0 ? pack.high : pack.low;
}

function pickTip(id: AxisId, value: number): string {
  const pack = TIPS_BY_AXIS[id];
  if (Math.abs(value) < ZWISCHEN_THRESHOLD) return pack.mixed;
  return value > 0 ? pack.high : pack.low;
}

function shortenBullet(raw: string, maxLen = 110): string {
  let text = raw
    .replace(/\s+/g, " ")
    .replace(/^Sie\s+/i, "Du ")
    .replace(/\bIhnen\b/g, "dir")
    .replace(/\bIhr\b/g, "dein")
    .replace(/\bIhre\b/g, "deine")
    .replace(/\bIhrer\b/g, "deiner")
    .trim();
  if (text.length <= maxLen) return text;
  const cut = text.slice(0, maxLen - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

function softTipFromProfile(profile: VistProfile | undefined): string | null {
  const raw = profile?.sections.schwaechen?.[0];
  if (!raw) return null;
  const soft = shortenBullet(raw, 100);
  if (!soft) return null;
  return `Achte darauf: ${soft}`;
}

/**
 * Builds the primary-view plain-language profile.
 * No MBTI/VIST letter codes in primary lines.
 */
export function buildPlainProfile(input: {
  primary: ClusterMatch;
  clusters: ClusterMatch[];
  axes: AxisScore[];
  riasec: Record<RiasecId, number>;
  occupations: OccupationMatch[];
  primaryProfile?: VistProfile;
  zwischenLabels?: string[];
}): PlainProfile {
  const zwischen =
    input.zwischenLabels ?? zwischenLabelsInWords(input.axes);

  const howYouWork: string[] = [];
  for (const axis of input.axes) {
    howYouWork.push(pickHowLine(axis.id, axis.value));
  }

  const owned =
    input.primaryProfile?.sections.staerken?.[0] ??
    input.primaryProfile?.sections.rolle_im_team?.[0];
  if (owned && howYouWork.length < 5) {
    howYouWork.push(shortenBullet(owned, 100));
  }

  const attractiveFields = [...RIASEC_IDS]
    .sort((a, b) => input.riasec[b] - input.riasec[a])
    .filter((id) => input.riasec[id] > 0)
    .slice(0, 3)
    .map((id) => RIASEC_LABELS[id]);

  for (const job of input.occupations.slice(0, 3)) {
    if (attractiveFields.length >= 3) break;
    if (!attractiveFields.includes(job.titleDe)) {
      attractiveFields.push(job.titleDe);
    }
  }

  const tips: string[] = [];
  const soft = softTipFromProfile(input.primaryProfile);
  if (soft) tips.push(soft);

  const strongest = [...input.axes].sort(
    (a, b) => Math.abs(b.value) - Math.abs(a.value),
  )[0];
  if (strongest && tips.length < 2) {
    tips.push(pickTip(strongest.id, strongest.value));
  }
  if (tips.length === 0 && strongest) {
    tips.push(pickTip(strongest.id, strongest.value));
  }

  const secondary = input.clusters.filter((c) => !c.isPrimary).slice(0, 1);
  let oneLine = `Du arbeitest oft wie jemand, der als „${input.primary.role}“ beschrieben wird.`;
  if (zwischen.length) {
    oneLine = `${oneLine} Manches ist gemischt — zum Beispiel ${zwischen[0]}.`;
  } else if (secondary[0]) {
    oneLine = `${oneLine} Es gibt auch Anteile von „${secondary[0].role}“.`;
  }

  return {
    oneLine,
    howYouWork: howYouWork.slice(0, 5),
    attractiveFields: attractiveFields.slice(0, 3),
    tips: tips.slice(0, 2),
    roleLabel: input.primary.role,
  };
}
