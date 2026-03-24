/**
 * @loworbitstudio/visor-core — Type Exports
 *
 * TypeScript types and constants for all token names.
 * Provides autocomplete when referencing token names programmatically.
 *
 * Usage:
 *   import { TOKEN_TEXT_PRIMARY } from "@loworbitstudio/visor-core/types"
 *   element.style.setProperty(TOKEN_TEXT_PRIMARY, "#000")
 */

// ============================================================
// Primitive Token Constants
// ============================================================

// Colors
export const TOKEN_COLOR_GRAY_50 = "--color-gray-50" as const;
export const TOKEN_COLOR_GRAY_100 = "--color-gray-100" as const;
export const TOKEN_COLOR_GRAY_200 = "--color-gray-200" as const;
export const TOKEN_COLOR_GRAY_300 = "--color-gray-300" as const;
export const TOKEN_COLOR_GRAY_400 = "--color-gray-400" as const;
export const TOKEN_COLOR_GRAY_500 = "--color-gray-500" as const;
export const TOKEN_COLOR_GRAY_600 = "--color-gray-600" as const;
export const TOKEN_COLOR_GRAY_700 = "--color-gray-700" as const;
export const TOKEN_COLOR_GRAY_800 = "--color-gray-800" as const;
export const TOKEN_COLOR_GRAY_900 = "--color-gray-900" as const;
export const TOKEN_COLOR_GRAY_950 = "--color-gray-950" as const;
export const TOKEN_COLOR_WHITE = "--color-white" as const;
export const TOKEN_COLOR_BLACK = "--color-black" as const;

export const TOKEN_COLOR_BLUE_50 = "--color-blue-50" as const;
export const TOKEN_COLOR_BLUE_100 = "--color-blue-100" as const;
export const TOKEN_COLOR_BLUE_200 = "--color-blue-200" as const;
export const TOKEN_COLOR_BLUE_300 = "--color-blue-300" as const;
export const TOKEN_COLOR_BLUE_400 = "--color-blue-400" as const;
export const TOKEN_COLOR_BLUE_500 = "--color-blue-500" as const;
export const TOKEN_COLOR_BLUE_600 = "--color-blue-600" as const;
export const TOKEN_COLOR_BLUE_700 = "--color-blue-700" as const;
export const TOKEN_COLOR_BLUE_800 = "--color-blue-800" as const;
export const TOKEN_COLOR_BLUE_900 = "--color-blue-900" as const;

export const TOKEN_COLOR_GREEN_50 = "--color-green-50" as const;
export const TOKEN_COLOR_GREEN_500 = "--color-green-500" as const;
export const TOKEN_COLOR_GREEN_600 = "--color-green-600" as const;
export const TOKEN_COLOR_GREEN_700 = "--color-green-700" as const;

export const TOKEN_COLOR_AMBER_50 = "--color-amber-50" as const;
export const TOKEN_COLOR_AMBER_500 = "--color-amber-500" as const;
export const TOKEN_COLOR_AMBER_600 = "--color-amber-600" as const;
export const TOKEN_COLOR_AMBER_700 = "--color-amber-700" as const;

export const TOKEN_COLOR_RED_50 = "--color-red-50" as const;
export const TOKEN_COLOR_RED_500 = "--color-red-500" as const;
export const TOKEN_COLOR_RED_600 = "--color-red-600" as const;
export const TOKEN_COLOR_RED_700 = "--color-red-700" as const;

export const TOKEN_COLOR_SKY_50 = "--color-sky-50" as const;
export const TOKEN_COLOR_SKY_500 = "--color-sky-500" as const;
export const TOKEN_COLOR_SKY_600 = "--color-sky-600" as const;
export const TOKEN_COLOR_SKY_700 = "--color-sky-700" as const;

// Spacing
export const TOKEN_SPACING_0 = "--spacing-0" as const;
export const TOKEN_SPACING_1 = "--spacing-1" as const;
export const TOKEN_SPACING_2 = "--spacing-2" as const;
export const TOKEN_SPACING_3 = "--spacing-3" as const;
export const TOKEN_SPACING_4 = "--spacing-4" as const;
export const TOKEN_SPACING_5 = "--spacing-5" as const;
export const TOKEN_SPACING_6 = "--spacing-6" as const;
export const TOKEN_SPACING_8 = "--spacing-8" as const;
export const TOKEN_SPACING_10 = "--spacing-10" as const;
export const TOKEN_SPACING_12 = "--spacing-12" as const;
export const TOKEN_SPACING_16 = "--spacing-16" as const;
export const TOKEN_SPACING_20 = "--spacing-20" as const;
export const TOKEN_SPACING_24 = "--spacing-24" as const;

