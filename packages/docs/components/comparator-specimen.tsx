"use client";

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
} from "../../../blocks/design-system-specimen/specimen-data";
import styles from "./comparator-specimen.module.css";

export function ComparatorSpecimen() {
  return (
    <div className={styles.root}>
      <ColorPaletteSection themeScales={THEME_COLOR_SCALES} statusScales={STATUS_COLOR_SCALES} semanticColors={SEMANTIC_COLORS} />
      <Separator />
      <TypographySection fontFamilies={FONT_FAMILIES} specimens={TYPE_SPECIMENS} />
      <Separator />
      <ButtonSpecimenSection />
      <Separator />
      <FormSpecimenSection />
      <Separator />
      <AccessibilitySection pairs={CONTRAST_PAIRS} />
    </div>
  );
}
