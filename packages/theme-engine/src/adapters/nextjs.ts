/**
 * NextJS Adapter
 *
 * Generates CSS custom properties formatted for Next.js projects:
 * - @import for Google Fonts (before @layer per CSS spec)
 * - @layer declarations for specificity ordering
 * - Primitives, light/dark adaptive tokens in layers
 * - FOWT usage comment
 */

import { resolveThemeFonts } from "../fonts/pipeline.js";
import { buildVisorFontUrl } from "../fonts/resolve.js";
import { aliasFamily } from "../fonts/theme-alias.js";
import {
  generatePrimitivesCss,
  generateLightCss,
  generateDarkCss,
  header,
} from "../generate-css.js";
import { LAYER_ORDER, wrapInLayer } from "./layers.js";
import type { AdapterInput, NextJSAdapterOptions } from "./types.js";

function toKebabCase(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

/**
 * Generate Next.js-formatted CSS from theme engine output.
 *
 * Output order (CSS spec compliant):
 *   1. @import (Google Fonts)
 *   2. @layer order declaration
 *   3. @layer visor-primitives { ... }
 *   4. @layer visor-adaptive { light + dark }
 */
export function nextjsAdapter(
  input: AdapterInput,
  options?: NextJSAdapterOptions,
): string {
  const includeFontImports = options?.includeFontImports ?? true;
  const includeFowt = options?.includeFowt ?? true;
  // Optional body-class scope prefix (e.g. `body.blacklight-theme`). When
  // unset, output preserves the legacy `:root` selectors. See VI-368.
  const scopePrefix = options?.scopePrefix;
  const lines: string[] = [];
  const slug = toKebabCase(input.config.name);
  const aliasedFamilies = new Map<string, string>();

  lines.push(header("Visor Theme — NextJS Adapter"));

  // 1. Google Fonts @import + Visor Fonts @font-face (must come before @layer per CSS spec)
  if (includeFontImports && input.config.typography) {
    const fontResult = resolveThemeFonts(input.config.typography);
    const fontSlots = [fontResult.heading, fontResult.display, fontResult.body, fontResult.mono];

    // Build the family → alias map. Every family emitted as a per-theme
    // visor-fonts @font-face gets one entry. Keying by family (not by
    // slot) means a --font-* whose own slot doesn't carry the visor-fonts
    // source still picks up the alias if its family matches — see VI-354.
    for (const font of fontSlots) {
      if (font && font.source === "visor-fonts" && !aliasedFamilies.has(font.family)) {
        aliasedFamilies.set(font.family, aliasFamily(font.family, slug));
      }
    }

    const hostedCssFonts = [fontResult.heading, fontResult.display, fontResult.body, fontResult.mono].filter(
      (r): r is NonNullable<typeof r> =>
        r !== null && (r.source === "google-fonts" || r.source === "fontshare"),
    );

    // Deduplicate by CSS URL — both google-fonts and fontshare resolutions
    // carry a cssUrl that adapters render as @import.
    const seenUrls = new Set<string>();
    for (const font of hostedCssFonts) {
      if (font?.cssUrl && !seenUrls.has(font.cssUrl)) {
        seenUrls.add(font.cssUrl);
        lines.push(`@import url("${font.cssUrl}");`);
      }
    }

    if (seenUrls.size > 0) {
      lines.push("");
      lines.push(
        "/*",
        " * Note: If using next/font, remove the @import above and configure",
        " * fonts in your layout.tsx to avoid double-loading. See:",
        " * https://nextjs.org/docs/app/building-your-application/optimizing/fonts",
        " */",
      );
      lines.push("");
    }

    // Visor Fonts @font-face declarations (CDN-hosted fonts) — aliased per
    // theme so co-loaded themes sharing a family don't collide on shared
    // weights. See VI-354.
    const visorFonts = [fontResult.heading, fontResult.display, fontResult.body, fontResult.mono].filter(
      (r): r is NonNullable<typeof r> => r !== null && r.source === "visor-fonts",
    );
    const seenVisorFamilies = new Set<string>();
    for (const font of visorFonts) {
      if (seenVisorFamilies.has(font.family)) continue;
      seenVisorFamilies.add(font.family);
      const aliased = aliasedFamilies.get(font.family)!;
      for (const weight of font.weights) {
        const url = buildVisorFontUrl(font.org ?? "", font.family, weight);
        lines.push(`@font-face {`);
        lines.push(`  font-family: "${aliased}";`);
        lines.push(`  src: url("${url}") format("woff2");`);
        lines.push(`  font-weight: ${weight};`);
        lines.push(`  font-style: ${font.italic ? "italic" : "normal"};`);
        lines.push(`  font-display: ${font.display};`);
        lines.push(`}`);
        lines.push("");
      }
    }
  }

  // 2. @layer order declaration
  lines.push(LAYER_ORDER);
  lines.push("");

  // 3. Primitives layer
  const primitivesBody = stripHeader(
    generatePrimitivesCss(input.primitives, input.config, {
      aliasedFamilies,
      scopePrefix,
    }),
  );
  lines.push(wrapInLayer("visor-primitives", primitivesBody));
  lines.push("");

  // 4. Adaptive layer (light + dark)
  const lightBody = stripHeader(generateLightCss(input.tokens, { scopePrefix }));
  const darkBody = stripHeader(generateDarkCss(input.tokens, { scopePrefix }));
  lines.push(
    wrapInLayer("visor-adaptive", lightBody + "\n\n" + darkBody),
  );

  // 5. FOWT usage comment
  if (includeFowt) {
    lines.push("");
    lines.push(
      "/*",
      " * FOWT Prevention: Add this blocking script to your <head> before",
      " * any stylesheets to prevent flash of wrong theme:",
      " *",
      " * import { FOWT_SCRIPT } from '@loworbitstudio/visor-theme-engine/fowt';",
      " *",
      " * In your layout.tsx <head>:",
      " *   <script>",
      " *     {FOWT_SCRIPT}",
      " *   </script>",
      " */",
    );
  }

  return lines.join("\n") + "\n";
}

/** Strip the auto-generated header comment from CSS output. */
function stripHeader(css: string): string {
  const headerEndMarker = "============================================ */";
  const idx = css.indexOf(headerEndMarker);
  if (idx === -1) return css;
  return css.slice(idx + headerEndMarker.length).trim();
}
