/**
 * Design System Specimen — Data
 *
 * Typed data arrays for all specimen sections.
 * Values sourced from packages/tokens/src/tokens/primitives.ts and semantic.ts.
 */

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface ColorSwatchData {
  token: string
  hex: string
  name: string
  lightText?: boolean
  /** When true, ColorSwatch reads the live computed value instead of displaying the fallback hex */
  dynamic?: boolean
}

export interface ColorScaleData {
  name: string
  swatches: ColorSwatchData[]
  /** When set, renders a featured brand swatch above the scale reading this token */
  brandToken?: string
}

export interface SemanticColorData {
  token: string
  label: string
  category: string
}

export interface TypeSpecimenData {
  token: string
  label: string
  sizePx: number
  sampleText: string
}

export interface SpacingStepData {
  token: string
  name: string
  px: number
  rem: string
}

export interface ShadowLevelData {
  token: string
  name: string
  value: string
}

export interface SurfaceData {
  token: string
  name: string
  lightText?: boolean
}

export interface RadiusStepData {
  token: string
  name: string
  px: number
}

export interface MotionDurationData {
  token: string
  name: string
  ms: number
}

export interface EasingData {
  token: string
  name: string
  value: string
}

export interface ContrastPairData {
  fgToken: string
  bgToken: string
  fgLabel: string
  bgLabel: string
  ratio: number
  wcagAA: boolean
  wcagAAA: boolean
}

export interface IconSpecimenData {
  name: string
  phosphorName: string
  usage: string
}

export interface FontWeightData {
  label: string
  value: number
}

export interface FontFamilyData {
  /** CSS custom property token (e.g. "--font-heading") */
  token: string
  /** Display role (e.g. "Heading & Body", "Monospace") */
  role: string
  /** Font family display name — omit to read dynamically from the CSS token */
  familyName?: string
  /** Available weights */
  weights: FontWeightData[]
}

// ─── Color Scales ────────────────────────────────────────────────────────────

export interface StatusColorScaleData extends ColorScaleData {
  /** Semantic role label (e.g. "Success", "Warning") */
  role: string
}

export const THEME_COLOR_SCALES: ColorScaleData[] = [
  {
    name: "Primary",
    brandToken: "--interactive-primary-bg",
    swatches: [
      { token: "--color-primary-50", hex: "#e9f1f6", name: "50", dynamic: true },
      { token: "--color-primary-100", hex: "#cfdfe7", name: "100", dynamic: true },
      { token: "--color-primary-200", hex: "#adc8d5", name: "200", dynamic: true },
      { token: "--color-primary-300", hex: "#89aec0", name: "300", dynamic: true },
      { token: "--color-primary-400", hex: "#6093aa", name: "400", dynamic: true },
      { token: "--color-primary-500", hex: "#397a96", name: "500", lightText: true, dynamic: true },
      { token: "--color-primary-600", hex: "#2a647c", name: "600", lightText: true, dynamic: true },
      { token: "--color-primary-700", hex: "#1a4e64", name: "700", lightText: true, dynamic: true },
      { token: "--color-primary-800", hex: "#0b3a4c", name: "800", lightText: true, dynamic: true },
      { token: "--color-primary-900", hex: "#002938", name: "900", lightText: true, dynamic: true },
      { token: "--color-primary-950", hex: "#001c29", name: "950", lightText: true, dynamic: true },
    ],
  },
  {
    name: "Neutral",
    swatches: [
      { token: "--color-gray-50", hex: "#f9fafb", name: "50" },
      { token: "--color-gray-100", hex: "#f3f4f6", name: "100" },
      { token: "--color-gray-200", hex: "#e5e7eb", name: "200" },
      { token: "--color-gray-300", hex: "#d1d5db", name: "300" },
      { token: "--color-gray-400", hex: "#9ca3af", name: "400" },
      { token: "--color-gray-500", hex: "#6b7280", name: "500", lightText: true },
      { token: "--color-gray-600", hex: "#4b5563", name: "600", lightText: true },
      { token: "--color-gray-700", hex: "#374151", name: "700", lightText: true },
      { token: "--color-gray-800", hex: "#1f2937", name: "800", lightText: true },
      { token: "--color-gray-900", hex: "#111827", name: "900", lightText: true },
      { token: "--color-gray-950", hex: "#030712", name: "950", lightText: true },
    ],
  },
]

