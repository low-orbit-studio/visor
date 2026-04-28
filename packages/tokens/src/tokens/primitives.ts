/**
 * Tier 1: Primitive Tokens
 *
 * Raw design values named by what they ARE, not what they DO.
 * These are the foundation of the entire token system.
 */

export const primitiveColors = {
  // Neutral scale
  "neutral-50": "#f9fafb",
  "neutral-100": "#f3f4f6",
  "neutral-200": "#e5e7eb",
  "neutral-300": "#d1d5db",
  "neutral-400": "#9ca3af",
  "neutral-500": "#6b7280",
  "neutral-600": "#4b5563",
  "neutral-700": "#374151",
  "neutral-800": "#1f2937",
  "neutral-900": "#111827",
  "neutral-950": "#030712",

  // Pure values
  white: "#ffffff",
  black: "#000000",

  // Primary scale (generic brand-ready)
  "primary-50": "#eff6ff",
  "primary-100": "#dbeafe",
  "primary-200": "#bfdbfe",
  "primary-300": "#93c5fd",
  "primary-400": "#60a5fa",
  "primary-500": "#3b82f6",
  "primary-600": "#2563eb",
  "primary-700": "#1d4ed8",
  "primary-800": "#1e40af",
  "primary-900": "#1e3a8a",

  // Status colors
  "success-50": "#f0fdf4",
  "success-100": "#dcfce7",
  "success-500": "#22c55e",
  "success-600": "#16a34a",
  "success-700": "#15803d",
  "success-900": "#14532d",

  "warning-50": "#fffbeb",
  "warning-100": "#fef3c7",
  "warning-500": "#f59e0b",
  "warning-600": "#d97706",
  "warning-700": "#b45309",
  "warning-900": "#78350f",

  "error-50": "#fef2f2",
  "error-100": "#fee2e2",
  "error-500": "#ef4444",
  "error-600": "#dc2626",
  "error-700": "#b91c1c",
  "error-900": "#7f1d1d",

  "info-50": "#f0f9ff",
  "info-100": "#e0f2fe",
  "info-500": "#0ea5e9",
  "info-600": "#0284c7",
  "info-700": "#0369a1",
  "info-900": "#0c4a6e",
} as const;

// Spacing scale (4px base unit — pixel values, converted to rem in CSS)
export const primitiveSpacing = {
  "0": 0,
  "1": 4,
  "2": 8,
  "3": 12,
  "3_5": 14,
  "4": 16,
  "4_5": 18,
  "5": 20,
  "6": 24,
  "8": 32,
  "10": 40,
  "12": 48,
  "16": 64,
  "20": 80,
  "24": 96,
} as const;

// Border radius (pixel values, converted to rem in CSS)
export const primitiveRadius = {
  none: 0,
  sm: 2,
  md: 4,
  lg: 8,
  xl: 12,
  "2xl": 16,
  "3xl": 24,
  full: 9999,
} as const;

// Border widths (pixel values)
export const primitiveBorderWidths = {
  "1": 1,
  "2": 2,
  "3": 3,
  "4": 4,
} as const;

// Stroke widths — semantic 4-slot scale for borders, outlines, dividers,
// and progress-indicator strokes. Slot names match the existing semantic
// scales (xs/sm/md/lg/xl on shadows, sm/md/lg/xl/pill on radius) — no
// numeric extensions in the system. Values cover every current Visor
// hardcoded site without rounding (VisorButton 2 → medium,
// VisorLoadingIndicator 2.5 → thick).
export const primitiveStrokeWidths = {
  thin: 1,
  regular: 1.5,
  medium: 2,
  thick: 2.5,
} as const;

// Font sizes (pixel values, converted to rem in CSS)
export const primitiveFontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
  "4xl": 36,
} as const;

// Font weights
export const primitiveFontWeights = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

// Line heights
export const primitiveLineHeights = {
  none: 1,
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,
} as const;

// Shadows (light mode)
export const primitiveShadows = {
  xs: "inset 0 1px 2px 0 rgba(0, 0, 0, 0.06)", // tight inward — input focus insets
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
} as const;

// Shadows (dark mode) — higher alpha needed to read on dark surfaces
export const primitiveShadowsDark = {
  xs: "inset 0 1px 2px 0 rgba(0, 0, 0, 0.15)",
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.25)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.35), 0 2px 4px -2px rgba(0, 0, 0, 0.3)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.35)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.45), 0 8px 10px -6px rgba(0, 0, 0, 0.4)",
} as const;

// Z-index scale
export const primitiveZIndex = {
  base: 0,
  raised: 1,
  dropdown: 1000,
  sticky: 1100,
  modal: 1300,
  popover: 1400,
  toast: 1500,
} as const;

// Font families
export const primitiveFontFamilies = {
  sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  mono: '"SF Mono", "Fira Code", "Fira Mono", "Roboto Mono", monospace',
} as const;

// Overlay
export const primitiveOverlay = {
  bg: "rgba(0, 0, 0, 0.5)",
} as const;

// Focus ring
export const primitiveFocusRing = {
  width: "2px",
  offset: "2px",
} as const;

// Motion durations (milliseconds)
export const primitiveMotionDurations = {
  "100": "100ms",
  "150": "150ms",
  "200": "200ms",
  "300": "300ms",
  "500": "500ms",
  "800": "800ms",
} as const;

// Motion easing curves
export const primitiveMotionEasings = {
  linear: "linear",
  "ease-in": "cubic-bezier(0.4, 0, 1, 1)",
  "ease-out": "cubic-bezier(0, 0, 0.2, 1)",
  "ease-in-out": "cubic-bezier(0.4, 0, 0.2, 1)",
  spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
} as const;
