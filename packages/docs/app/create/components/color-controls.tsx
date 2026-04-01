"use client";

import { useCallback } from "react";
import type { VisorThemeConfig } from "@loworbitstudio/visor-theme-engine";
import { ColorInput } from "./color-input";
import styles from "./color-controls.module.css";

interface ColorControlsProps {
  config: VisorThemeConfig;
  updateConfig: (path: string, value: unknown) => void;
}

/** Default placeholder values shown when a color is not set in config. */
const DEFAULTS: Record<string, string> = {
  primary: "#6366F1",
  accent: "#F59E0B",
  neutral: "#6b7280",
  background: "#ffffff",
  surface: "#ffffff",
  success: "#22c55e",
  warning: "#eab308",
  error: "#ef4444",
  info: "#3b82f6",
};

export function ColorControls({ config, updateConfig }: ColorControlsProps) {
  const colors = config.colors;

  const handleChange = useCallback(
    (role: string, hex: string) => {
      updateConfig(`colors.${role}`, hex);
    },
    [updateConfig]
  );

  const getColor = (role: string): string => {
    const val = colors[role as keyof typeof colors];
    return typeof val === "string" ? val : DEFAULTS[role] ?? "#000000";
  };

  const backgroundHex = getColor("background");

  return (
    <div className={styles.panel} role="group" aria-label="Color controls">
      {/* ─── Brand ─────────────────────────────────────────────────────── */}
      <div className={styles.group}>
        <h3 className={styles.groupTitle}>Brand</h3>
        <ColorInput
          role="primary"
          value={getColor("primary")}
          onChange={(hex) => handleChange("primary", hex)}
          required
          backgroundHex={backgroundHex}
          showShades
        />
        <ColorInput
          role="accent"
          value={getColor("accent")}
          onChange={(hex) => handleChange("accent", hex)}
          backgroundHex={backgroundHex}
          showShades
        />
        <ColorInput
          role="neutral"
          value={getColor("neutral")}
          onChange={(hex) => handleChange("neutral", hex)}
          showShades
        />
      </div>

      {/* ─── Surface ───────────────────────────────────────────────────── */}
      <div className={styles.group}>
        <h3 className={styles.groupTitle}>Surface</h3>
        <ColorInput
          role="background"
          value={getColor("background")}
          onChange={(hex) => handleChange("background", hex)}
        />
        <ColorInput
          role="surface"
          value={getColor("surface")}
          onChange={(hex) => handleChange("surface", hex)}
        />
      </div>

      {/* ─── Status ────────────────────────────────────────────────────── */}
      <div className={styles.group}>
        <h3 className={styles.groupTitle}>Status</h3>
        <ColorInput
          role="success"
          value={getColor("success")}
          onChange={(hex) => handleChange("success", hex)}
          showShades
        />
        <ColorInput
          role="warning"
          value={getColor("warning")}
          onChange={(hex) => handleChange("warning", hex)}
          showShades
        />
        <ColorInput
          role="error"
          value={getColor("error")}
          onChange={(hex) => handleChange("error", hex)}
          showShades
        />
        <ColorInput
          role="info"
          value={getColor("info")}
          onChange={(hex) => handleChange("info", hex)}
          showShades
        />
      </div>
    </div>
  );
}