export const STATUS_COLOR_SCALES: StatusColorScaleData[] = [
  {
    name: "Success",
    role: "Success",
    swatches: [
      { token: "--color-green-50", hex: "#f0fdf4", name: "50" },
      { token: "--color-green-100", hex: "#dcfce7", name: "100" },
      { token: "--color-green-500", hex: "#22c55e", name: "500", lightText: true },
      { token: "--color-green-600", hex: "#16a34a", name: "600", lightText: true },
      { token: "--color-green-700", hex: "#15803d", name: "700", lightText: true },
      { token: "--color-green-900", hex: "#14532d", name: "900", lightText: true },
    ],
  },
  {
    name: "Warning",
    role: "Warning",
    swatches: [
      { token: "--color-amber-50", hex: "#fffbeb", name: "50" },
      { token: "--color-amber-100", hex: "#fef3c7", name: "100" },
      { token: "--color-amber-500", hex: "#f59e0b", name: "500" },
      { token: "--color-amber-600", hex: "#d97706", name: "600", lightText: true },
      { token: "--color-amber-700", hex: "#b45309", name: "700", lightText: true },
      { token: "--color-amber-900", hex: "#78350f", name: "900", lightText: true },
    ],
  },
  {
    name: "Error",
    role: "Error",
    swatches: [
      { token: "--color-red-50", hex: "#fef2f2", name: "50" },
      { token: "--color-red-100", hex: "#fee2e2", name: "100" },
      { token: "--color-red-500", hex: "#ef4444", name: "500", lightText: true },
      { token: "--color-red-600", hex: "#dc2626", name: "600", lightText: true },
      { token: "--color-red-700", hex: "#b91c1c", name: "700", lightText: true },
      { token: "--color-red-900", hex: "#7f1d1d", name: "900", lightText: true },
    ],
  },
  {
    name: "Info",
    role: "Info",
    swatches: [
      { token: "--color-sky-50", hex: "#f0f9ff", name: "50" },
      { token: "--color-sky-100", hex: "#e0f2fe", name: "100" },
      { token: "--color-sky-500", hex: "#0ea5e9", name: "500", lightText: true },
      { token: "--color-sky-600", hex: "#0284c7", name: "600", lightText: true },
      { token: "--color-sky-700", hex: "#0369a1", name: "700", lightText: true },
      { token: "--color-sky-900", hex: "#0c4a6e", name: "900", lightText: true },
    ],
  },
]

export const SEMANTIC_COLORS: SemanticColorData[] = [
  // Text
  { token: "--text-primary", label: "text-primary", category: "Text" },
  { token: "--text-secondary", label: "text-secondary", category: "Text" },
  { token: "--text-tertiary", label: "text-tertiary", category: "Text" },
  { token: "--text-disabled", label: "text-disabled", category: "Text" },
  { token: "--text-inverse", label: "text-inverse", category: "Text" },
  { token: "--text-link", label: "text-link", category: "Text" },
  { token: "--text-success", label: "text-success", category: "Text" },
  { token: "--text-warning", label: "text-warning", category: "Text" },
  { token: "--text-error", label: "text-error", category: "Text" },
  { token: "--text-info", label: "text-info", category: "Text" },
  // Surface
  { token: "--surface-page", label: "surface-page", category: "Surface" },
  { token: "--surface-card", label: "surface-card", category: "Surface" },
  { token: "--surface-subtle", label: "surface-subtle", category: "Surface" },
  { token: "--surface-muted", label: "surface-muted", category: "Surface" },
  { token: "--surface-overlay", label: "surface-overlay", category: "Surface" },
  { token: "--surface-accent-subtle", label: "surface-accent-subtle", category: "Surface" },
  { token: "--surface-accent-default", label: "surface-accent-default", category: "Surface" },
  { token: "--surface-accent-strong", label: "surface-accent-strong", category: "Surface" },
  // Border
  { token: "--border-default", label: "border-default", category: "Border" },
  { token: "--border-muted", label: "border-muted", category: "Border" },
  { token: "--border-strong", label: "border-strong", category: "Border" },
  { token: "--border-focus", label: "border-focus", category: "Border" },
]

// ─── Typography ──────────────────────────────────────────────────────────────

export const FONT_FAMILIES: FontFamilyData[] = [
  {
    token: "--font-heading",
    role: "Heading & Body",
    weights: [
      { label: "Regular", value: 400 },
      { label: "Medium", value: 500 },
      { label: "Semibold", value: 600 },
      { label: "Bold", value: 700 },
    ],
  },
  {
    token: "--font-mono",
    role: "Monospace",
    weights: [
      { label: "Regular", value: 400 },
      { label: "Medium", value: 500 },
      { label: "Bold", value: 700 },
    ],
  },
]

