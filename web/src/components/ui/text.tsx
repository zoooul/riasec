"use client";

import type { ReactElement, ReactNode } from "react";
import { cn } from "@/lib/cn";

type HeadingSize = "sm" | "md" | "lg" | "xl" | "hero";

const headingTag: Record<HeadingSize, keyof HTMLElementTagNameMap> = {
  sm: "h3",
  md: "h2",
  lg: "h1",
  xl: "h3",
  hero: "h1",
};

const headingSizeClass: Record<HeadingSize, string> = {
  sm: "text-xl md:text-2xl",
  md: "text-2xl sm:text-3xl md:text-[2.15rem]",
  lg: "text-3xl md:text-[2.75rem]",
  xl: "text-2xl",
  hero: "text-6xl sm:text-7xl md:text-8xl",
};

type HeadingProps = {
  as?: "h1" | "h2" | "h3" | "h4";
  size?: HeadingSize;
  className?: string;
  children?: ReactNode;
};

export function Heading({
  as,
  size = "md",
  className,
  children,
}: HeadingProps): ReactElement {
  const Tag = (as ?? headingTag[size]) as "h1" | "h2" | "h3" | "h4";
  return (
    <Tag className={cn("display-title", headingSizeClass[size], className)}>
      {children}
    </Tag>
  );
}

type TextVariant = "body" | "body-strong" | "muted" | "label";

const textVariantClass: Record<TextVariant, string> = {
  body: "text-body",
  "body-strong": "text-body text-base-content/80",
  muted: "text-body text-base-content/60",
  label: "text-label",
};

type TextProps = {
  variant?: TextVariant;
  as?: "p" | "span" | "div";
  className?: string;
  children?: ReactNode;
};

export function Text({
  variant = "body",
  as: Tag = "p",
  className,
  children,
}: TextProps): ReactElement {
  return (
    <Tag className={cn(textVariantClass[variant], className)}>{children}</Tag>
  );
}
