"use client";

import { useMemo } from "react";
import type { ColorRole, ShadeStep } from "@loworbitstudio/visor-theme-engine";
import { generateShadeScale } from "@loworbitstudio/visor-theme-engine";
import styles from "./shade-preview.module.css";

const FULL_SHADE_STEPS: ShadeStep[] = [
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
];

const ANCHOR_SHADE: Partial<Record<ColorRole, ShadeStep>> = {
  primary: 600,
  accent: 600,
  neutral: 500,
  success: 500,
  warning: 500,
  error: 500,
  info: 500,
};

interface ShadePreviewProps {
  color: string;
  role: ColorRole;
}

export function ShadePreview({ color, role }: ShadePreviewProps) {
  const scale = useMemo(() => {
    try {
      return generateShadeScale(color, role);
    } catch {
      return null;
    }
  }, [color, role]);

  if (!scale) return null;

  const anchorStep = ANCHOR_SHADE[role] ?? 600;

  return (
    <div className={styles.strip} role="img" aria-label={`${role} shade scale`}>
      {FULL_SHADE_STEPS.map((step) => {
        const hex = scale[step as keyof typeof scale];
        if (!hex) return null;
        return (
          <div
            key={step}
            className={styles.swatch}
            style={{ backgroundColor: hex }}
            data-anchor={step === anchorStep ? "true" : undefined}
            title={`${step}: ${hex}`}
          />
        );
      })}
    </div>
  );
}
