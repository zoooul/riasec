import * as Slot from "@radix-ui/react-slot";
import type { ButtonHTMLAttributes, ReactElement } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "default" | "sm" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
};

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

export function Button({
  className,
  variant = "primary",
  size = "default",
  asChild = false,
  type = "button",
  ...props
}: ButtonProps): ReactElement {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      type={asChild ? undefined : type}
      className={cn(
        "glass-btn",
        variantClass[variant],
        sizeClass[size],
        className,
      )}
      {...props}
    />
  );
}
