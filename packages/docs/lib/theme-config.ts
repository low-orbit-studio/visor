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
    label: "Client",
    themes: [
      { value: "entr", label: "ENTR" },
      { value: "kaiah", label: "Kaiah" },
      { value: "veronica", label: "Veronica" },
    ],
  },
  {
    label: "Low Orbit",
    themes: [
      { value: "blacklight-brand", label: "Blacklight Brand" },
      { value: "reference-app", label: "Reference App" },
    ],
  },
];

export const ALL_THEMES = THEME_GROUPS.flatMap((g) => g.themes.map((t) => t.value));
