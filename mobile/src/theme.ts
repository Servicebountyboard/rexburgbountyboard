export type ThemeMode = "light" | "dark";

export const palettes = {
  light: {
    background: "#F4EBDD", surface: "#FFF9EF", surfaceAlt: "#EEE2CF", text: "#28231D",
    muted: "#776E61", line: "#DCCDB7", accent: "#C58B3C", accentStrong: "#9C6426",
    accentSoft: "#F3E1C4", dark: "#382D20", success: "#4E8960", shadow: "#6A4C2B",
  },
  dark: {
    background: "#171716", surface: "#22211F", surfaceAlt: "#2D2B27", text: "#F6F0E6",
    muted: "#B7AEA1", line: "#403C35", accent: "#E2A64D", accentStrong: "#F3BC68",
    accentSoft: "#3D3020", dark: "#171513", success: "#64A879", shadow: "#000000",
  },
} as const;

export type AppColors = (typeof palettes)[ThemeMode];

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 22, xxl: 30 } as const;
export const radius = { sm: 10, md: 16, lg: 22, pill: 999 } as const;
