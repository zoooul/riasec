import type { ElementType, HTMLAttributes, ReactElement } from "react";
import { cn } from "@/lib/cn";

type HeadingSize = "sm" | "md" | "lg" | "xl" | "hero";

const headingSizeClass: Record<HeadingSize, string> = {
  sm: "text-xl md:text-2xl",
  md: "text-2xl sm:text-3xl md:text-[2.15rem]",
  lg: "text-3xl md:text-[2.75rem]",
  xl: "text-2xl",
  hero: "text-6xl sm:text-7xl md:text-8xl",
};

type HeadingProps<T extends ElementType = "h2"> = {
  as?: T;
  size?: HeadingSize;
} & HTMLAttributes<HTMLElement>;

export function Heading<T extends ElementType = "h2">({
  as,
  size = "md",
  className,
  ...props
}: HeadingProps<T>): ReactElement {
  const Tag = (as ?? "h2") as ElementType;
  return (
    <Tag
      className={cn("text-display", headingSizeClass[size], className)}
      {...props}
    />
  );
}

type TextVariant = "body" | "body-strong" | "muted" | "label";

const textVariantClass: Record<TextVariant, string> = {
  body: "text-body",
  "body-strong": "text-body text-[var(--muted-strong)]",
  muted: "text-body text-[var(--muted)]",
  label: "text-label",
};

type TextProps = HTMLAttributes<HTMLParagraphElement> & {
  variant?: TextVariant;
  as?: "p" | "span" | "div";
};

export function Text({
  variant = "body",
  as: Tag = "p",
  className,
  ...props
}: TextProps): ReactElement {
  return (
    <Tag className={cn(textVariantClass[variant], className)} {...props} />
  );
}