export const TYPE_SPECIMENS: TypeSpecimenData[] = [
  { token: "--font-size-4xl", label: "4xl", sizePx: 36, sampleText: "Display text" },
  { token: "--font-size-3xl", label: "3xl", sizePx: 30, sampleText: "Page heading" },
  { token: "--font-size-2xl", label: "2xl", sizePx: 24, sampleText: "Section heading" },
  { token: "--font-size-xl", label: "xl", sizePx: 20, sampleText: "Subsection heading" },
  { token: "--font-size-lg", label: "lg", sizePx: 18, sampleText: "Large body text" },
  { token: "--font-size-base", label: "base", sizePx: 16, sampleText: "Default body text for reading" },
  { token: "--font-size-sm", label: "sm", sizePx: 14, sampleText: "Small text, labels, and captions" },
  { token: "--font-size-xs", label: "xs", sizePx: 12, sampleText: "Fine print and metadata" },
]

// ─── Spacing ─────────────────────────────────────────────────────────────────

export const SPACING_STEPS: SpacingStepData[] = [
  { token: "--spacing-0", name: "0", px: 0, rem: "0" },
  { token: "--spacing-1", name: "1", px: 4, rem: "0.25rem" },
  { token: "--spacing-2", name: "2", px: 8, rem: "0.5rem" },
  { token: "--spacing-3", name: "3", px: 12, rem: "0.75rem" },
  { token: "--spacing-4", name: "4", px: 16, rem: "1rem" },
  { token: "--spacing-5", name: "5", px: 20, rem: "1.25rem" },
  { token: "--spacing-6", name: "6", px: 24, rem: "1.5rem" },
  { token: "--spacing-8", name: "8", px: 32, rem: "2rem" },
  { token: "--spacing-10", name: "10", px: 40, rem: "2.5rem" },
  { token: "--spacing-12", name: "12", px: 48, rem: "3rem" },
  { token: "--spacing-16", name: "16", px: 64, rem: "4rem" },
  { token: "--spacing-20", name: "20", px: 80, rem: "5rem" },
  { token: "--spacing-24", name: "24", px: 96, rem: "6rem" },
]

// ─── Shadows ─────────────────────────────────────────────────────────────────

