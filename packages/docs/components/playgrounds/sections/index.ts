import type { ComponentType } from "react";
import { ShowcaseSection } from "./showcase";
import { BrandSection } from "./brand";
import { LogoGuidelinesSection } from "./logo-guidelines";
import { StrategySection } from "./strategy";
import { PillarsSection } from "./pillars";
import { VerbalSection } from "./verbal";
import { ColorSignalsSection } from "./color-signals";
import { FeedbackSection } from "./feedback";
import { FormSection } from "./form";
import { NavigationSection } from "./navigation";
import { PopoversDialogsSection } from "./popovers-dialogs";
import { AlphaOverlaysSection } from "./alpha-overlays";
import { DataDisplaySection } from "./data-display";
import { TypographySection } from "./typography";
import { GeneralSection } from "./general";
import { MotionSection } from "./motion";
import { VisualElementsSection } from "./visual-elements";

export interface Section {
  id: string;
  label: string;
  Component: ComponentType;
}

export const SECTIONS: Section[] = [
  { id: "showcase", label: "Showcase", Component: ShowcaseSection },
  // Brand Workbench cluster (VI-506+): Brand assets, logo guidelines, then strategy/verbal surfaces.
  { id: "brand", label: "Brand", Component: BrandSection },
  { id: "logo-guidelines", label: "Logo Guidelines", Component: LogoGuidelinesSection },
  { id: "strategy", label: "Strategy", Component: StrategySection },
  { id: "pillars", label: "Pillars", Component: PillarsSection },
  { id: "verbal", label: "Verbal", Component: VerbalSection },
  { id: "color-signals", label: "Color Signals", Component: ColorSignalsSection },
  { id: "feedback", label: "Feedback", Component: FeedbackSection },
  { id: "form", label: "Form", Component: FormSection },
  { id: "navigation", label: "Navigation", Component: NavigationSection },
  { id: "popovers-dialogs", label: "Popovers & Dialogs", Component: PopoversDialogsSection },
  { id: "alpha-overlays", label: "Alpha Overlays", Component: AlphaOverlaysSection },
  { id: "data-display", label: "Data Display", Component: DataDisplaySection },
  { id: "typography", label: "Typography", Component: TypographySection },
  { id: "general", label: "General", Component: GeneralSection },
  { id: "motion", label: "Motion", Component: MotionSection },
  { id: "visual-elements", label: "Visual Elements", Component: VisualElementsSection },
];

export const DEFAULT_SECTION_ID = "color-signals";

export function findSection(id: string | null | undefined): Section {
  if (!id) return findSection(DEFAULT_SECTION_ID);
  return SECTIONS.find((s) => s.id === id) ?? SECTIONS.find((s) => s.id === DEFAULT_SECTION_ID) ?? SECTIONS[0];
}
