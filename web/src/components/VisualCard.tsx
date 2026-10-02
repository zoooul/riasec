type MotifProps = {
  motif: string;
  kind: "pattern" | "scene" | "affect";
  /** Optional catalog asset URL; falls back to SVG motifs when missing. */
  imageUrl?: string | null;
};

/** Glossy motif tiles — neon strokes on frosted glass, optional catalog image. */
export function VisualCard({ motif, kind, imageUrl }: MotifProps) {
  const glow =
    kind === "pattern"
      ? "from-cyan-400/25 via-transparent to-mint-400/10"
      : kind === "affect"
        ? "from-pink-400/25 via-transparent to-amber-300/15"
        : "from-sky-400/25 via-transparent to-fuchsia-400/15";

  const stroke = "#e8f7ff";
  const neon = kind === "affect" ? "#ff6b9d" : "#39f3ff";

  return (
    <div
      className={`relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/25 bg-gradient-to-br ${glow} shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]`}
      style={{
        backgroundColor: "rgba(255,255,255,0.06)",
        backdropFilter: "blur(10px)",
      }}
      aria-hidden
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.28),transparent_45%)]" />
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt=""
          className="relative h-full w-full object-cover opacity-90"
        />
      ) : (
        <svg viewBox="0 0 160 120" className="relative h-full w-full">
          {motif.includes("grid") && (
            <>
              {[20, 40, 60, 80, 100, 120, 140].map((x) => (
                <line
                  key={`v${x}`}
                  x1={x}
                  y1={10}
                  x2={x}
                  y2={110}
                  stroke={stroke}
                  strokeOpacity="0.25"
                />
              ))}
              {[20, 40, 60, 80, 100].map((y) => (
                <line
                  key={`h${y}`}
                  x1={10}
                  y1={y}
                  x2={150}
                  y2={y}
                  stroke={stroke}
                  strokeOpacity="0.25"
                />
              ))}
              <circle cx="92" cy="48" r="7" fill={neon} />
            </>
          )}
          {(motif.includes("wave") || motif.includes("gestalt")) && (
            <path
              d="M10 70 C40 20, 70 120, 100 50 S140 20, 155 65"
              fill="none"
              stroke={neon}
              strokeWidth="6"
              strokeLinecap="round"
            />
          )}
          {motif.includes("checklist") && (
            <>
              <rect
                x="35"
                y="25"
                width="90"
                height="70"
                rx="10"
                fill="rgba(255,255,255,0.12)"
                stroke={stroke}
              />
              <path d="M50 45 h50 M50 60 h40 M50 75 h55" stroke={stroke} strokeWidth="4" />
              <path d="M42 44 l5 5 10-12" fill="none" stroke="#7dffb2" strokeWidth="3" />
            </>
          )}
          {(motif.includes("idea") || motif.includes("theory")) && (
            <>
              <circle cx="80" cy="48" r="18" fill="#ffd166" opacity="0.9" />
              <path
                d="M80 68 v18 M70 55 h-18 M90 55 h18 M68 38 l-14-14 M92 38 l14-14"
                stroke={stroke}
                strokeWidth="4"
                strokeLinecap="round"
              />
            </>
          )}
          {(motif.includes("chart") || motif.includes("data-table") || motif.includes("spreadsheet")) && (
            <>
              <rect x="30" y="55" width="18" height="40" fill="#39f3ff" opacity="0.85" />
              <rect x="58" y="35" width="18" height="60" fill="#7dffb2" opacity="0.85" />
              <rect x="86" y="45" width="18" height="50" fill="#39f3ff" opacity="0.7" />
              <rect x="114" y="28" width="18" height="67" fill="#ff6b9d" opacity="0.85" />
            </>
          )}
          {(motif.includes("circle") ||
            motif.includes("warm") ||
            motif.includes("group") ||
            motif.includes("coaching") ||
            motif.includes("coffee") ||
            motif.includes("after-huddle") ||
            motif.includes("belong") ||
            motif.includes("helping") ||
            motif.includes("mentor") ||
            motif.includes("talk-it") ||
            motif.includes("handshake")) && (
            <>
              <circle cx="55" cy="55" r="14" fill="#ff6b9d" opacity="0.85" />
              <circle cx="85" cy="48" r="14" fill="#39f3ff" opacity="0.85" />
              <circle cx="115" cy="58" r="14" fill="#7dffb2" opacity="0.85" />
            </>
          )}
          {(motif.includes("calendar") || motif.includes("milestone") || motif.includes("reset-list")) && (
            <>
              <rect
                x="40"
                y="28"
                width="80"
                height="70"
                rx="10"
                fill="rgba(255,255,255,0.1)"
                stroke={stroke}
              />
              <rect x="40" y="28" width="80" height="18" fill="#39f3ff" opacity="0.8" />
              <circle cx="60" cy="68" r="5" fill="#7dffb2" />
              <circle cx="80" cy="68" r="5" fill="#7dffb2" />
              <circle cx="100" cy="68" r="5" fill="#ff6b9d" />
            </>
          )}
          {(motif.includes("quiet") ||
            motif.includes("solo") ||
            motif.includes("tidy-desk") ||
            motif.includes("messy-desk")) && (
            <>
              <rect x="45" y="50" width="70" height="8" rx="2" fill={stroke} opacity="0.5" />
              <rect
                x="55"
                y="35"
                width="50"
                height="30"
                rx="6"
                fill="rgba(255,255,255,0.12)"
                stroke={stroke}
              />
              <circle cx="120" cy="30" r="10" fill="#ffd166" opacity="0.85" />
              {motif.includes("messy") && (
                <path
                  d="M40 90 C55 70, 75 95, 95 75 S130 85, 145 70"
                  fill="none"
                  stroke="#ff6b9d"
                  strokeWidth="3"
                />
              )}
            </>
          )}
          {(motif.includes("workshop") ||
            motif.includes("field-tools") ||
            motif.includes("hands-on") ||
            motif.includes("craft")) && (
            <>
              <rect x="30" y="70" width="100" height="12" fill="rgba(255,255,255,0.2)" />
              <rect x="70" y="40" width="10" height="35" fill="#39f3ff" />
              <circle cx="75" cy="38" r="10" fill="#7dffb2" />
            </>
          )}
          {(motif.includes("lab") || motif.includes("microscope") || motif.includes("think-board")) && (
            <>
              <path
                d="M60 30 h20 l15 55 h-50 z"
                fill="rgba(57,243,255,0.35)"
                stroke={neon}
                strokeWidth="3"
              />
              <circle cx="110" cy="40" r="12" fill="none" stroke="#ff6b9d" strokeWidth="4" />
            </>
          )}
          {(motif.includes("office") || motif.includes("process") || motif.includes("howto")) && (
            <>
              <rect
                x="35"
                y="30"
                width="90"
                height="60"
                rx="8"
                fill="rgba(255,255,255,0.1)"
                stroke={stroke}
              />
              {[42, 54, 66, 78].map((y) => (
                <line key={y} x1="48" y1={y} x2="112" y2={y} stroke={neon} strokeWidth="3" />
              ))}
            </>
          )}
          {(motif.includes("studio") ||
            motif.includes("create") ||
            motif.includes("brand") ||
            motif.includes("story-arc")) && (
            <>
              <rect
                x="40"
                y="35"
                width="55"
                height="45"
                fill="rgba(255,255,255,0.1)"
                stroke={stroke}
              />
              <circle cx="110" cy="55" r="18" fill="#ff6b9d" opacity="0.85" />
              <path d="M55 70 l20-25 15 15 10-10" stroke={neon} strokeWidth="3" fill="none" />
            </>
          )}
          {(motif.includes("pitch") ||
            motif.includes("network") ||
            motif.includes("lead-flag") ||
            motif.includes("achieve") ||
            motif.includes("influence")) && (
            <>
              <polygon
                points="40,85 80,30 120,85"
                fill="rgba(57,243,255,0.35)"
                stroke={neon}
              />
              <circle cx="80" cy="55" r="8" fill="#ffd166" />
            </>
          )}
          {(motif.includes("plan") || motif.includes("focus-beam") || motif.includes("direct-arrow")) && (
            <>
              <rect
                x="38"
                y="28"
                width="84"
                height="64"
                rx="10"
                fill="rgba(255,255,255,0.1)"
                stroke={stroke}
              />
              <path d="M55 50 h50 M55 65 h35" stroke={neon} strokeWidth="4" />
            </>
          )}
          {(motif.includes("pause") ||
            motif.includes("soft") ||
            motif.includes("breathe") ||
            motif.includes("quiet-walk")) && (
            <>
              <circle cx="80" cy="55" r="28" fill="rgba(125,255,178,0.35)" />
              <path
                d="M60 70 C70 40, 90 40, 100 70"
                fill="none"
                stroke={stroke}
                strokeWidth="4"
              />
            </>
          )}
          {motif.includes("logic") && (
            <>
              <rect x="30" y="40" width="28" height="28" rx="6" fill="#39f3ff" opacity="0.85" />
              <rect x="66" y="40" width="28" height="28" rx="6" fill="#7dffb2" opacity="0.85" />
              <rect x="102" y="40" width="28" height="28" rx="6" fill="#ff6b9d" opacity="0.85" />
            </>
          )}
          {(motif.includes("open") || motif.includes("prototype")) && (
            <path
              d="M20 80 C50 60, 70 95, 100 55 S140 40, 155 50"
              fill="none"
              stroke="#ff6b9d"
              strokeWidth="6"
            />
          )}
        </svg>
      )}
    </div>
  );
}
