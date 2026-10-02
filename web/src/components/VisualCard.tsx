type MotifProps = {
  motif: string;
  kind: "pattern" | "scene" | "affect";
};

/** Lightweight SVG placeholders until real PSE/OASIS/CC0 assets are wired. */
export function VisualCard({ motif, kind }: MotifProps) {
  const bg =
    kind === "pattern"
      ? "from-[#d5e8e6] to-[#eef4f7]"
      : kind === "affect"
        ? "from-[#d9e4ef] to-[#f2f6f8]"
        : "from-[#cfe0e8] to-[#f4f8fa]";

  return (
    <div
      className={`relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-gradient-to-br ${bg}`}
      aria-hidden
    >
      <svg viewBox="0 0 160 120" className="h-full w-full">
        {motif.includes("grid") && (
          <>
            {[20, 40, 60, 80, 100, 120, 140].map((x) => (
              <line
                key={`v${x}`}
                x1={x}
                y1={10}
                x2={x}
                y2={110}
                stroke="#2f4a3c"
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
                stroke="#2f4a3c"
                strokeOpacity="0.25"
              />
            ))}
            <circle cx="92" cy="48" r="6" fill="#0f5c63" />
          </>
        )}
        {motif.includes("wave") || motif.includes("gestalt") ? (
          <path
            d="M10 70 C40 20, 70 120, 100 50 S140 20, 155 65"
            fill="none"
            stroke="#1f4d5c"
            strokeWidth="6"
            strokeLinecap="round"
          />
        ) : null}
        {motif.includes("checklist") && (
          <>
            <rect x="35" y="25" width="90" height="70" rx="8" fill="#fffaf2" />
            <path
              d="M50 45 h50 M50 60 h40 M50 75 h55"
              stroke="#2f4a3c"
              strokeWidth="4"
            />
            <path
              d="M42 44 l5 5 10-12"
              fill="none"
              stroke="#2f7a4d"
              strokeWidth="3"
            />
          </>
        )}
        {motif.includes("idea") && (
          <>
            <circle cx="80" cy="48" r="18" fill="#f0c95a" />
            <path
              d="M80 68 v18 M70 55 h-18 M90 55 h18 M68 38 l-14-14 M92 38 l14-14"
              stroke="#1f4d5c"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </>
        )}
        {motif.includes("chart") && (
          <>
            <rect x="30" y="55" width="18" height="40" fill="#1f4d5c" />
            <rect x="58" y="35" width="18" height="60" fill="#3f7d6a" />
            <rect x="86" y="45" width="18" height="50" fill="#1f4d5c" />
            <rect x="114" y="28" width="18" height="67" fill="#0f5c63" />
          </>
        )}
        {motif.includes("circle") || motif.includes("warm") || motif.includes("group") || motif.includes("coaching") ? (
          <>
            <circle cx="55" cy="55" r="14" fill="#d9a48a" />
            <circle cx="85" cy="48" r="14" fill="#c9896d" />
            <circle cx="115" cy="58" r="14" fill="#e0b59f" />
            <ellipse cx="85" cy="95" rx="45" ry="12" fill="#1f4d5c" opacity="0.15" />
          </>
        ) : null}
        {motif.includes("calendar") && (
          <>
            <rect x="40" y="28" width="80" height="70" rx="8" fill="#fffaf2" />
            <rect x="40" y="28" width="80" height="18" fill="#1f4d5c" />
            <circle cx="60" cy="68" r="5" fill="#3f7d6a" />
            <circle cx="80" cy="68" r="5" fill="#3f7d6a" />
            <circle cx="100" cy="68" r="5" fill="#0f5c63" />
          </>
        )}
        {motif.includes("quiet") && (
          <>
            <rect x="45" y="50" width="70" height="8" rx="2" fill="#1f4d5c" />
            <rect x="55" y="35" width="50" height="30" rx="4" fill="#fffaf2" />
            <circle cx="120" cy="30" r="10" fill="#f0c95a" opacity="0.7" />
          </>
        )}
        {motif.includes("workshop") && (
          <>
            <rect x="30" y="70" width="100" height="12" fill="#6b4f3a" />
            <rect x="70" y="40" width="10" height="35" fill="#888" />
            <circle cx="75" cy="38" r="10" fill="#bbb" />
          </>
        )}
        {motif.includes("lab") && (
          <>
            <path
              d="M60 30 h20 l15 55 h-50 z"
              fill="#9fd0c2"
              stroke="#1f4d5c"
              strokeWidth="3"
            />
            <circle cx="110" cy="40" r="12" fill="none" stroke="#1f4d5c" strokeWidth="4" />
          </>
        )}
        {motif.includes("office") && (
          <>
            <rect x="35" y="30" width="90" height="60" rx="6" fill="#fffaf2" />
            {[42, 54, 66, 78].map((y) => (
              <line
                key={y}
                x1="48"
                y1={y}
                x2="112"
                y2={y}
                stroke="#1f4d5c"
                strokeWidth="3"
              />
            ))}
          </>
        )}
        {motif.includes("studio") && (
          <>
            <rect x="40" y="35" width="55" height="45" fill="#fffaf2" stroke="#1f4d5c" />
            <circle cx="110" cy="55" r="18" fill="#0f5c63" opacity="0.8" />
            <path d="M55 70 l20-25 15 15 10-10" stroke="#1f4d5c" strokeWidth="3" fill="none" />
          </>
        )}
        {motif.includes("pitch") && (
          <>
            <polygon points="40,85 80,30 120,85" fill="#1f4d5c" opacity="0.85" />
            <circle cx="80" cy="55" r="8" fill="#f0c95a" />
          </>
        )}
        {motif.includes("plan") && (
          <>
            <rect x="38" y="28" width="84" height="64" rx="8" fill="#fffaf2" />
            <path d="M55 50 h50 M55 65 h35" stroke="#1f4d5c" strokeWidth="4" />
          </>
        )}
        {motif.includes("pause") || motif.includes("soft") ? (
          <>
            <circle cx="80" cy="55" r="28" fill="#9fd0c2" opacity="0.7" />
            <path
              d="M60 70 C70 40, 90 40, 100 70"
              fill="none"
              stroke="#1f4d5c"
              strokeWidth="4"
            />
          </>
        ) : null}
        {motif.includes("logic") && (
          <>
            <rect x="30" y="40" width="28" height="28" fill="#1f4d5c" />
            <rect x="66" y="40" width="28" height="28" fill="#3f7d6a" />
            <rect x="102" y="40" width="28" height="28" fill="#1f4d5c" />
          </>
        )}
        {motif.includes("open") && (
          <path
            d="M20 80 C50 60, 70 95, 100 55 S140 40, 155 50"
            fill="none"
            stroke="#0f5c63"
            strokeWidth="6"
          />
        )}
      </svg>
    </div>
  );
}
