import * as Slot from "@radix-ui/react-slot";
import type { HTMLAttributes, ReactElement } from "react";
import { cn } from "@/lib/cn";

type ChipProps = HTMLAttributes<HTMLElement> & {
  asChild?: boolean;
};

export function Chip({
  className,
  asChild = false,
  ...props
}: ChipProps): ReactElement {
  const Comp = asChild ? Slot.Root : "span";
  return <Comp className={cn("glass-chip", className)} {...props} />;
}
