"use client";

import { useMemo, useCallback, useRef } from "react";
import {
  googleFontsCatalog,
  lookupGoogleFont,
} from "@loworbitstudio/visor-theme-engine";
import type { GoogleFontEntry } from "@loworbitstudio/visor-theme-engine";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxItem,
  ComboboxEmpty,
} from "@/components/ui/combobox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import styles from "./typography-controls.module.css";

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface TypographyControlsProps {
  headingFamily: string;
  headingWeight: number;
  bodyFamily: string;
  bodyWeight: number;
  monoFamily: string;
  onHeadingFamilyChange: (family: string) => void;
  onHeadingWeightChange: (weight: number) => void;
  onBodyFamilyChange: (family: string) => void;
  onBodyWeightChange: (weight: number) => void;
  onMonoFamilyChange: (family: string) => void;
  /** Send postMessage to preview iframe to load a Google Font */
  onLoadFont?: (url: string) => void;
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const WEIGHT_LABELS: Record<number, string> = {
  100: "100 — Thin",
  200: "200 — Extra Light",
  300: "300 — Light",
  400: "400 — Regular",
  500: "500 — Medium",
  600: "600 — Semi Bold",
  700: "700 — Bold",
  800: "800 — Extra Bold",
  900: "900 — Black",
  1000: "1000 — Extra Black",
};

function buildGoogleFontsUrl(family: string, weights: number[]): string {
  const encoded = family.replace(/ /g, "+");
  const wghts = weights.sort((a, b) => a - b).join(";");
  return `https://fonts.googleapis.com/css2?family=${encoded}:wght@${wghts}&display=swap`;
}

/* ─── Font Family Picker ─────────────────────────────────────────────────── */

interface FontFamilyPickerProps {
  label: string;
  value: string;
  category?: "all" | "monospace";
  onChange: (family: string) => void;
  onLoadFont?: (url: string) => void;
}

function FontFamilyPicker({
  label,
  value,
  category = "all",
  onChange,
  onLoadFont,
}: FontFamilyPickerProps) {
  const searchRef = useRef("");

  const filteredCatalog = useMemo(() => {
    if (category === "monospace") {
      return googleFontsCatalog.filter((f) => f.category === "monospace");
    }
    return googleFontsCatalog;
  }, [category]);

  const getFilteredOptions = useCallback(
    (search: string): GoogleFontEntry[] => {
      if (!search) return filteredCatalog;
      const lower = search.toLowerCase();
      return filteredCatalog.filter((f) =>
        f.family.toLowerCase().includes(lower)
      );
    },
    [filteredCatalog]
  );

  const handleSelect = useCallback(
    (_value: string, selectedLabel: string) => {
      const entry = lookupGoogleFont(selectedLabel);
      if (entry) {
        onChange(entry.family);
        const url = buildGoogleFontsUrl(entry.family, entry.weights);
        onLoadFont?.(url);
      }
    },
    [onChange, onLoadFont]
  );

  const handleInputChange = useCallback((inputVal: string) => {
    searchRef.current = inputVal;
  }, []);

  // Determine the current search to filter options
  const options = getFilteredOptions(searchRef.current);

  return (
    <div className={styles.fieldGroup}>
      <span className={styles.fieldLabel}>{label}</span>
      <Combobox
        inputValue={undefined}
        defaultInputValue={value}
        onInputChange={handleInputChange}
        value={value}
        onSelect={handleSelect}
      >
        <ComboboxInput placeholder="Search fonts..." />
        <ComboboxContent aria-label={`${label} options`}>
          {options.length === 0 && <ComboboxEmpty />}
          {options.slice(0, 50).map((font) => (
            <ComboboxItem
              key={font.family}
              value={font.family}
              label={font.family}
            >
              {font.family}
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: "0.7rem",
                  opacity: 0.5,
                }}
              >
                {font.category}
              </span>
            </ComboboxItem>
          ))}
        </ComboboxContent>
      </Combobox>
    </div>
  );
}

/* ─── Weight Picker ──────────────────────────────────────────────────────── */

interface WeightPickerProps {
  family: string;
  value: number;
  onChange: (weight: number) => void;
}

function WeightPicker({ family, value, onChange }: WeightPickerProps) {
  const availableWeights = useMemo(() => {
    const entry = lookupGoogleFont(family);
    return entry?.weights ?? [400];
  }, [family]);

  return (
    <div className={styles.fieldGroup}>
      <span className={styles.fieldLabel}>Weight</span>
      <Select
        value={String(value)}
        onValueChange={(v) => onChange(Number(v))}
      >
        <SelectTrigger size="sm" className={styles.weightSelect}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {availableWeights.map((w) => (
            <SelectItem key={w} value={String(w)}>
              {WEIGHT_LABELS[w] ?? String(w)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/* ─── TypographyControls ─────────────────────────────────────────────────── */

export function TypographyControls({
  headingFamily,
  headingWeight,
  bodyFamily,
  bodyWeight,
  monoFamily,
  onHeadingFamilyChange,
  onHeadingWeightChange,
  onBodyFamilyChange,
  onBodyWeightChange,
  onMonoFamilyChange,
  onLoadFont,
}: TypographyControlsProps) {
  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Typography</h3>

      {/* Heading */}
      <div className={styles.roleSection}>
        <h4 className={styles.roleLabel}>Heading</h4>
        <FontFamilyPicker
          label="Font family"
          value={headingFamily}
          onChange={onHeadingFamilyChange}
          onLoadFont={onLoadFont}
        />
        <WeightPicker
          family={headingFamily}
          value={headingWeight}
          onChange={onHeadingWeightChange}
        />
      </div>

      {/* Body */}
      <div className={styles.roleSection}>
        <h4 className={styles.roleLabel}>Body</h4>
        <FontFamilyPicker
          label="Font family"
          value={bodyFamily}
          onChange={onBodyFamilyChange}
          onLoadFont={onLoadFont}
        />
        <WeightPicker
          family={bodyFamily}
          value={bodyWeight}
          onChange={onBodyWeightChange}
        />
      </div>

      {/* Mono */}
      <div className={styles.roleSection}>
        <h4 className={styles.roleLabel}>Mono</h4>
        <FontFamilyPicker
          label="Font family"
          value={monoFamily}
          category="monospace"
          onChange={onMonoFamilyChange}
          onLoadFont={onLoadFont}
        />
      </div>
    </div>
  );
}
