/**
 * Design System Deck — Curated Slide Data
 *
 * Slide-specific data subsets with editorial context.
 * These are intentionally curated for presentation — not exhaustive.
 * For the full token inventory, see the Design System Specimen block.
 */

import type {
  ColorSwatchData,
  SemanticColorData,
  TypeSpecimenData,
  ContrastPairData,
} from "../../design-system-specimen/specimen-data"

// ─── Color: Gray Scale ──────────────────────────────────────────────────────

export const SLIDE_GRAY_SCALE: ColorSwatchData[] = [
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
]

// ─── Color: Accent Palette (representative swatches per scale) ──────────────

export interface AccentScaleData {
  name: string
  description: string
  swatches: ColorSwatchData[]
}

export const SLIDE_ACCENT_SCALES: AccentScaleData[] = [
  {
    name: "Blue",
    description: "Primary interactive color — buttons, links, focus rings",
    swatches: [
      { token: "--color-blue-100", hex: "#dbeafe", name: "100" },
      { token: "--color-blue-500", hex: "#3b82f6", name: "500", lightText: true },
      { token: "--color-blue-700", hex: "#1d4ed8", name: "700", lightText: true },
    ],
  },
  {
    name: "Green",
    description: "Success states, confirmations, positive indicators",
    swatches: [
      { token: "--color-green-100", hex: "#dcfce7", name: "100" },
      { token: "--color-green-500", hex: "#22c55e", name: "500", lightText: true },
      { token: "--color-green-700", hex: "#15803d", name: "700", lightText: true },
    ],
  },
  {
    name: "Amber",
    description: "Warnings, caution states, attention indicators",
    swatches: [
      { token: "--color-amber-100", hex: "#fef3c7", name: "100" },
      { token: "--color-amber-500", hex: "#f59e0b", name: "500" },
      { token: "--color-amber-700", hex: "#b45309", name: "700", lightText: true },
    ],
  },
  {
    name: "Red",
    description: "Errors, destructive actions, critical alerts",
    swatches: [
      { token: "--color-red-100", hex: "#fee2e2", name: "100" },
      { token: "--color-red-500", hex: "#ef4444", name: "500", lightText: true },
      { token: "--color-red-700", hex: "#b91c1c", name: "700", lightText: true },
    ],
  },
  {
    name: "Sky",
    description: "Informational states, secondary accents",
    swatches: [
      { token: "--color-sky-100", hex: "#e0f2fe", name: "100" },
      { token: "--color-sky-500", hex: "#0ea5e9", name: "500", lightText: true },
      { token: "--color-sky-700", hex: "#0369a1", name: "700", lightText: true },
    ],
  },
]

// ─── Color: Semantic Tokens ─────────────────────────────────────────────────

export const SLIDE_SEMANTIC_COLORS: SemanticColorData[] = [
  // Text — most important
  { token: "--text-primary", label: "text-primary", category: "Text" },
  { token: "--text-secondary", label: "text-secondary", category: "Text" },
  { token: "--text-tertiary", label: "text-tertiary", category: "Text" },
  { token: "--text-link", label: "text-link", category: "Text" },
  // Surface — key layers
  { token: "--surface-page", label: "surface-page", category: "Surface" },
  { token: "--surface-card", label: "surface-card", category: "Surface" },
  { token: "--surface-subtle", label: "surface-subtle", category: "Surface" },
  { token: "--surface-overlay", label: "surface-overlay", category: "Surface" },
  // Border — essentials
  { token: "--border-default", label: "border-default", category: "Border" },
  { token: "--border-muted", label: "border-muted", category: "Border" },
  { token: "--border-focus", label: "border-focus", category: "Border" },
]

// ─── Typography: Display Scale ──────────────────────────────────────────────

export const SLIDE_TYPE_DISPLAY: TypeSpecimenData[] = [
  { token: "--font-size-4xl", label: "4xl", sizePx: 36, sampleText: "Display text" },
  { token: "--font-size-3xl", label: "3xl", sizePx: 30, sampleText: "Page heading" },
  { token: "--font-size-2xl", label: "2xl", sizePx: 24, sampleText: "Section heading" },
  { token: "--font-size-xl", label: "xl", sizePx: 20, sampleText: "Subsection heading" },
]

// ─── Typography: Body & Utility Scale ───────────────────────────────────────

export const SLIDE_TYPE_BODY: TypeSpecimenData[] = [
  { token: "--font-size-lg", label: "lg", sizePx: 18, sampleText: "Large body text for emphasis and introductions" },
  { token: "--font-size-base", label: "base", sizePx: 16, sampleText: "Default body text for reading — the workhorse of the system" },
  { token: "--font-size-sm", label: "sm", sizePx: 14, sampleText: "Small text for labels, captions, and supporting information" },
  { token: "--font-size-xs", label: "xs", sizePx: 12, sampleText: "Fine print, metadata, and legal text" },
]

// ─── Accessibility: Key Pairs ───────────────────────────────────────────────

export const SLIDE_CONTRAST_PAIRS: ContrastPairData[] = [
  { fgToken: "--text-primary", bgToken: "--surface-page", fgLabel: "text-primary", bgLabel: "surface-page", ratio: 15.4, wcagAA: true, wcagAAA: true },
  { fgToken: "--text-secondary", bgToken: "--surface-page", fgLabel: "text-secondary", bgLabel: "surface-page", ratio: 5.74, wcagAA: true, wcagAAA: false },
  { fgToken: "--text-tertiary", bgToken: "--surface-page", fgLabel: "text-tertiary", bgLabel: "surface-page", ratio: 3.94, wcagAA: false, wcagAAA: false },
  { fgToken: "--text-link", bgToken: "--surface-page", fgLabel: "text-link", bgLabel: "surface-page", ratio: 4.62, wcagAA: true, wcagAAA: false },
  { fgToken: "--text-inverse", bgToken: "--surface-overlay", fgLabel: "text-inverse", bgLabel: "surface-overlay", ratio: 14.7, wcagAA: true, wcagAAA: true },
  { fgToken: "--text-error", bgToken: "--surface-page", fgLabel: "text-error", bgLabel: "surface-page", ratio: 5.25, wcagAA: true, wcagAAA: false },
]
