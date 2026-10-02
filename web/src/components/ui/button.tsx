"use client";

import {
  Button as MantineButton,
  type ButtonProps as MantineButtonProps,
} from "@mantine/core";
import Link from "next/link";
import type { ReactElement, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "default" | "sm" | "lg";

type SharedProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: ReactNode;
  className?: string;
  disabled?: boolean;
  /** @deprecated Prefer `href` */
  asChild?: boolean;
};

export type ButtonProps = SharedProps &
  (
    | {
        href: string;
        type?: never;
        onClick?: React.MouseEventHandler<HTMLAnchorElement>;
      }
    | {
        href?: undefined;
        type?: "button" | "submit" | "reset";
        onClick?: React.MouseEventHandler<HTMLButtonElement>;
      }
  );

const variantClass: Record<ButtonVariant, string> = {
  primary: "glass-btn-primary",
  secondary: "glass-btn-secondary",
  ghost: "glass-btn-ghost",
};

const sizeClass: Record<ButtonSize, string> = {
  default: "glass-btn-md",
  sm: "glass-btn-sm",
  lg: "glass-btn-lg",
};

const sizeMap: Record<ButtonSize, MantineButtonProps["size"]> = {
  default: "md",
  sm: "sm",
  lg: "lg",
};

/**
 * Skillster button — Mantine Button + liquid-glass class tokens.
 * Use `href` for navigation (Link via Mantine `component`).
 */
export function Button({
  className,
  variant = "primary",
  size = "default",
  href,
  asChild,
  type = "button",
  children,
  onClick,
  disabled,
}: ButtonProps): ReactElement {
  void asChild;
  const classes = cn(
    "glass-btn",
    variantClass[variant],
    sizeClass[size],
    className,
  );

  if (href) {
    return (
      <MantineButton
        component={Link}
        href={href}
        className={classes}
        size={sizeMap[size]}
        variant="subtle"
        disabled={disabled}
        onClick={
          onClick as unknown as React.MouseEventHandler<HTMLAnchorElement>
        }
      >
        {children}
      </MantineButton>
    );
  }

  return (
    <MantineButton
      type={type}
      className={classes}
      size={sizeMap[size]}
      variant="subtle"
      disabled={disabled}
      onClick={onClick as React.MouseEventHandler<HTMLButtonElement>}
    >
      {children}
    </MantineButton>
  );
}
