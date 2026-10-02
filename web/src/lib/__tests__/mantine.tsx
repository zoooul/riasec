import { MantineProvider } from "@mantine/core";
import type { ReactNode } from "react";
import {
  skillsterCssVariablesResolver,
  skillsterTheme,
} from "@/theme/mantine";

/** Wrap UI under test so Mantine context is available in Vitest. */
export function withMantine(node: ReactNode) {
  return (
    <MantineProvider
      theme={skillsterTheme}
      cssVariablesResolver={skillsterCssVariablesResolver}
      forceColorScheme="dark"
    >
      {node}
    </MantineProvider>
  );
}
