import type { LicenseLayer } from "@/lib/types";

export type AttributionLine = {
  id: string;
  name: string;
  license: string;
  url: string;
  layer?: LicenseLayer | "owned";
};

type Props = {
  lines: AttributionLine[];
  className?: string;
};

/**
 * Compact license attribution footer for Ergebnis / About surfaces.
 * Receives preloaded lines from a server page (licenses.server stays off client).
 */
export function LicenseAttribution({ lines, className = "" }: Props) {
  if (!lines.length) return null;

  return (
    <footer
      className={`border-t border-white/10 px-4 py-6 text-center ${className}`}
    >
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
        Quellen & Lizenzen
      </p>
      <ul className="mx-auto flex max-w-2xl flex-col gap-1.5 text-xs leading-relaxed text-[var(--muted)] md:text-sm">
        {lines.map((line) => (
          <li key={line.id}>
            <span className="text-[var(--ink)]">{line.name}</span>
            {" · "}
            <span>{line.license}</span>
            {line.url.startsWith("http") ? (
              <>
                {" · "}
                <a
                  href={line.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[var(--neon-cyan)] underline-offset-2 hover:underline"
                >
                  Link
                </a>
              </>
            ) : null}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[10px] text-[var(--muted)] md:text-xs">
        Extra-Quellen (NC/Research) bleiben austauschbar und erscheinen hier nur
        bei Freigabe.
      </p>
    </footer>
  );
}
