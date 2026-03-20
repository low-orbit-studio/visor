/**
 * @loworbit/visor-tokens
 *
 * CSS custom property design tokens for the Visor design system.
 *
 * Token architecture follows the 3-tier model:
 * 1. Primitives — raw values (colors, spacing, font sizes)
 * 2. Semantic — named by purpose (--text-primary, --surface-card, --border-default)
 * 3. Adaptive — theme-aware tokens that switch based on active theme class
 *
 * Usage:
 *   import "@loworbit/visor-tokens"  // full bundle — primitives + semantic + adaptive (light + dark)
 *
 * Theming — automatic (system preference):
 *   The full bundle respects prefers-color-scheme: dark automatically.
 *   No extra setup required — users who prefer dark mode get it out of the box.
 *
 * Theming — manual toggle:
 *   Apply one of the following to your <html> or any root element:
 *     class="dark"              — dark mode
 *     class="theme-dark"        — dark mode (legacy)
 *     data-theme="dark"         — dark mode
 *     class="light"             — force light mode (overrides system preference)
 *     class="theme-light"       — force light mode (legacy)
 *     data-theme="light"        — force light mode
 *
 * Granular imports:
 *   import "@loworbit/visor-tokens/primitives"      — primitive tokens only
 *   import "@loworbit/visor-tokens/semantic"        — semantic tokens only
 *   import "@loworbit/visor-tokens/themes/light"    — light theme adaptive tokens
 *   import "@loworbit/visor-tokens/themes/dark"     — dark theme adaptive tokens
 *
 * Then reference tokens in CSS:
 *   color: var(--text-primary);
 *   background: var(--surface-card);
 */

export const version = "0.1.0";

/**
 * Theme class/attribute names for applying themes manually.
 * Apply to <html> or a root container element.
 */
export const THEME_DARK_CLASS = "dark" as const;
export const THEME_DARK_LEGACY_CLASS = "theme-dark" as const;
export const THEME_DARK_DATA_ATTR = "dark" as const;

export const THEME_LIGHT_CLASS = "light" as const;
export const THEME_LIGHT_LEGACY_CLASS = "theme-light" as const;
export const THEME_LIGHT_DATA_ATTR = "light" as const;

export type Theme = "light" | "dark";

/**
 * Apply a theme to an element (defaults to document.documentElement).
 * Removes conflicting theme classes/attributes before applying the new one.
 */
export function applyTheme(theme: Theme, element?: HTMLElement): void {
  const el = element ?? document.documentElement;

  // Remove all theme markers
  el.classList.remove(
    THEME_DARK_CLASS,
    THEME_DARK_LEGACY_CLASS,
    THEME_LIGHT_CLASS,
    THEME_LIGHT_LEGACY_CLASS
  );
  el.removeAttribute("data-theme");

  // Apply new theme
  if (theme === "dark") {
    el.classList.add(THEME_DARK_CLASS);
  } else {
    el.classList.add(THEME_LIGHT_CLASS);
  }
}

/**
 * Get the current preferred theme based on system preference.
 */
export function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}
