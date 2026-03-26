/**
 * Flash of Wrong Theme (FOWT) Prevention
 *
 * A blocking script snippet that reads theme preference from localStorage
 * before the first paint, preventing the flash of wrong theme.
 *
 * Import as: @loworbitstudio/visor-theme-engine/fowt
 */

export interface FowtOptions {
  /** localStorage key to read (default: "visor-theme") */
  storageKey?: string;
  /** Default theme when no preference is stored (default: respects prefers-color-scheme) */
  defaultTheme?: "light" | "dark";
}

/**
 * Generate a FOWT prevention script with configurable options.
 *
 * The script is ES5-safe (no arrow functions, no template literals) since
 * it runs before any polyfills load. Place it as a blocking <script> in
 * the document <head> before any stylesheets.
 */
export function generateFowtScript(options?: FowtOptions): string {
  const key = options?.storageKey ?? "visor-theme";
  const defaultCheck = options?.defaultTheme === "dark"
    ? "true"
    : options?.defaultTheme === "light"
      ? "false"
      : 'window.matchMedia("(prefers-color-scheme: dark)").matches';

  return [
    "(function() {",
    "  try {",
    `    var t = localStorage.getItem("${key}");`,
    "    var d = document.documentElement;",
    `    if (t === "dark" || (!t && ${defaultCheck})) {`,
    '      d.classList.add("dark");',
    "    } else {",
    '      d.classList.add("light");',
    "    }",
    "  } catch(e) {}",
    "})();",
  ].join("\n");
}

/**
 * Default FOWT prevention script.
 *
 * Reads "visor-theme" from localStorage. Falls back to prefers-color-scheme.
 * Sets .dark or .light class on <html> before first paint.
 *
 * Usage in Next.js layout.tsx:
 *   <script>{FOWT_SCRIPT}</script>
 *
 * Usage in static HTML:
 *   <script>...paste FOWT_SCRIPT value...</script>
 */
export const FOWT_SCRIPT: string = generateFowtScript();
