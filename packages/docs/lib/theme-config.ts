// Hand-authored. Edit `STOCK_GROUPS` only by running `visor theme sync`.
// The merge below and the interface declarations are hand-authored — safe to edit.

import { customThemeGroups } from "./theme-config.custom.generated";

export interface ThemeEntry {
  value: string;
  label: string;
  /** Filename (without .visor.yaml extension) if a YAML config exists in /public/themes/ */
  yamlFile?: string;
  /** When set, activating this theme forces the docs site into the specified color mode. */
  defaultMode?: "dark" | "light";
}

export interface ThemeGroup {
  label: string;
  themes: ThemeEntry[];
}

/* BEGIN visor-stock-themes — managed by `visor theme sync` */
const STOCK_GROUPS: ThemeGroup[] = [
  {
    label: "Visor",
    themes: [
      { value: "blackout", label: "Blackout", yamlFile: "blackout" },
      { value: "modern-minimal", label: "Modern Minimal", yamlFile: "modern-minimal" },
      { value: "neutral", label: "Neutral", yamlFile: "neutral" },
      { value: "space", label: "Space", yamlFile: "space" },
    ],
  },
];
/* END visor-stock-themes */

export const THEME_GROUPS: ThemeGroup[] = [...STOCK_GROUPS, ...customThemeGroups];

export const ALL_THEMES = THEME_GROUPS.flatMap((g) => g.themes.map((t) => t.value));

export const THEME_STORAGE_KEY = "visor-theme";
export const DEFAULT_THEME = "blackout";
export type ColorMode = "light" | "dark";

export function findThemeEntry(theme: string): ThemeEntry | undefined {
  return THEME_GROUPS.flatMap((g) => g.themes).find((t) => t.value === theme);
}

/** Flip the <html> color-mode class and color-scheme without touching the theme class. */
export function applyMode(mode: ColorMode) {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  if (mode === "dark") {
    html.classList.add("dark");
    html.classList.remove("light");
    html.style.colorScheme = "dark";
  } else {
    html.classList.add("light");
    html.classList.remove("dark");
    html.style.colorScheme = "light";
  }
}

/**
 * Apply a theme by swapping the `*-theme` class on <body>. Persists to localStorage
 * and dispatches a `visor-theme-change` event so listeners can react. If the theme
 * declares a `defaultMode`, that mode is forced; otherwise the current mode stays put.
 */
export function applyTheme(theme: string) {
  if (typeof document === "undefined") return;
  const body = document.body;
  for (const t of ALL_THEMES) {
    body.classList.remove(`${t}-theme`);
  }
  body.classList.add(`${theme}-theme`);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {}

  const entry = findThemeEntry(theme);
  if (entry?.defaultMode) applyMode(entry.defaultMode);

  document.dispatchEvent(new CustomEvent("visor-theme-change"));
}

export function getStoredTheme(): string {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && ALL_THEMES.includes(stored)) return stored;
  } catch {}
  return DEFAULT_THEME;
}
