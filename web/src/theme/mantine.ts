import {
  createTheme,
  type CSSVariablesResolver,
  type MantineColorsTuple,
} from "@mantine/core";

/** Neon cyan scale aligned with liquid-glass tokens. */
const skillCyan: MantineColorsTuple = [
  "#e6fafc",
  "#c5f0f5",
  "#9ce3ec",
  "#6fd4e1",
  "#5ec8d6",
  "#3fb4c4",
  "#2a9aab",
  "#1f7f8d",
  "#186672",
  "#104a53",
];

const skillMint: MantineColorsTuple = [
  "#eaf8f2",
  "#d0efe2",
  "#a8dfc6",
  "#7ccca6",
  "#6fbe9a",
  "#4fa87f",
  "#3a8c67",
  "#2d7052",
  "#245a43",
  "#1a4030",
];

const skillCoral: MantineColorsTuple = [
  "#fdf0f3",
  "#f8d7df",
  "#f0b0bf",
  "#e6899f",
  "#d8899a",
  "#c4667a",
  "#a84e61",
  "#8a3d4d",
  "#6f3140",
  "#522430",
];

export const skillsterTheme = createTheme({
  fontFamily: "var(--font-body), Figtree, Segoe UI, sans-serif",
  fontFamilyMonospace: "ui-monospace, SFMono-Regular, Menlo, monospace",
  headings: {
    fontFamily: "var(--font-display), Fraunces, Georgia, serif",
    fontWeight: "600",
  },
  primaryColor: "cyan",
  colors: {
    cyan: skillCyan,
    mint: skillMint,
    coral: skillCoral,
  },
  defaultRadius: "lg",
  cursorType: "pointer",
  focusRing: "auto",
  components: {
    Button: {
      defaultProps: {
        radius: "xl",
      },
    },
    Badge: {
      defaultProps: {
        radius: "xl",
        variant: "light",
      },
    },
    Modal: {
      defaultProps: {
        centered: true,
        radius: "lg",
        overlayProps: { backgroundOpacity: 0.55, blur: 6 },
      },
    },
    Progress: {
      defaultProps: {
        radius: "xl",
        size: "sm",
      },
    },
    Paper: {
      defaultProps: {
        radius: "lg",
      },
    },
  },
});

/** Map Mantine CSS vars onto the existing liquid-glass design tokens. */
export const skillsterCssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {
    "--mantine-color-body": "transparent",
    "--mantine-color-text": "var(--ink)",
    "--mantine-color-dimmed": "var(--muted)",
    "--mantine-color-anchor": "var(--neon-cyan)",
  },
  light: {},
  dark: {
    "--mantine-color-body": "transparent",
    "--mantine-color-text": "var(--ink)",
    "--mantine-color-dimmed": "var(--muted)",
    "--mantine-color-bright": "var(--ink)",
    "--mantine-color-anchor": "var(--neon-cyan)",
    "--mantine-color-default": "rgba(255, 255, 255, 0.06)",
    "--mantine-color-default-hover": "rgba(255, 255, 255, 0.1)",
    "--mantine-color-default-border": "rgba(255, 255, 255, 0.14)",
    "--mantine-color-placeholder": "var(--muted)",
  },
});
