"use client";

import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import {
  skillsterCssVariablesResolver,
  skillsterTheme,
} from "@/theme/mantine";

type Props = {
  children: React.ReactNode;
};

/** App-wide Mantine shell — dark liquid-glass theme, notifications ready. */
export function MantineRoot({ children }: Props) {
  return (
    <MantineProvider
      theme={skillsterTheme}
      cssVariablesResolver={skillsterCssVariablesResolver}
      defaultColorScheme="dark"
      forceColorScheme="dark"
    >
      <Notifications position="top-center" zIndex={400} limit={3} />
      {children}
    </MantineProvider>
  );
}
