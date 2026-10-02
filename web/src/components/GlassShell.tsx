import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

/** Full-viewport ambient glass stage with restrained floating orbs. */
export function GlassShell({ children, className = "" }: Props) {
  return (
    <div className={`glass-stage ${className}`}>
      <div
        className="glass-orb glass-deco absolute left-[10%] top-[22%] z-0 h-16 w-16 opacity-40 md:h-24 md:w-24"
        style={{ animation: "orb-drift 18s ease-in-out infinite" }}
        aria-hidden
      />
      <div
        className="glass-orb glass-deco absolute bottom-[18%] right-[14%] z-0 h-12 w-12 opacity-35 md:h-20 md:w-20"
        style={{ animation: "orb-drift 14s ease-in-out infinite reverse" }}
        aria-hidden
      />
      <div className="content-layer relative z-[1] flex min-h-dvh min-w-0 flex-col">
        {children}
      </div>
    </div>
  );
}
