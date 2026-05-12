/**
 * Font coverage validator.
 *
 * Catches the failure mode behind VI-358: emitted theme CSS declares
 * `--font-*: Family, ...` overrides but the same CSS contains no
 * `@font-face` rule for that family, so the browser can never load the
 * declared font and silently falls through to the next stack entry.
 *
 * The validator extracts the primary family from each `--font-*` declaration
 * (the first comma-separated token, unquoted) and checks it against the set
 * of @font-face families in the same emitted CSS. Generic CSS keywords
 * (sans-serif, system-ui, etc.) and well-known platform-installed fonts
 * (SF Mono, Helvetica, etc.) are skipped — those are intentionally part of
 * the fallback stack and never carry their own @font-face.
 *
 * Size-adjusted system-fallback faces (family ends with " Fallback") are
 * also excluded from the @font-face coverage set; they don't load a real
 * font, they only adjust local metrics.
 */

const FONT_VAR_RE = /--font-(heading|display|body|sans|mono)\s*:\s*([^;]+);/g;
const FONT_FACE_RE = /@font-face\s*\{[^}]*\}/g;
const FONT_FAMILY_DECL_RE = /font-family\s*:\s*([^;]+);/;
const GOOGLE_FONTS_IMPORT_RE =
  /@import\s+url\(["']?https:\/\/fonts\.googleapis\.com\/css2?\?family=([^:&"')]+)/g;

/** CSS generic family keywords + system-* keywords. Never need @font-face. */
const GENERIC_FAMILIES = new Set([
  "serif",
  "sans-serif",
  "monospace",
  "cursive",
  "fantasy",
  "system-ui",
  "ui-monospace",
  "ui-sans-serif",
  "ui-serif",
  "ui-rounded",
  "emoji",
  "math",
  "fangsong",
  "inherit",
  "initial",
  "unset",
  "revert",
  "none",
  // Apple / Chromium-on-Mac system keywords. These behave like
  // CSS-engine-level aliases, not real font families — `local()` can
  // never resolve them, so they never need an @font-face.
  "-apple-system",
  "-webkit-system-font",
  "BlinkMacSystemFont",
]);

/**
 * Common platform-installed fonts. These show up in fallback stacks
 * (especially `--font-mono`) and are quoted only because they contain
 * spaces. They never carry their own @font-face — the browser resolves
 * them via `local()`.
 */
const SYSTEM_FONTS = new Set([
  "Apple Color Emoji",
  "Arial",
  "Arial Black",
  "BlinkMacSystemFont",
  "Cambria",
  "Comic Sans MS",
  "Consolas",
  "Courier",
  "Courier New",
  "DejaVu Sans",
  "DejaVu Sans Mono",
  "Fira Code",
  "Fira Mono",
  "Fira Sans",
  "Georgia",
  "Helvetica",
  "Helvetica Neue",
  "Impact",
  "JetBrains Mono",
  "Liberation Mono",
  "Liberation Sans",
  "Lucida Console",
  "Lucida Grande",
  "Menlo",
  "Microsoft YaHei",
  "Monaco",
  "Noto Color Emoji",
  "Open Sans",
  "PingFang SC",
  "PingFang TC",
  "Roboto",
  "Roboto Mono",
  "Roboto Slab",
  "SF Mono",
  "SF Pro Display",
  "SF Pro Text",
  "Segoe UI",
  "Segoe UI Emoji",
  "Segoe UI Symbol",
  "Segoe UI Variable",
  "Source Code Pro",
  "Source Sans Pro",
  "Times",
  "Times New Roman",
  "Trebuchet MS",
  "Verdana",
]);

export interface FontCoverageError {
  family: string;
  declaredAt: string;
}

export interface FontCoverageResult {
  errors: FontCoverageError[];
}

/**
 * Extract the primary family from a `--font-*` value. Returns null if the
 * value is a `var()` indirection, a generic keyword, or a system font.
 *
 * Handles both quoted (`"Satoshi", sans-serif`) and unquoted (`Satoshi`)
 * primary tokens. The unquoted form is what docsAdapter emits when no
 * per-theme alias is active (the path that VI-358 exposed).
 */
function extractPrimaryFamily(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.startsWith("var(")) return null;

  // First comma-separated token, with whitespace trimmed.
  const firstToken = trimmed.split(",")[0].trim();
  if (!firstToken) return null;

  // Strip surrounding quotes (single or double) if present.
  const unquoted = firstToken.replace(/^["']|["']$/g, "");

  if (GENERIC_FAMILIES.has(unquoted)) return null;
  if (SYSTEM_FONTS.has(unquoted)) return null;

  return unquoted;
}

function extractFontFaceFamilies(css: string): Set<string> {
  const families = new Set<string>();
  const blocks = css.match(FONT_FACE_RE) ?? [];
  for (const block of blocks) {
    const decl = FONT_FAMILY_DECL_RE.exec(block);
    if (!decl) continue;
    const family = decl[1].trim().replace(/^["']|["'];?$/g, "");
    if (family.endsWith(" Fallback")) continue;
    families.add(family);
  }
  return families;
}

/**
 * Families covered by `@import url(...)` to fonts.googleapis.com. The
 * imported stylesheet ships its own @font-face blocks, so a Google Fonts
 * `@import` is equivalent coverage to a local @font-face — the validator
 * should not flag it as missing.
 *
 * Google's CSS2 URL puts the family in `?family=Font+Name:...` — pluses
 * decode back to spaces.
 */
function extractGoogleFontsImports(css: string): Set<string> {
  const families = new Set<string>();
  for (const match of css.matchAll(GOOGLE_FONTS_IMPORT_RE)) {
    const family = decodeURIComponent(match[1]).replace(/\+/g, " ");
    families.add(family);
  }
  return families;
}

function extractFontVarDeclarations(
  css: string,
): Array<{ slot: string; family: string }> {
  const decls: Array<{ slot: string; family: string }> = [];
  for (const match of css.matchAll(FONT_VAR_RE)) {
    const slot = `--font-${match[1]}`;
    const family = extractPrimaryFamily(match[2]);
    if (!family) continue;
    decls.push({ slot, family });
  }
  return decls;
}

export function validateFontCoverage(css: string): FontCoverageResult {
  const declaredFamilies = extractFontFaceFamilies(css);
  for (const f of extractGoogleFontsImports(css)) declaredFamilies.add(f);
  const declarations = extractFontVarDeclarations(css);

  const errors: FontCoverageError[] = [];
  const seen = new Set<string>();

  for (const decl of declarations) {
    if (declaredFamilies.has(decl.family)) continue;
    const key = `${decl.slot}::${decl.family}`;
    if (seen.has(key)) continue;
    seen.add(key);
    errors.push({ family: decl.family, declaredAt: decl.slot });
  }

  return { errors };
}
