type MotifProps = {
  motif: string;
  kind: "pattern" | "scene" | "affect";
  /** Optional catalog asset URL; falls back to SVG motifs when missing. */
  imageUrl?: string | null;
};

const KIND_TINT: Record<MotifProps["kind"], string> = {
  pattern: "from-[rgba(94,200,214,0.16)] via-transparent to-[rgba(111,190,154,0.08)]",
  affect: "from-[rgba(216,137,154,0.16)] via-transparent to-[rgba(201,168,106,0.1)]",
  scene: "from-[rgba(94,200,214,0.12)] via-transparent to-[rgba(216,137,154,0.08)]",
};

/** Refined motif tiles — soft geometry, limited palette, catalog image preferred. */
export function VisualCard({ motif, kind, imageUrl }: MotifProps) {
  const stroke = "#8aa4bc";
  const accent = kind === "affect" ? "#d8899a" : "#5ec8d6";
  const mint = "#6fbe9a";
  const amber = "#c9a86a";

  return (
    <div
      className={`visual-card relative aspect-[5/3] w-full overflow-hidden rounded-[1.15rem] border border-white/18 bg-gradient-to-br ${KIND_TINT[kind]}`}
      aria-hidden
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,rgba(255,255,255,0.16),transparent_48%)]" />
      <div className="visual-card-grain pointer-events-none absolute inset-0 opacity-60" />
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt=""
          className="relative h-full w-full object-cover object-center"
        />
      ) : (
        <svg viewBox="0 0 160 120" className="relative h-full w-full">
          {motif.includes("grid") && (
            <>
              {[32, 52, 72, 92, 112, 132].map((x) => (
                <line
                  key={`v${x}`}
                  x1={x}
                  y1={18}
                  x2={x}
                  y2={102}
                  stroke={stroke}
                  strokeOpacity="0.35"
                />
              ))}
              {[30, 50, 70, 90].map((y) => (
                <line
                  key={`h${y}`}
                  x1={22}
                  y1={y}
                  x2={138}
                  y2={y}
                  stroke={stroke}
                  strokeOpacity="0.35"
                />
              ))}
              <circle cx="96" cy="50" r="7" fill={accent} opacity="0.9" />
            </>
          )}
          {(motif.includes("wave") || motif.includes("gestalt")) && (
            <path
              d="M14 72 C40 30, 58 96, 82 52 S122 24, 148 66"
              fill="none"
              stroke={accent}
              strokeWidth="3"
              strokeLinecap="round"
            />
          )}
          {motif.includes("checklist") && (
            <>
              <rect
                x="40"
                y="26"
                width="80"
                height="70"
                rx="12"
                fill="rgba(255,255,255,0.08)"
                stroke={stroke}
                strokeWidth="1.75"
              />
              <path
                d="M58 48 h42 M58 62 h34 M58 76 h46"
                stroke={stroke}
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M48 47 l4 4 8-9"
                fill="none"
                stroke={mint}
                strokeWidth="2"
                strokeLinecap="round"
              />
            </>
          )}
          {(motif.includes("idea") || motif.includes("theory")) && (
            <>
              <circle cx="80" cy="40" r="14" fill={amber} opacity="0.85" />
              <circle
                cx="48"
                cy="78"
                r="11"
                fill="rgba(255,255,255,0.08)"
                stroke={accent}
                strokeWidth="1.75"
              />
              <circle
                cx="112"
                cy="78"
                r="11"
                fill="rgba(255,255,255,0.08)"
                stroke={mint}
                strokeWidth="1.75"
              />
              <path
                d="M80 54 V64 M68 70 L52 72 M92 70 L108 72"
                stroke={stroke}
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </>
          )}
          {(motif.includes("chart") ||
            motif.includes("data-table") ||
            motif.includes("spreadsheet")) && (
            <>
              <path
                d="M34 88 V42 M34 88 H128"
                stroke={stroke}
                strokeWidth="1.75"
                strokeLinecap="round"
              />
              <rect x="48" y="58" width="14" height="30" rx="3" fill={accent} opacity="0.8" />
              <rect x="70" y="44" width="14" height="44" rx="3" fill={mint} opacity="0.8" />
              <rect x="92" y="52" width="14" height="36" rx="3" fill={accent} opacity="0.65" />
              <rect x="114" y="36" width="14" height="52" rx="3" fill={amber} opacity="0.8" />
            </>
          )}
          {motif.includes("circle-talk") && (
            <>
              <circle cx="56" cy="56" r="18" fill="rgba(255,255,255,0.08)" stroke="#d8899a" strokeWidth="1.75" />
              <circle cx="104" cy="56" r="18" fill="rgba(255,255,255,0.08)" stroke={accent} strokeWidth="1.75" />
              <path d="M74 50 Q80 44 86 50" fill="none" stroke={stroke} strokeWidth="2" />
              <path d="M74 62 Q80 68 86 62" fill="none" stroke={stroke} strokeWidth="2" />
            </>
          )}
          {motif.includes("belong-circle") && (
            <>
              <circle cx="80" cy="58" r="34" fill="none" stroke={stroke} strokeWidth="1.5" strokeDasharray="4 5" />
              <circle cx="80" cy="58" r="12" fill="rgba(255,255,255,0.08)" stroke={mint} strokeWidth="1.75" />
              <circle cx="52" cy="42" r="8" fill={accent} opacity="0.75" />
              <circle cx="108" cy="42" r="8" fill="#d8899a" opacity="0.75" />
              <circle cx="56" cy="78" r="8" fill={amber} opacity="0.7" />
              <circle cx="104" cy="78" r="8" fill={mint} opacity="0.7" />
            </>
          )}
          {(motif.includes("warm-team") || motif.includes("warm-support")) && (
            <>
              <circle cx="50" cy="56" r="14" fill="#d8899a" opacity="0.8" />
              <circle cx="80" cy="48" r="14" fill={accent} opacity="0.8" />
              <circle cx="110" cy="56" r="14" fill={mint} opacity="0.8" />
              <path
                d="M80 64 C73 55, 58 58, 58 68 C58 78, 80 92, 80 92 C80 92, 102 78, 102 68 C102 58, 87 55, 80 64 Z"
                fill="#d8899a"
                opacity="0.45"
              />
            </>
          )}
          {(motif.includes("group-energy") ||
            motif.includes("after-huddle") ||
            motif.includes("talk-it")) && (
            <>
              <circle cx="52" cy="58" r="14" fill="#d8899a" opacity="0.8" />
              <circle cx="80" cy="48" r="14" fill={accent} opacity="0.8" />
              <circle cx="108" cy="60" r="14" fill={mint} opacity="0.8" />
              <path
                d="M80 48 L80 22 M80 48 L56 30 M80 48 L104 30"
                stroke={amber}
                strokeWidth="2.25"
                strokeLinecap="round"
                opacity="0.9"
              />
            </>
          )}
          {(motif.includes("coaching") ||
            motif.includes("coffee") ||
            motif.includes("helping") ||
            motif.includes("mentor") ||
            motif.includes("handshake")) &&
            !motif.includes("circle-talk") &&
            !motif.includes("belong") &&
            !motif.includes("warm") &&
            !motif.includes("group") && (
              <>
                <circle cx="52" cy="58" r="14" fill="#d8899a" opacity="0.8" />
                <circle cx="80" cy="48" r="14" fill={accent} opacity="0.8" />
                <circle cx="108" cy="60" r="14" fill={mint} opacity="0.8" />
              </>
            )}
          {motif.includes("soft-feedback") && (
            <>
              <path
                d="M40 40 h52 a8 8 0 0 1 8 8 v20 a8 8 0 0 1 -8 8 H60 l-14 12 V76 H40 a8 8 0 0 1 -8 -8 V48 a8 8 0 0 1 8 -8 z"
                fill="rgba(255,255,255,0.08)"
                stroke="#d8899a"
                strokeWidth="1.75"
                strokeLinejoin="round"
              />
              <circle cx="118" cy="52" r="14" fill="rgba(255,255,255,0.08)" stroke={mint} strokeWidth="1.75" />
            </>
          )}
          {motif.includes("direct-arrow") && (
            <>
              <path d="M36 78 H108" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
              <path
                d="M96 60 L118 78 L96 96"
                fill="none"
                stroke={accent}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="40" cy="78" r="5" fill={amber} />
            </>
          )}
          {(motif.includes("lesson-board") || motif.includes("reset-list")) && (
            <>
              <rect
                x="30"
                y="26"
                width="100"
                height="68"
                rx="10"
                fill="rgba(255,255,255,0.08)"
                stroke={stroke}
                strokeWidth="1.75"
              />
              <path d="M46 46 h68 M46 60 h52 M46 74 h60" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
              <path d="M42 46 l4 4 8 -9" fill="none" stroke={mint} strokeWidth="2" strokeLinecap="round" />
            </>
          )}
          {motif.includes("safe-frame") && (
            <>
              <rect
                x="40"
                y="28"
                width="80"
                height="64"
                rx="12"
                fill="rgba(255,255,255,0.08)"
                stroke={mint}
                strokeWidth="2"
              />
              <rect x="54" y="42" width="52" height="36" rx="8" fill="none" stroke={accent} strokeWidth="1.5" opacity="0.7" />
              <circle cx="80" cy="60" r="6" fill={amber} opacity="0.8" />
            </>
          )}
          {(motif.includes("calendar") ||
            motif.includes("milestone") ||
            motif.includes("reset-list")) && (
            <>
              <rect
                x="42"
                y="30"
                width="76"
                height="64"
                rx="10"
                fill="rgba(255,255,255,0.08)"
                stroke={stroke}
                strokeWidth="1.75"
              />
              <rect x="42" y="30" width="76" height="16" rx="10" fill={accent} opacity="0.55" />
              <circle cx="60" cy="66" r="4.5" fill={mint} />
              <circle cx="80" cy="66" r="4.5" fill={mint} />
              <circle cx="100" cy="66" r="4.5" fill="#d8899a" />
            </>
          )}
          {(motif.includes("quiet") ||
            motif.includes("solo") ||
            motif.includes("tidy-desk") ||
            motif.includes("messy-desk")) && (
            <>
              <rect
                x="30"
                y="70"
                width="100"
                height="10"
                rx="3"
                fill="rgba(255,255,255,0.08)"
                stroke={stroke}
                strokeWidth="1.5"
              />
              <rect
                x="54"
                y="40"
                width="52"
                height="30"
                rx="6"
                fill="rgba(255,255,255,0.08)"
                stroke={stroke}
                strokeWidth="1.75"
              />
              <circle cx="120" cy="34" r="9" fill={amber} opacity="0.7" />
              {motif.includes("messy") && (
                <path
                  d="M36 92 C52 70, 74 98, 96 74 S130 88, 144 68"
                  fill="none"
                  stroke="#d8899a"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              )}
            </>
          )}
          {(motif.includes("workshop") ||
            motif.includes("field-tools") ||
            motif.includes("hands-on") ||
            motif.includes("craft")) && (
            <>
              <rect
                x="30"
                y="70"
                width="100"
                height="12"
                rx="3"
                fill="rgba(255,255,255,0.08)"
                stroke={stroke}
                strokeWidth="1.5"
              />
              <path
                d="M70 70 V38"
                stroke={accent}
                strokeWidth="3"
                strokeLinecap="round"
              />
              <circle cx="112" cy="48" r="12" fill="none" stroke={amber} strokeWidth="2" />
            </>
          )}
          {(motif.includes("lab") ||
            motif.includes("microscope") ||
            motif.includes("think-board")) && (
            <>
              <path
                d="M58 28 h20 l16 52 h-52 z"
                fill="rgba(94,200,214,0.2)"
                stroke={accent}
                strokeWidth="1.75"
                strokeLinejoin="round"
              />
              <circle cx="118" cy="40" r="14" fill="none" stroke="#d8899a" strokeWidth="2.25" />
            </>
          )}
          {(motif.includes("office") ||
            motif.includes("process") ||
            motif.includes("howto")) && (
            <>
              <rect
                x="36"
                y="30"
                width="88"
                height="62"
                rx="10"
                fill="rgba(255,255,255,0.08)"
                stroke={stroke}
                strokeWidth="1.75"
              />
              {[48, 62, 76].map((y) => (
                <line
                  key={y}
                  x1="50"
                  y1={y}
                  x2="110"
                  y2={y}
                  stroke={accent}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              ))}
            </>
          )}
          {(motif.includes("studio") ||
            motif.includes("create") ||
            motif.includes("brand") ||
            motif.includes("story-arc")) && (
            <>
              <rect
                x="34"
                y="28"
                width="70"
                height="64"
                rx="8"
                fill="rgba(255,255,255,0.08)"
                stroke={stroke}
                strokeWidth="1.75"
              />
              <circle cx="118" cy="48" r="14" fill="#d8899a" opacity="0.75" />
              <path
                d="M48 72 L62 48 L76 64 L90 40"
                fill="none"
                stroke={mint}
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}
          {(motif.includes("pitch") ||
            motif.includes("network") ||
            motif.includes("lead-flag") ||
            motif.includes("achieve") ||
            motif.includes("influence")) && (
            <>
              <path
                d="M40 86 L80 32 L120 86 Z"
                fill="rgba(94,200,214,0.18)"
                stroke={accent}
                strokeWidth="1.75"
                strokeLinejoin="round"
              />
              <circle cx="80" cy="62" r="8" fill={amber} />
            </>
          )}
          {(motif.includes("calm-plan") ||
            (motif.includes("plan") && !motif.includes("open"))) && (
            <>
              <rect
                x="38"
                y="30"
                width="84"
                height="60"
                rx="12"
                fill="rgba(255,255,255,0.08)"
                stroke={stroke}
                strokeWidth="1.75"
              />
              <path
                d="M54 52 h52 M54 68 h36"
                stroke={accent}
                strokeWidth="2.25"
                strokeLinecap="round"
              />
            </>
          )}
          {motif.includes("focus-beam") && (
            <>
              <circle cx="48" cy="60" r="10" fill={amber} />
              <path
                d="M58 60 L130 36 L130 84 Z"
                fill="rgba(255,255,255,0.08)"
                stroke={accent}
                strokeWidth="1.5"
                opacity="0.9"
              />
            </>
          )}
          {(motif.includes("pause") ||
            (motif.includes("soft") && !motif.includes("feedback")) ||
            motif.includes("breathe") ||
            motif.includes("quiet-walk")) && (
            <>
              <circle
                cx="80"
                cy="58"
                r="28"
                fill="rgba(111,190,154,0.2)"
                stroke={mint}
                strokeWidth="1.75"
              />
              <path
                d="M58 68 C68 42, 92 42, 102 68"
                fill="none"
                stroke={stroke}
                strokeWidth="2"
                strokeLinecap="round"
              />
            </>
          )}
          {motif.includes("logic") && (
            <>
              <rect x="30" y="42" width="30" height="30" rx="7" fill={accent} opacity="0.8" />
              <rect x="65" y="42" width="30" height="30" rx="7" fill={mint} opacity="0.8" />
              <rect x="100" y="42" width="30" height="30" rx="7" fill="#d8899a" opacity="0.8" />
            </>
          )}
          {(motif.includes("open") || motif.includes("prototype")) && (
            <path
              d="M16 78 Q50 50, 80 70 T144 58"
              fill="none"
              stroke="#d8899a"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          )}
        </svg>
      )}
    </div>
  );
}
