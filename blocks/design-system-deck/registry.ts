import type { DeckRegistry } from "../../lib/deck-registry"
import {
  ColorPaletteSlide,
  TypographySlide,
  SpacingSlide,
  ElevationSlide,
  RadiusSlide,
  MotionSlide,
  OpacitySlide,
  IconsSlide,
  AccessibilitySlide,
  ButtonSpecimenSlide,
  FormSpecimenSlide,
  ComponentShowcaseSlide,
} from "./slides"

export const designSystemDeckRegistry: DeckRegistry = {
  description: "Visor Design System",
  slides: [
    // Foundation
    { id: "s-color-palette", title: "Color Palette", section: "Foundation", component: ColorPaletteSlide },
    { id: "s-typography", title: "Typography", section: "Foundation", component: TypographySlide },
    { id: "s-spacing", title: "Spacing", section: "Foundation", component: SpacingSlide },

    // Visual Language
    { id: "s-elevation", title: "Elevation & Surfaces", section: "Visual Language", component: ElevationSlide },
    { id: "s-radius", title: "Border Radius", section: "Visual Language", component: RadiusSlide },
    { id: "s-motion", title: "Motion", section: "Visual Language", component: MotionSlide },
    { id: "s-opacity", title: "Text Opacity", section: "Visual Language", component: OpacitySlide },

    // Utility
    { id: "s-icons", title: "Icons", section: "Utility", component: IconsSlide },
    { id: "s-accessibility", title: "Accessibility", section: "Utility", component: AccessibilitySlide },

    // Components
    { id: "s-buttons", title: "Buttons", section: "Components", component: ButtonSpecimenSlide },
    { id: "s-forms", title: "Form Controls", section: "Components", component: FormSpecimenSlide },
    { id: "s-components", title: "Component Showcase", section: "Components", component: ComponentShowcaseSlide },
  ],
}