// Border Radius
export const TOKEN_RADIUS_NONE = "--radius-none" as const;
export const TOKEN_RADIUS_SM = "--radius-sm" as const;
export const TOKEN_RADIUS_MD = "--radius-md" as const;
export const TOKEN_RADIUS_LG = "--radius-lg" as const;
export const TOKEN_RADIUS_XL = "--radius-xl" as const;
export const TOKEN_RADIUS_2XL = "--radius-2xl" as const;
export const TOKEN_RADIUS_3XL = "--radius-3xl" as const;
export const TOKEN_RADIUS_FULL = "--radius-full" as const;

// Font Sizes
export const TOKEN_FONT_SIZE_XS = "--font-size-xs" as const;
export const TOKEN_FONT_SIZE_SM = "--font-size-sm" as const;
export const TOKEN_FONT_SIZE_BASE = "--font-size-base" as const;
export const TOKEN_FONT_SIZE_LG = "--font-size-lg" as const;
export const TOKEN_FONT_SIZE_XL = "--font-size-xl" as const;
export const TOKEN_FONT_SIZE_2XL = "--font-size-2xl" as const;
export const TOKEN_FONT_SIZE_3XL = "--font-size-3xl" as const;
export const TOKEN_FONT_SIZE_4XL = "--font-size-4xl" as const;

// Font Weights
export const TOKEN_FONT_WEIGHT_NORMAL = "--font-weight-normal" as const;
export const TOKEN_FONT_WEIGHT_MEDIUM = "--font-weight-medium" as const;
export const TOKEN_FONT_WEIGHT_SEMIBOLD = "--font-weight-semibold" as const;
export const TOKEN_FONT_WEIGHT_BOLD = "--font-weight-bold" as const;

// Shadows
export const TOKEN_SHADOW_SM = "--shadow-sm" as const;
export const TOKEN_SHADOW_MD = "--shadow-md" as const;
export const TOKEN_SHADOW_LG = "--shadow-lg" as const;
export const TOKEN_SHADOW_XL = "--shadow-xl" as const;

// Z-Index
export const TOKEN_Z_BASE = "--z-base" as const;
export const TOKEN_Z_RAISED = "--z-raised" as const;
export const TOKEN_Z_DROPDOWN = "--z-dropdown" as const;
export const TOKEN_Z_STICKY = "--z-sticky" as const;
export const TOKEN_Z_MODAL = "--z-modal" as const;
export const TOKEN_Z_POPOVER = "--z-popover" as const;
export const TOKEN_Z_TOAST = "--z-toast" as const;

// ============================================================
// Semantic Token Constants
// ============================================================

// Text
export const TOKEN_TEXT_PRIMARY = "--text-primary" as const;
export const TOKEN_TEXT_SECONDARY = "--text-secondary" as const;
export const TOKEN_TEXT_TERTIARY = "--text-tertiary" as const;
export const TOKEN_TEXT_DISABLED = "--text-disabled" as const;
export const TOKEN_TEXT_INVERSE = "--text-inverse" as const;
export const TOKEN_TEXT_INVERSE_SECONDARY = "--text-inverse-secondary" as const;
export const TOKEN_TEXT_LINK = "--text-link" as const;
export const TOKEN_TEXT_LINK_HOVER = "--text-link-hover" as const;
export const TOKEN_TEXT_SUCCESS = "--text-success" as const;
export const TOKEN_TEXT_WARNING = "--text-warning" as const;
export const TOKEN_TEXT_ERROR = "--text-error" as const;
export const TOKEN_TEXT_INFO = "--text-info" as const;

