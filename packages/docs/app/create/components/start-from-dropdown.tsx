"use client";

import { useCallback } from "react";
import { parseConfig } from "@loworbitstudio/visor-theme-engine";
import type { VisorThemeConfig } from "@loworbitstudio/visor-theme-engine";
import { THEME_GROUPS } from "@/lib/theme-config";
import styles from "./start-from-dropdown.module.css";

/** Map theme values to their .visor.yaml filenames (only themes with configs) */
const THEME_YAML_MAP: Record<string, string> = {
  blackout: "blackout",
  "blacklight-brand": "blacklight",
  kaiah: "kaiah",
  "reference-app": "reference-app",
};

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

      const yamlFile = THEME_YAML_MAP[value];
      if (!yamlFile) return;

      try {
        const response = await fetch(`/themes/${yamlFile}.visor.yaml`);
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
            {group.themes
              .filter((t) => t.value in THEME_YAML_MAP)
              .map((theme) => (
                <option key={theme.value} value={theme.value}>
                  {theme.label}
                </option>
              ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}
