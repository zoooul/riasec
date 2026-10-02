"use client";

import { Text as MantineText, Title, type TitleOrder } from "@mantine/core";
import type { ReactElement, ReactNode } from "react";
import { cn } from "@/lib/cn";

type HeadingSize = "sm" | "md" | "lg" | "xl" | "hero";

const headingOrder: Record<HeadingSize, TitleOrder> = {
  sm: 3,
  md: 2,
  lg: 1,
  xl: 3,
  hero: 1,
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
  const order = as
    ? (Number(as.replace("h", "")) as TitleOrder)
    : headingOrder[size];
  return (
    <Title
      order={order}
      className={cn("text-display", headingSizeClass[size], className)}
    >
      {children}
    </Title>
  );
}

type TextVariant = "body" | "body-strong" | "muted" | "label";

const textVariantClass: Record<TextVariant, string> = {
  body: "text-body",
  "body-strong": "text-body text-[var(--muted-strong)]",
  muted: "text-body text-[var(--muted)]",
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
  as = "p",
  className,
  children,
}: TextProps): ReactElement {
  return (
    <MantineText
      component={as}
      className={cn(textVariantClass[variant], className)}
    >
      {children}
    </MantineText>
  );
}
