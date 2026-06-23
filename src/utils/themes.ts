import type { CSSProperties } from "react";

export type ThemeId = "emerald" | "indigo" | "rose" | "amber" | "slate";

export interface AppTheme {
  id: ThemeId;
  name: string;
  description: string;
  swatches: string[];
  variables: CSSProperties;
}

export const THEME_STORAGE_KEY = "hari_billing_theme";

export const appThemes: AppTheme[] = [
  {
    id: "emerald",
    name: "Emerald Ledger",
    description: "Clean green and graphite",
    swatches: ["#059669", "#111827", "#ecfdf5"],
    variables: {
      "--theme-primary": "#059669",
      "--theme-primary-hover": "#047857",
      "--theme-header": "#111827",
      "--theme-page": "#f7f8fa",
      "--theme-soft": "#ecfdf5",
      "--theme-accent": "#0ea5e9",
      "--theme-accent-soft": "#e0f2fe",
    } as CSSProperties,
  },
  {
    id: "indigo",
    name: "Indigo Desk",
    description: "Sharp blue and violet",
    swatches: ["#4f46e5", "#1e1b4b", "#eef2ff"],
    variables: {
      "--theme-primary": "#4f46e5",
      "--theme-primary-hover": "#4338ca",
      "--theme-header": "#1e1b4b",
      "--theme-page": "#f8f8ff",
      "--theme-soft": "#eef2ff",
      "--theme-accent": "#06b6d4",
      "--theme-accent-soft": "#cffafe",
    } as CSSProperties,
  },
  {
    id: "rose",
    name: "Rose Studio",
    description: "Warm rose and ink",
    swatches: ["#e11d48", "#1f2937", "#fff1f2"],
    variables: {
      "--theme-primary": "#e11d48",
      "--theme-primary-hover": "#be123c",
      "--theme-header": "#1f2937",
      "--theme-page": "#fff7f8",
      "--theme-soft": "#fff1f2",
      "--theme-accent": "#f97316",
      "--theme-accent-soft": "#ffedd5",
    } as CSSProperties,
  },
  {
    id: "amber",
    name: "Amber Counter",
    description: "Retail gold and charcoal",
    swatches: ["#d97706", "#18181b", "#fffbeb"],
    variables: {
      "--theme-primary": "#d97706",
      "--theme-primary-hover": "#b45309",
      "--theme-header": "#18181b",
      "--theme-page": "#faf9f5",
      "--theme-soft": "#fffbeb",
      "--theme-accent": "#16a34a",
      "--theme-accent-soft": "#dcfce7",
    } as CSSProperties,
  },
  {
    id: "slate",
    name: "Slate Pro",
    description: "Neutral premium workspace",
    swatches: ["#334155", "#020617", "#f1f5f9"],
    variables: {
      "--theme-primary": "#334155",
      "--theme-primary-hover": "#1e293b",
      "--theme-header": "#020617",
      "--theme-page": "#f8fafc",
      "--theme-soft": "#f1f5f9",
      "--theme-accent": "#14b8a6",
      "--theme-accent-soft": "#ccfbf1",
    } as CSSProperties,
  },
];

export const defaultTheme = appThemes[0];

export const getThemeById = (themeId: string | null) =>
  appThemes.find((theme) => theme.id === themeId) || defaultTheme;
