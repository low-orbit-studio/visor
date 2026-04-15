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
