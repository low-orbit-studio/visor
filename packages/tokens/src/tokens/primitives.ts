/**
 * Tier 1: Primitive Tokens
 *
 * Raw design values named by what they ARE, not what they DO.
 * These are the foundation of the entire token system.
 */

export const primitiveColors = {
  // Neutral gray scale
  "gray-50": "#f9fafb",
  "gray-100": "#f3f4f6",
  "gray-200": "#e5e7eb",
  "gray-300": "#d1d5db",
  "gray-400": "#9ca3af",
  "gray-500": "#6b7280",
  "gray-600": "#4b5563",
  "gray-700": "#374151",
  "gray-800": "#1f2937",
  "gray-900": "#111827",
  "gray-950": "#030712",

  // Pure values
  white: "#ffffff",
  black: "#000000",

  // Blue accent scale (generic brand-ready)
  "blue-50": "#eff6ff",
  "blue-100": "#dbeafe",
  "blue-200": "#bfdbfe",
  "blue-300": "#93c5fd",
  "blue-400": "#60a5fa",
  "blue-500": "#3b82f6",
  "blue-600": "#2563eb",
  "blue-700": "#1d4ed8",
  "blue-800": "#1e40af",
  "blue-900": "#1e3a8a",

  // Status colors
  "green-50": "#f0fdf4",
  "green-100": "#dcfce7",
  "green-500": "#22c55e",
  "green-600": "#16a34a",
  "green-700": "#15803d",
  "green-900": "#14532d",

  "amber-50": "#fffbeb",
  "amber-100": "#fef3c7",
  "amber-500": "#f59e0b",
  "amber-600": "#d97706",
  "amber-700": "#b45309",
  "amber-900": "#78350f",

  "red-50": "#fef2f2",
  "red-100": "#fee2e2",
  "red-500": "#ef4444",
  "red-600": "#dc2626",
  "red-700": "#b91c1c",
  "red-900": "#7f1d1d",

  "sky-50": "#f0f9ff",
  "sky-100": "#e0f2fe",
  "sky-500": "#0ea5e9",
  "sky-600": "#0284c7",
  "sky-700": "#0369a1",
  "sky-900": "#0c4a6e",
} as const;

// Spacing scale (4px base unit — pixel values, converted to rem in CSS)
export const primitiveSpacing = {
  "0": 0,
  "1": 4,
  "2": 8,
  "3": 12,
  "4": 16,
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

// Shadows
export const primitiveShadows = {
  xs: "0 1px 1px 0 rgba(0, 0, 0, 0.04)",
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
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