export const SHADOW_LEVELS: ShadowLevelData[] = [
  { token: "--shadow-xs", name: "xs", value: "0 1px 1px 0 rgba(0, 0, 0, 0.04)" },
  { token: "--shadow-sm", name: "sm", value: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" },
  { token: "--shadow-md", name: "md", value: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)" },
  { token: "--shadow-lg", name: "lg", value: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)" },
  { token: "--shadow-xl", name: "xl", value: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" },
]

// ─── Surfaces ────────────────────────────────────────────────────────────────

export const SURFACES: SurfaceData[] = [
  { token: "--surface-page", name: "Page" },
  { token: "--surface-card", name: "Card" },
  { token: "--surface-subtle", name: "Subtle" },
  { token: "--surface-muted", name: "Muted" },
  { token: "--surface-overlay", name: "Overlay", lightText: true },
  { token: "--surface-accent-subtle", name: "Accent Subtle" },
  { token: "--surface-accent-default", name: "Accent Default", lightText: true },
  { token: "--surface-accent-strong", name: "Accent Strong", lightText: true },
]

// ─── Border Radius ───────────────────────────────────────────────────────────

export const RADIUS_STEPS: RadiusStepData[] = [
  { token: "--radius-none", name: "none", px: 0 },
  { token: "--radius-sm", name: "sm", px: 2 },
  { token: "--radius-md", name: "md", px: 4 },
  { token: "--radius-lg", name: "lg", px: 8 },
  { token: "--radius-xl", name: "xl", px: 12 },
  { token: "--radius-2xl", name: "2xl", px: 16 },
  { token: "--radius-3xl", name: "3xl", px: 24 },
  { token: "--radius-full", name: "full", px: 9999 },
]

// ─── Motion ──────────────────────────────────────────────────────────────────

export const MOTION_DURATIONS: MotionDurationData[] = [
  { token: "--motion-duration-100", name: "100", ms: 100 },
  { token: "--motion-duration-150", name: "150", ms: 150 },
  { token: "--motion-duration-200", name: "200", ms: 200 },
  { token: "--motion-duration-300", name: "300", ms: 300 },
  { token: "--motion-duration-500", name: "500", ms: 500 },
  { token: "--motion-duration-800", name: "800", ms: 800 },
]

export const EASINGS: EasingData[] = [
  { token: "--motion-easing-linear", name: "linear", value: "linear" },
  { token: "--motion-easing-ease-in", name: "ease-in", value: "cubic-bezier(0.4, 0, 1, 1)" },
  { token: "--motion-easing-ease-out", name: "ease-out", value: "cubic-bezier(0, 0, 0.2, 1)" },
  { token: "--motion-easing-ease-in-out", name: "ease-in-out", value: "cubic-bezier(0.4, 0, 0.2, 1)" },
  { token: "--motion-easing-spring", name: "spring", value: "cubic-bezier(0.34, 1.56, 0.64, 1)" },
]

// ─── Accessibility ───────────────────────────────────────────────────────────

export const CONTRAST_PAIRS: ContrastPairData[] = [
  { fgToken: "--text-primary", bgToken: "--surface-page", fgLabel: "text-primary", bgLabel: "surface-page", ratio: 15.4, wcagAA: true, wcagAAA: true },
  { fgToken: "--text-primary", bgToken: "--surface-card", fgLabel: "text-primary", bgLabel: "surface-card", ratio: 15.4, wcagAA: true, wcagAAA: true },
  { fgToken: "--text-secondary", bgToken: "--surface-page", fgLabel: "text-secondary", bgLabel: "surface-page", ratio: 5.74, wcagAA: true, wcagAAA: false },
  { fgToken: "--text-tertiary", bgToken: "--surface-page", fgLabel: "text-tertiary", bgLabel: "surface-page", ratio: 3.94, wcagAA: false, wcagAAA: false },
  { fgToken: "--text-link", bgToken: "--surface-page", fgLabel: "text-link", bgLabel: "surface-page", ratio: 4.62, wcagAA: true, wcagAAA: false },
  { fgToken: "--text-inverse", bgToken: "--surface-overlay", fgLabel: "text-inverse", bgLabel: "surface-overlay", ratio: 14.7, wcagAA: true, wcagAAA: true },
  { fgToken: "--text-success", bgToken: "--surface-page", fgLabel: "text-success", bgLabel: "surface-page", ratio: 4.49, wcagAA: true, wcagAAA: false },
  { fgToken: "--text-error", bgToken: "--surface-page", fgLabel: "text-error", bgLabel: "surface-page", ratio: 5.25, wcagAA: true, wcagAAA: false },
  { fgToken: "--text-warning", bgToken: "--surface-page", fgLabel: "text-warning", bgLabel: "surface-page", ratio: 4.01, wcagAA: true, wcagAAA: false },
  { fgToken: "--text-primary", bgToken: "--surface-subtle", fgLabel: "text-primary", bgLabel: "surface-subtle", ratio: 14.9, wcagAA: true, wcagAAA: true },
  { fgToken: "--text-primary", bgToken: "--surface-muted", fgLabel: "text-primary", bgLabel: "surface-muted", ratio: 13.8, wcagAA: true, wcagAAA: true },
]

// ─── Icons ───────────────────────────────────────────────────────────────────

export const ICON_SPECIMENS: IconSpecimenData[] = [
  { name: "House", phosphorName: "House", usage: "Home / dashboard" },
  { name: "MagnifyingGlass", phosphorName: "MagnifyingGlass", usage: "Search" },
  { name: "Gear", phosphorName: "Gear", usage: "Settings" },
  { name: "User", phosphorName: "User", usage: "Profile / account" },
  { name: "Bell", phosphorName: "Bell", usage: "Notifications" },
  { name: "EnvelopeSimple", phosphorName: "EnvelopeSimple", usage: "Messages / email" },
  { name: "Plus", phosphorName: "Plus", usage: "Add / create" },
  { name: "X", phosphorName: "X", usage: "Close / dismiss" },
  { name: "Check", phosphorName: "Check", usage: "Confirm / success" },
  { name: "Warning", phosphorName: "Warning", usage: "Warning / caution" },
  { name: "Info", phosphorName: "Info", usage: "Information" },
  { name: "ArrowRight", phosphorName: "ArrowRight", usage: "Navigate / next" },
  { name: "CaretDown", phosphorName: "CaretDown", usage: "Expand / dropdown" },
  { name: "DotsThree", phosphorName: "DotsThree", usage: "More actions" },
  { name: "PencilSimple", phosphorName: "PencilSimple", usage: "Edit" },
  { name: "Trash", phosphorName: "Trash", usage: "Delete" },
]

// ─── Icon sizes for the size scale demo ──────────────────────────────────────

export const ICON_SIZES = [16, 20, 24, 32] as const
