"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { ColorRole } from "@loworbitstudio/visor-theme-engine";
import {
  isValidColor,
  getContrastRatio,
  normalizeHex,
} from "@loworbitstudio/visor-theme-engine";
import { OklchPicker } from "./oklch-picker";
import { ShadePreview } from "./shade-preview";
import styles from "./color-input.module.css";

interface ColorInputProps {
  role: ColorRole | "background" | "surface";
  value: string;
  onChange: (hex: string) => void;
  required?: boolean;
  /** Background color for contrast checking. Pass the current background hex. */
  backgroundHex?: string;
  /** Show shade preview strip below the input */
  showShades?: boolean;
}

export function ColorInput({
  role,
  value,
  onChange,
  required = false,
  backgroundHex,
  showShades = false,
}: ColorInputProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [isInputValid, setIsInputValid] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync input value when external value changes
  useEffect(() => {
    setInputValue(value);
    setIsInputValid(true);
  }, [value]);

  // Close picker on outside click
  useEffect(() => {
    if (!pickerOpen) return;

    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setPickerOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [pickerOpen]);

  const handleHexChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let raw = e.target.value;
      setInputValue(raw);

      // Auto-prepend # if missing
      if (raw && !raw.startsWith("#")) {
        raw = `#${raw}`;
      }

      const normalized = normalizeHex(raw);
      if (normalized) {
        setIsInputValid(true);
        onChange(normalized);
      } else {
        setIsInputValid(raw.length === 0 || raw === "#");
      }
    },
    [onChange]
  );

  const handleHexBlur = useCallback(() => {
    // On blur, revert to the current valid value if input is invalid
    if (!isInputValid) {
      setInputValue(value);
      setIsInputValid(true);
    }
  }, [isInputValid, value]);

  const handlePickerChange = useCallback(
    (hex: string) => {
      setInputValue(hex);
      setIsInputValid(true);
      onChange(hex);
    },
    [onChange]
  );

  // Compute contrast ratio for primary-on-background
  const contrastRatio =
    backgroundHex && isValidColor(value) && isValidColor(backgroundHex)
      ? getContrastRatio(value, backgroundHex)
      : null;

  const isColorRole = (r: string): r is ColorRole =>
    ["primary", "accent", "neutral", "success", "warning", "error", "info"].includes(r);

  return (
    <div ref={containerRef} className={styles.container}>
      <div className={styles.labelRow}>
        <span className={styles.label}>{role}</span>
        {required && <span className={styles.required}>required</span>}
      </div>

      <div className={styles.inputRow}>
        <button
          type="button"
          className={styles.swatch}
          style={{ backgroundColor: isValidColor(value) ? value : "#e5e7eb" }}
          onClick={() => setPickerOpen((prev) => !prev)}
          data-active={pickerOpen ? "true" : undefined}
          aria-label={`Pick ${role} color`}
          aria-expanded={pickerOpen}
        />
        <input
          type="text"
          className={styles.hexInput}
          value={inputValue}
          onChange={handleHexChange}
          onBlur={handleHexBlur}
          placeholder="#000000"
          spellCheck={false}
          autoComplete="off"
          data-invalid={!isInputValid ? "true" : undefined}
          aria-label={`${role} hex value`}
        />
      </div>

      {contrastRatio !== null && (
        <div
          className={`${styles.contrastInfo} ${
            contrastRatio >= 4.5 ? styles.contrastPass : styles.contrastFail
          }`}
        >
          <span>
            Contrast: {contrastRatio.toFixed(1)}:1
            {contrastRatio < 4.5 ? " — below 4.5:1 WCAG AA" : " — WCAG AA"}
          </span>
        </div>
      )}

      {pickerOpen && (
        <div className={styles.pickerDropdown}>
          <OklchPicker value={value} onChange={handlePickerChange} />
        </div>
      )}

      {showShades && isValidColor(value) && isColorRole(role) && (
        <ShadePreview color={value} role={role} />
      )}
    </div>
  );
}
