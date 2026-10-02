"use client";

import Link from "next/link";
import {
  forwardRef,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
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
  primary: "btn-primary",
  secondary: "btn-soft btn-secondary",
  ghost: "btn-ghost",
};

const sizeClass: Record<ButtonSize, string> = {
  default: "",
  sm: "btn-sm",
  lg: "btn-lg",
};

/**
 * Skillster button — DaisyUI `btn` tokens.
 * Use `href` for Next.js Link navigation.
 */
export const Button = forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ButtonProps
>(function Button(
  {
    className,
    variant = "primary",
    size = "default",
    href,
    asChild,
    type = "button",
    children,
    onClick,
    disabled,
  },
  ref,
): ReactElement {
  void asChild;
  const classes = cn(
    "btn",
    variantClass[variant],
    sizeClass[size],
    className,
  );

  if (href) {
    return (
      <Link
        href={href}
        className={classes}
        aria-disabled={disabled || undefined}
        onClick={
          onClick as unknown as React.MouseEventHandler<HTMLAnchorElement>
        }
        ref={ref as Ref<HTMLAnchorElement>}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled}
      onClick={onClick as React.MouseEventHandler<HTMLButtonElement>}
      ref={ref as Ref<HTMLButtonElement>}
    >
      {children}
    </button>
  );
});
