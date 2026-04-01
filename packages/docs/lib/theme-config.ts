export interface ThemeEntry {
  value: string;
  label: string;
}

export interface ThemeGroup {
  label: string;
  themes: ThemeEntry[];
}

export const THEME_GROUPS: ThemeGroup[] = [
  {
    label: "Visor",
    themes: [
      { value: "blackout", label: "Blackout" },
      { value: "neutral", label: "Neutral" },
      { value: "space", label: "Space" },
    ],
  },
  {
    label: "Low Orbit",
    themes: [
      { value: "blacklight-brand", label: "Blacklight Brand" },
      { value: "kaiah", label: "Kaiah" },
      { value: "reference-app", label: "Reference App" },
    ],
  },
];

export const ALL_THEMES = THEME_GROUPS.flatMap((g) => g.themes.map((t) => t.value));
