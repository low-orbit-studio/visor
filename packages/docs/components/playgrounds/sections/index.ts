import type { ComponentType } from "react";
import { ColorSignalsSection } from "./color-signals";
import { FeedbackSection } from "./feedback";
import { FormSection } from "./form";
import { NavigationSection } from "./navigation";
import { OverlaySection } from "./overlay";
import { DataDisplaySection } from "./data-display";
import { TypographySection } from "./typography";
import { GeneralSection } from "./general";
import { VisualElementsSection } from "./visual-elements";

export interface Section {
  id: string;
  label: string;
  Component: ComponentType;
}

export const SECTIONS: Section[] = [
  { id: "color-signals", label: "Color Signals", Component: ColorSignalsSection },
  { id: "feedback", label: "Feedback", Component: FeedbackSection },
  { id: "form", label: "Form", Component: FormSection },
  { id: "navigation", label: "Navigation", Component: NavigationSection },
  { id: "overlay", label: "Overlay", Component: OverlaySection },
  { id: "data-display", label: "Data Display", Component: DataDisplaySection },
  { id: "typography", label: "Typography", Component: TypographySection },
  { id: "general", label: "General", Component: GeneralSection },
  { id: "visual-elements", label: "Visual Elements", Component: VisualElementsSection },
];

export const DEFAULT_SECTION_ID = "color-signals";

export function findSection(id: string | null | undefined): Section {
  if (!id) return SECTIONS[0];
  return SECTIONS.find((s) => s.id === id) ?? SECTIONS[0];
}
