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

/**
 * Options for the theme-identity (palette) FOWT script.
 *
 * This axis is orthogonal to the dark/light MODE axis covered by
 * {@link generateFowtScript}: it selects one of N registered themes (palettes)
 * persisted in localStorage, rather than toggling a light/dark class. Consumers
 * that switch BOTH axes at runtime can place both scripts in the same <head>.
 */
export interface ThemeFowtOptions {
  /**
   * Allowlist of registered theme names. The stored value is validated against
   * this list; anything not present (including a missing or corrupt value)
   * falls back to {@link ThemeFowtOptions.defaultTheme}.
   */
  themes: string[];
  /** Theme name to use when no valid preference is stored. */
  defaultTheme: string;
  /** localStorage key to read (default: "visor-theme-name"). */
  storageKey?: string;
  /**
   * Attribute stamped on <html> with the resolved theme name, for the runtime
   * switcher and tests to read (default: "data-theme-name").
   */
  attribute?: string;
}

/**
 * Generate a pre-paint script for the theme-identity (palette) axis.
 *
 * The emitted script, run before first paint as a blocking <script> in <head>:
 *   1. Reads the stored theme name from localStorage.
 *   2. Validates it against the registered-theme allowlist; falls back to the
 *      default when the stored value is unknown, absent, or unreadable.
 *   3. Stamps the resolved name on <html> via the configured attribute.
 *   4. Toggles `disabled` across every inlined `style[data-theme-css]` element,
 *      enabling exactly the one matching the resolved theme.
 *
 * Place the inlined `style[data-theme-css="<name>"]` elements in <head> BEFORE
 * this script so they exist when it runs.
 *
 * The output is ES5-safe (no arrow functions, no template literals) since it
 * runs before any polyfills load. It mirrors the existing FOWT conventions:
 * self-invoking, parser-blocking, try/catch-wrapped, allowlist-validated with a
 * default fallback.
 */
export function generateThemeFowtScript(options: ThemeFowtOptions): string {
  const key = options.storageKey ?? "visor-theme-name";
  const attr = options.attribute ?? "data-theme-name";
  const names = JSON.stringify(options.themes);
  const fallback = JSON.stringify(options.defaultTheme);

  return [
    "(function() {",
    "  try {",
    "    var themes = " + names + ";",
    '    var stored = localStorage.getItem("' + key + '");',
    "    var active = themes.indexOf(stored) !== -1 ? stored : " + fallback + ";",
    '    document.documentElement.setAttribute("' + attr + '", active);',
    '    var styles = document.querySelectorAll("style[data-theme-css]");',
    "    for (var i = 0; i < styles.length; i++) {",
    '      styles[i].disabled = styles[i].getAttribute("data-theme-css") !== active;',
    "    }",
    "  } catch(e) {}",
    "})();",
  ].join("\n");
}
