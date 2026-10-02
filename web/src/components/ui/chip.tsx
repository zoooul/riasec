"use client";

import { Badge, UnstyledButton, type BadgeProps } from "@mantine/core";
import Link from "next/link";
import type { ReactElement, ReactNode } from "react";
import { cn } from "@/lib/cn";

type ChipProps = {
  className?: string;
  children?: ReactNode;
  onClick?: () => void;
  href?: string;
  /** @deprecated Prefer href/onClick */
  asChild?: boolean;
} & Omit<BadgeProps, "className" | "children" | "component">;

/** Soft glass status chip — Mantine Badge with Skillster tokens. */
export function Chip({
  className,
  children,
  asChild,
  onClick,
  href,
  ...props
}: ChipProps): ReactElement {
  void asChild;
  const classes = cn("glass-chip", className);

  if (href) {
    return (
      <Badge
        component={Link}
        href={href}
        className={classes}
        variant="light"
        color="cyan"
        size="lg"
        {...props}
      >
        {children}
      </Badge>
    );
  }

  if (onClick) {
    return (
      <UnstyledButton
        type="button"
        onClick={onClick}
        className={classes}
        style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
      >
        {children}
      </UnstyledButton>
    );
  }

  return (
    <Badge
      className={classes}
      variant="light"
      color="cyan"
      size="lg"
      {...props}
    >
      {children}
    </Badge>
  );
}
