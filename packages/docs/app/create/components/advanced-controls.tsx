"use client";

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import styles from "./advanced-controls.module.css";

/* ─── Default values from resolve.ts ─────────────────────────────────────── */

const SHADOW_DEFAULTS = {
  xs: "0 1px 1px 0 rgba(0, 0, 0, 0.04)",
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
};

const MOTION_DEFAULTS = {
  "duration-fast": 100,
  "duration-normal": 200,
  "duration-slow": 500,
  easing: "cubic-bezier(0.4, 0, 0.2, 1)",
};

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface AdvancedControlsProps {
  shadowXs: string;
  shadowSm: string;
  shadowMd: string;
  shadowLg: string;
  shadowXl: string;
  motionDurationFast: string;
  motionDurationNormal: string;
  motionDurationSlow: string;
  motionEasing: string;
  onShadowChange: (size: string, value: string) => void;
  onMotionDurationChange: (speed: string, value: string) => void;
  onMotionEasingChange: (value: string) => void;
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

/** Parse ms value like "100ms" to number, or return the number directly */
function parseDuration(value: string): number | undefined {
  const num = parseInt(value.replace(/ms$/, ""), 10);
  return Number.isNaN(num) ? undefined : num;
}

/* ─── AdvancedControls ───────────────────────────────────────────────────── */

export function AdvancedControls({
  shadowXs,
  shadowSm,
  shadowMd,
  shadowLg,
  shadowXl,
  motionDurationFast,
  motionDurationNormal,
  motionDurationSlow,
  motionEasing,
  onShadowChange,
  onMotionDurationChange,
  onMotionEasingChange,
}: AdvancedControlsProps) {
  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="advanced">
        <AccordionTrigger>Advanced</AccordionTrigger>
        <AccordionContent>
          <div className={styles.section}>
            {/* Shadows */}
            <div className={styles.subsection}>
              <h4 className={styles.subsectionLabel}>Shadows</h4>
              {(
                [
                  ["xs", shadowXs, SHADOW_DEFAULTS.xs],
                  ["sm", shadowSm, SHADOW_DEFAULTS.sm],
                  ["md", shadowMd, SHADOW_DEFAULTS.md],
                  ["lg", shadowLg, SHADOW_DEFAULTS.lg],
                  ["xl", shadowXl, SHADOW_DEFAULTS.xl],
                ] as const
              ).map(([size, value, placeholder]) => (
                <div key={size} className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>{size}</span>
                  <Input
                    value={value}
                    placeholder={placeholder}
                    onChange={(e) => onShadowChange(size, e.target.value)}
                    aria-label={`Shadow ${size}`}
                  />
                </div>
              ))}
            </div>

            {/* Motion */}
            <div className={styles.subsection}>
              <h4 className={styles.subsectionLabel}>Motion</h4>
              <div className={styles.durationGrid}>
                {(
                  [
                    ["duration-fast", motionDurationFast, MOTION_DEFAULTS["duration-fast"]],
                    ["duration-normal", motionDurationNormal, MOTION_DEFAULTS["duration-normal"]],
                    ["duration-slow", motionDurationSlow, MOTION_DEFAULTS["duration-slow"]],
                  ] as const
                ).map(([key, value, defaultMs]) => (
                  <div key={key} className={styles.fieldGroup}>
                    <span className={styles.fieldLabel}>
                      {key.replace("duration-", "")} (ms)
                    </span>
                    <NumberInput
                      value={parseDuration(value)}
                      onChange={(v) =>
                        onMotionDurationChange(key, v !== undefined ? `${v}ms` : `${defaultMs}ms`)
                      }
                      min={0}
                      step={50}
                      aria-label={`Motion ${key}`}
                    />
                  </div>
                ))}
              </div>
              <div className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>Easing</span>
                <Input
                  value={motionEasing}
                  placeholder={MOTION_DEFAULTS.easing}
                  onChange={(e) => onMotionEasingChange(e.target.value)}
                  aria-label="Motion easing"
                />
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