// Surface
export const TOKEN_SURFACE_PAGE = "--surface-page" as const;
export const TOKEN_SURFACE_CARD = "--surface-card" as const;
export const TOKEN_SURFACE_SUBTLE = "--surface-subtle" as const;
export const TOKEN_SURFACE_MUTED = "--surface-muted" as const;
export const TOKEN_SURFACE_OVERLAY = "--surface-overlay" as const;
export const TOKEN_SURFACE_INTERACTIVE_DEFAULT = "--surface-interactive-default" as const;
export const TOKEN_SURFACE_INTERACTIVE_HOVER = "--surface-interactive-hover" as const;
export const TOKEN_SURFACE_INTERACTIVE_ACTIVE = "--surface-interactive-active" as const;
export const TOKEN_SURFACE_INTERACTIVE_DISABLED = "--surface-interactive-disabled" as const;
export const TOKEN_SURFACE_ACCENT_SUBTLE = "--surface-accent-subtle" as const;
export const TOKEN_SURFACE_ACCENT_DEFAULT = "--surface-accent-default" as const;
export const TOKEN_SURFACE_ACCENT_STRONG = "--surface-accent-strong" as const;
export const TOKEN_SURFACE_SUCCESS_SUBTLE = "--surface-success-subtle" as const;
export const TOKEN_SURFACE_SUCCESS_DEFAULT = "--surface-success-default" as const;
export const TOKEN_SURFACE_WARNING_SUBTLE = "--surface-warning-subtle" as const;
export const TOKEN_SURFACE_WARNING_DEFAULT = "--surface-warning-default" as const;
export const TOKEN_SURFACE_ERROR_SUBTLE = "--surface-error-subtle" as const;
export const TOKEN_SURFACE_ERROR_DEFAULT = "--surface-error-default" as const;
export const TOKEN_SURFACE_INFO_SUBTLE = "--surface-info-subtle" as const;
export const TOKEN_SURFACE_INFO_DEFAULT = "--surface-info-default" as const;

// Border
export const TOKEN_BORDER_DEFAULT = "--border-default" as const;
export const TOKEN_BORDER_MUTED = "--border-muted" as const;
export const TOKEN_BORDER_STRONG = "--border-strong" as const;
export const TOKEN_BORDER_FOCUS = "--border-focus" as const;
export const TOKEN_BORDER_DISABLED = "--border-disabled" as const;
export const TOKEN_BORDER_SUCCESS = "--border-success" as const;
export const TOKEN_BORDER_WARNING = "--border-warning" as const;
export const TOKEN_BORDER_ERROR = "--border-error" as const;
export const TOKEN_BORDER_INFO = "--border-info" as const;

// Interactive
export const TOKEN_INTERACTIVE_PRIMARY_BG = "--interactive-primary-bg" as const;
export const TOKEN_INTERACTIVE_PRIMARY_BG_HOVER = "--interactive-primary-bg-hover" as const;
export const TOKEN_INTERACTIVE_PRIMARY_BG_ACTIVE = "--interactive-primary-bg-active" as const;
export const TOKEN_INTERACTIVE_PRIMARY_TEXT = "--interactive-primary-text" as const;
export const TOKEN_INTERACTIVE_SECONDARY_BG = "--interactive-secondary-bg" as const;
export const TOKEN_INTERACTIVE_SECONDARY_BG_HOVER = "--interactive-secondary-bg-hover" as const;
export const TOKEN_INTERACTIVE_SECONDARY_BG_ACTIVE = "--interactive-secondary-bg-active" as const;
export const TOKEN_INTERACTIVE_SECONDARY_TEXT = "--interactive-secondary-text" as const;
export const TOKEN_INTERACTIVE_SECONDARY_BORDER = "--interactive-secondary-border" as const;
export const TOKEN_INTERACTIVE_DESTRUCTIVE_BG = "--interactive-destructive-bg" as const;
export const TOKEN_INTERACTIVE_DESTRUCTIVE_BG_HOVER = "--interactive-destructive-bg-hover" as const;
export const TOKEN_INTERACTIVE_DESTRUCTIVE_TEXT = "--interactive-destructive-text" as const;

// ============================================================
// Token Name Union Types
// ============================================================

