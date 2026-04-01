"use client";

import { useMemo } from "react";
import { NumberInput } from "@/components/ui/number-input";
import styles from "./spacing-controls.module.css";

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface SpacingControlsProps {
  spacingBase: number;
  radiusSm: number;
  radiusMd: number;
  radiusLg: number;
  radiusXl: number;
  radiusPill: number;
  onSpacingBaseChange: (value: number) => void;
  onRadiusSmChange: (value: number) => void;
  onRadiusMdChange: (value: number) => void;
  onRadiusLgChange: (value: number) => void;
  onRadiusXlChange: (value: number) => void;
  onRadiusPillChange: (value: number) => void;
}

/* ─── Spacing scale multipliers ──────────────────────────────────────────── */

const SPACING_MULTIPLIERS = [
  { label: "1", multiplier: 1 },
  { label: "2", multiplier: 2 },
  { label: "3", multiplier: 3 },
  { label: "4", multiplier: 4 },
  { label: "6", multiplier: 6 },
  { label: "8", multiplier: 8 },
  { label: "12", multiplier: 12 },
  { label: "16", multiplier: 16 },
];

/* ─── SpacingControls ────────────────────────────────────────────────────── */

export function SpacingControls({
  spacingBase,
  radiusSm,
  radiusMd,
  radiusLg,
  radiusXl,
  radiusPill,
  onSpacingBaseChange,
  onRadiusSmChange,
  onRadiusMdChange,
  onRadiusLgChange,
  onRadiusXlChange,
  onRadiusPillChange,
}: SpacingControlsProps) {
  const spacingScale = useMemo(
    () =>
      SPACING_MULTIPLIERS.map((m) => ({
        ...m,
        value: spacingBase * m.multiplier,
      })),
    [spacingBase]
  );

  const maxSpacingValue = useMemo(
    () => Math.max(...spacingScale.map((s) => s.value)),
    [spacingScale]
  );

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Spacing &amp; Radius</h3>

      {/* Spacing base */}
      <div className={styles.subsection}>
        <h4 className={styles.subsectionLabel}>Spacing Base</h4>
        <div className={styles.fieldGroup}>
          <span className={styles.fieldLabel}>Base unit (px)</span>
          <NumberInput
            value={spacingBase}
            onChange={(v) => onSpacingBaseChange(v ?? 4)}
            min={1}
            step={1}
            aria-label="Spacing base value"
          />
        </div>

        {/* Visual preview strip */}
        <div className={styles.previewStrip}>
          {spacingScale.map((step) => (
            <div key={step.label} className={styles.previewBarWrapper}>
              <div
                className={styles.previewBar}
                style={{ height: `${Math.max(2, (step.value / maxSpacingValue) * 40)}px` }}
              />
              <span className={styles.previewLabel}>
                {step.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Radius */}
      <div className={styles.subsection}>
        <h4 className={styles.subsectionLabel}>Border Radius</h4>
        <div className={styles.radiusGrid}>
          <div className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>sm (px)</span>
            <NumberInput
              value={radiusSm}
              onChange={(v) => onRadiusSmChange(v ?? 2)}
              min={0}
              step={1}
              aria-label="Radius small"
            />
          </div>
          <div className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>md (px)</span>
            <NumberInput
              value={radiusMd}
              onChange={(v) => onRadiusMdChange(v ?? 4)}
              min={0}
              step={1}
              aria-label="Radius medium"
            />
          </div>
          <div className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>lg (px)</span>
            <NumberInput
              value={radiusLg}
              onChange={(v) => onRadiusLgChange(v ?? 8)}
              min={0}
              step={1}
              aria-label="Radius large"
            />
          </div>
          <div className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>xl (px)</span>
            <NumberInput
              value={radiusXl}
              onChange={(v) => onRadiusXlChange(v ?? 12)}
              min={0}
              step={1}
              aria-label="Radius extra large"
            />
          </div>
          <div className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>pill (px)</span>
            <NumberInput
              value={radiusPill}
              onChange={(v) => onRadiusPillChange(v ?? 9999)}
              min={0}
              step={1}
              aria-label="Radius pill"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
