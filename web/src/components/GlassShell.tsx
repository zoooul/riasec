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
        className="glass-orb absolute left-[12%] top-[24%] h-20 w-20 md:h-28 md:w-28"
        style={{ animation: "orb-drift 18s ease-in-out infinite" }}
        aria-hidden
      />
      <div
        className="glass-orb absolute bottom-[20%] right-[16%] h-14 w-14 md:h-22 md:w-22"
        style={{ animation: "orb-drift 14s ease-in-out infinite reverse" }}
        aria-hidden
      />
      <div className="content-layer flex min-h-dvh flex-col">{children}</div>
    </div>
  );
}
