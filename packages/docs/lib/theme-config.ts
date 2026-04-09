export interface ThemeEntry {
  value: string;
  label: string;
  /** Filename (without .visor.yaml extension) if a YAML config exists in /public/themes/ */
  yamlFile?: string;
}

export interface ThemeGroup {
  label: string;
  themes: ThemeEntry[];
}

export const THEME_GROUPS: ThemeGroup[] = [
  {
    label: "Visor",
    themes: [
      { value: "blackout", label: "Blackout", yamlFile: "blackout" },
      { value: "neutral", label: "Neutral", yamlFile: "neutral" },
      { value: "space", label: "Space", yamlFile: "space" },
    ],
  },
  {
    label: "Client",
    themes: [
      { value: "entr", label: "ENTR", yamlFile: "entr" },
      { value: "kaiah", label: "Kaiah", yamlFile: "kaiah" },
      { value: "veronica", label: "Veronica", yamlFile: "veronica" },
    ],
  },
  {
    label: "Low Orbit",
    themes: [
      { value: "blacklight-brand", label: "Blacklight Brand", yamlFile: "blacklight" },
      { value: "reference-app", label: "Reference App", yamlFile: "reference-app" },
    ],
  },
];

export const ALL_THEMES = THEME_GROUPS.flatMap((g) => g.themes.map((t) => t.value));