export type PrimitiveColorToken =
  | typeof TOKEN_COLOR_GRAY_50
  | typeof TOKEN_COLOR_GRAY_100
  | typeof TOKEN_COLOR_GRAY_200
  | typeof TOKEN_COLOR_GRAY_300
  | typeof TOKEN_COLOR_GRAY_400
  | typeof TOKEN_COLOR_GRAY_500
  | typeof TOKEN_COLOR_GRAY_600
  | typeof TOKEN_COLOR_GRAY_700
  | typeof TOKEN_COLOR_GRAY_800
  | typeof TOKEN_COLOR_GRAY_900
  | typeof TOKEN_COLOR_GRAY_950
  | typeof TOKEN_COLOR_WHITE
  | typeof TOKEN_COLOR_BLACK
  | typeof TOKEN_COLOR_BLUE_50
  | typeof TOKEN_COLOR_BLUE_100
  | typeof TOKEN_COLOR_BLUE_200
  | typeof TOKEN_COLOR_BLUE_300
  | typeof TOKEN_COLOR_BLUE_400
  | typeof TOKEN_COLOR_BLUE_500
  | typeof TOKEN_COLOR_BLUE_600
  | typeof TOKEN_COLOR_BLUE_700
  | typeof TOKEN_COLOR_BLUE_800
  | typeof TOKEN_COLOR_BLUE_900
  | typeof TOKEN_COLOR_GREEN_50
  | typeof TOKEN_COLOR_GREEN_500
  | typeof TOKEN_COLOR_GREEN_600
  | typeof TOKEN_COLOR_GREEN_700
  | typeof TOKEN_COLOR_AMBER_50
  | typeof TOKEN_COLOR_AMBER_500
  | typeof TOKEN_COLOR_AMBER_600
  | typeof TOKEN_COLOR_AMBER_700
  | typeof TOKEN_COLOR_RED_50
  | typeof TOKEN_COLOR_RED_500
  | typeof TOKEN_COLOR_RED_600
  | typeof TOKEN_COLOR_RED_700
  | typeof TOKEN_COLOR_SKY_50
  | typeof TOKEN_COLOR_SKY_500
  | typeof TOKEN_COLOR_SKY_600
  | typeof TOKEN_COLOR_SKY_700;

export type TextToken =
  | typeof TOKEN_TEXT_PRIMARY
  | typeof TOKEN_TEXT_SECONDARY
  | typeof TOKEN_TEXT_TERTIARY
  | typeof TOKEN_TEXT_DISABLED
  | typeof TOKEN_TEXT_INVERSE
  | typeof TOKEN_TEXT_INVERSE_SECONDARY
  | typeof TOKEN_TEXT_LINK
  | typeof TOKEN_TEXT_LINK_HOVER
  | typeof TOKEN_TEXT_SUCCESS
  | typeof TOKEN_TEXT_WARNING
  | typeof TOKEN_TEXT_ERROR
  | typeof TOKEN_TEXT_INFO;

export type SurfaceToken =
  | typeof TOKEN_SURFACE_PAGE
  | typeof TOKEN_SURFACE_CARD
  | typeof TOKEN_SURFACE_SUBTLE
  | typeof TOKEN_SURFACE_MUTED
  | typeof TOKEN_SURFACE_OVERLAY
  | typeof TOKEN_SURFACE_INTERACTIVE_DEFAULT
  | typeof TOKEN_SURFACE_INTERACTIVE_HOVER
  | typeof TOKEN_SURFACE_INTERACTIVE_ACTIVE
  | typeof TOKEN_SURFACE_INTERACTIVE_DISABLED
  | typeof TOKEN_SURFACE_ACCENT_SUBTLE
  | typeof TOKEN_SURFACE_ACCENT_DEFAULT
  | typeof TOKEN_SURFACE_ACCENT_STRONG
  | typeof TOKEN_SURFACE_SUCCESS_SUBTLE
  | typeof TOKEN_SURFACE_SUCCESS_DEFAULT
  | typeof TOKEN_SURFACE_WARNING_SUBTLE
  | typeof TOKEN_SURFACE_WARNING_DEFAULT
  | typeof TOKEN_SURFACE_ERROR_SUBTLE
  | typeof TOKEN_SURFACE_ERROR_DEFAULT
  | typeof TOKEN_SURFACE_INFO_SUBTLE
  | typeof TOKEN_SURFACE_INFO_DEFAULT;

export type BorderToken =
  | typeof TOKEN_BORDER_DEFAULT
  | typeof TOKEN_BORDER_MUTED
  | typeof TOKEN_BORDER_STRONG
  | typeof TOKEN_BORDER_FOCUS
  | typeof TOKEN_BORDER_DISABLED
  | typeof TOKEN_BORDER_SUCCESS
  | typeof TOKEN_BORDER_WARNING
  | typeof TOKEN_BORDER_ERROR
  | typeof TOKEN_BORDER_INFO;

export type VisorToken = PrimitiveColorToken | TextToken | SurfaceToken | BorderToken;
