import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

/** Full-viewport ambient glass stage with floating orbs. */
export function GlassShell({ children, className = "" }: Props) {
  return (
    <div className={`glass-stage ${className}`}>
      <div
        className="glass-orb absolute left-[12%] top-[22%] h-24 w-24 opacity-70 md:h-36 md:w-36"
        style={{ animation: "orb-drift 16s ease-in-out infinite" }}
        aria-hidden
      />
      <div
        className="glass-orb absolute bottom-[18%] right-[18%] h-16 w-16 opacity-60 md:h-28 md:w-28"
        style={{ animation: "orb-drift 12s ease-in-out infinite reverse" }}
        aria-hidden
      />
      <div
        className="glass-orb absolute right-[30%] top-[12%] h-10 w-10 opacity-50"
        style={{ animation: "orb-drift 10s ease-in-out infinite" }}
        aria-hidden
      />
      <div className="content-layer flex min-h-dvh flex-col">{children}</div>
    </div>
  );
}
