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
import {
  generatePrimitivesCss,
  generateLightCss,
  generateDarkCss,
  header,
} from "../generate-css.js";
import { LAYER_ORDER, wrapInLayer } from "./layers.js";
import type { AdapterInput, NextJSAdapterOptions } from "./types.js";

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
  const lines: string[] = [];

  lines.push(header("Visor Theme — NextJS Adapter"));

  // 1. Google Fonts @import (must come before @layer per CSS spec)
  if (includeFontImports && input.config.typography) {
    const fontResult = resolveThemeFonts(input.config.typography);
    const googleFonts = [fontResult.heading, fontResult.body].filter(
      (r) => r !== null && r.source === "google-fonts",
    );

    // Deduplicate by CSS URL
    const seenUrls = new Set<string>();
    for (const font of googleFonts) {
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
  }

  // 2. @layer order declaration
  lines.push(LAYER_ORDER);
  lines.push("");

  // 3. Primitives layer
  const primitivesBody = stripHeader(
    generatePrimitivesCss(input.primitives, input.config),
  );
  lines.push(wrapInLayer("visor-primitives", primitivesBody));
  lines.push("");

  // 4. Adaptive layer (light + dark)
  const lightBody = stripHeader(generateLightCss(input.tokens));
  const darkBody = stripHeader(generateDarkCss(input.tokens));
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
