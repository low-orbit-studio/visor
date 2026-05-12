"use client";

import * as React from "react";
import { Separator } from "../../../components/ui/separator/separator";
import {
  ColorPaletteSection,
  TypographySection,
} from "../../../blocks/design-system-specimen/token-specimens";
import {
  ButtonSpecimenSection,
  FormSpecimenSection,
} from "../../../blocks/design-system-specimen/component-specimens";
import { AccessibilitySection } from "../../../blocks/design-system-specimen/utility-specimens";
import {
  THEME_COLOR_SCALES,
  STATUS_COLOR_SCALES,
  SEMANTIC_COLORS,
  FONT_FAMILIES,
  TYPE_SPECIMENS,
  CONTRAST_PAIRS,
  deriveFontFamiliesFromTypography,
  type FontFamilyData,
} from "../../../blocks/design-system-specimen/specimen-data";
import { PRIVATE_THEMES } from "@/lib/private-themes";
import styles from "./comparator-specimen.module.css";

const THEME_CLASS_PATTERN = /(^|\s)([\w-]+)-theme(?=\s|$)/;

function useActiveThemeSlug(): string | null {
  const [slug, setSlug] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const body = document.body;
    function read() {
      const match = body.className.match(THEME_CLASS_PATTERN);
      setSlug(match ? match[2] : null);
    }
    read();
    const handler = () => read();
    document.addEventListener("visor-theme-change", handler);
    const obs = new MutationObserver(read);
    obs.observe(body, { attributes: true, attributeFilter: ["class"] });
    return () => {
      document.removeEventListener("visor-theme-change", handler);
      obs.disconnect();
    };
  }, []);
  return slug;
}

export function ComparatorSpecimen() {
  const activeSlug = useActiveThemeSlug();
  const fontFamilies = React.useMemo<FontFamilyData[]>(() => {
    if (!activeSlug) return FONT_FAMILIES;
    const entry = PRIVATE_THEMES.find((t) => t.slug === activeSlug);
    return deriveFontFamiliesFromTypography(entry?.typography, FONT_FAMILIES);
  }, [activeSlug]);

  return (
    <div className={styles.root}>
      <ColorPaletteSection themeScales={THEME_COLOR_SCALES} statusScales={STATUS_COLOR_SCALES} semanticColors={SEMANTIC_COLORS} />
      <Separator />
      <TypographySection fontFamilies={fontFamilies} specimens={TYPE_SPECIMENS} />
      <Separator />
      <ButtonSpecimenSection />
      <Separator />
      <FormSpecimenSection />
      <Separator />
      <AccessibilitySection pairs={CONTRAST_PAIRS} />
    </div>
  );
}
