"use client";

import { useCallback } from "react";
import { parseConfig } from "@loworbitstudio/visor-theme-engine";
import type { VisorThemeConfig } from "@loworbitstudio/visor-theme-engine";
import { THEME_GROUPS } from "@/lib/theme-config";
import styles from "./start-from-dropdown.module.css";

const DEFAULT_CONFIG: VisorThemeConfig = {
  name: "custom",
  version: 1,
  colors: {
    primary: "#6366F1",
    accent: "#F59E0B",
  },
};

interface StartFromDropdownProps {
  onLoadConfig: (config: VisorThemeConfig) => void;
}

export function StartFromDropdown({ onLoadConfig }: StartFromDropdownProps) {
  const handleChange = useCallback(
    async (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;

      if (value === "blank") {
        onLoadConfig(DEFAULT_CONFIG);
        return;
      }

      // Find the yamlFile from the central config
      const allThemes = THEME_GROUPS.flatMap((g) => g.themes);
      const entry = allThemes.find((t) => t.value === value);
      if (!entry?.yamlFile) return;

      try {
        const response = await fetch(`/themes/${entry.yamlFile}.visor.yaml`);
        if (!response.ok) throw new Error(`Failed to fetch theme: ${response.status}`);
        const yamlString = await response.text();
        const config = parseConfig(yamlString);
        onLoadConfig(config);
      } catch (err) {
        console.error("Failed to load theme config:", err);
      }
    },
    [onLoadConfig]
  );

  return (
    <div className={styles.wrapper}>
      <label htmlFor="start-from" className={styles.label}>
        Start from
      </label>
      <select
        id="start-from"
        className={styles.select}
        onChange={handleChange}
        defaultValue="blank"
      >
        <option value="blank">Blank</option>
        {THEME_GROUPS.map((group) => (
          <optgroup key={group.label} label={group.label}>
            {group.themes.map((theme) => (
              <option
                key={theme.value}
                value={theme.value}
                disabled={!theme.yamlFile}
              >
                {theme.label}
                {!theme.yamlFile ? " (no config)" : ""}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}
