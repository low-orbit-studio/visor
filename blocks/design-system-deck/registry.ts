import type { DeckRegistry } from "../../lib/deck-registry"
import {
  TitleSlide,
  GrayScaleSlide,
  AccentPaletteSlide,
  SemanticTokensSlide,
  TypeDisplaySlide,
  TypeBodySlide,
  OpacitySlide,
  ThemeArchitectureSlide,
  ElevationSlide,
  RadiusSlide,
  MotionSlide,
  IconsSlide,
  AccessibilitySlide,
  ButtonSpecimenSlide,
  FormSpecimenSlide,
  ComponentShowcaseSlide,
  ClosingSlide,
} from "./slides"

export const designSystemDeckRegistry: DeckRegistry = {
  description: "Visor Design System",
  slides: [
    // Title
    { id: "s-title", title: "Title", section: "_title", component: TitleSlide },

    // Foundation
    { id: "s-gray-scale", title: "Gray Scale", section: "Foundation", component: GrayScaleSlide },
    { id: "s-accent-palette", title: "Accent Palette", section: "Foundation", component: AccentPaletteSlide },
    { id: "s-semantic-tokens", title: "Semantic Tokens", section: "Foundation", component: SemanticTokensSlide },
    { id: "s-type-display", title: "Display Scale", section: "Foundation", component: TypeDisplaySlide },
    { id: "s-type-body", title: "Body & Utility", section: "Foundation", component: TypeBodySlide },
    { id: "s-opacity", title: "Text Opacity", section: "Foundation", component: OpacitySlide },
    { id: "s-theme-architecture", title: "Theme Architecture", section: "Foundation", component: ThemeArchitectureSlide },

    // Visual Language
    { id: "s-elevation", title: "Elevation & Surfaces", section: "Visual Language", component: ElevationSlide },
    { id: "s-radius", title: "Border Radius", section: "Visual Language", component: RadiusSlide },
    { id: "s-motion", title: "Motion", section: "Visual Language", component: MotionSlide },
    { id: "s-icons", title: "Icons", section: "Visual Language", component: IconsSlide },

    // Utility
    { id: "s-accessibility", title: "Accessibility", section: "Utility", component: AccessibilitySlide },

    // Components
    { id: "s-buttons", title: "Buttons", section: "Components", component: ButtonSpecimenSlide },
    { id: "s-forms", title: "Form Controls", section: "Components", component: FormSpecimenSlide },
    { id: "s-components", title: "Component Showcase", section: "Components", component: ComponentShowcaseSlide },

    // Closing
    { id: "s-closing", title: "Closing", section: "_closing", component: ClosingSlide },
  ],
}
