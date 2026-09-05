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
  generateIntentDecls,
  generateHairlineDecls,
  generateTextScaleAliasDecls,
  generateSpaceAliasDecls,
  sectionComment,
  block,
  header,
} from "../generate-css.js";
import { collectBrandPassthrough } from "../overrides.js";
import { generateBrandPassthroughCss } from "./brand-passthrough.js";
import { generateComponentTokensCss } from "./component-tokens-css.js";
import { resolveComponentBindings } from "../component-tokens.js";
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
  // VI-616: element baseline. `includeBaseLayer` covers both halves — the
  // visor-core reset @import (propagation) and the origination block that
  // binds theme tokens to html/body.
  const includeBaseLayer = options?.includeBaseLayer ?? true;
  // Optional body-class scope prefix (e.g. `body.blacklight-theme`). When
  // unset, output preserves the legacy `:root` selectors. See VI-368.
  const scopePrefix = options?.scopePrefix;
  // BO-56: brand color-mode constraint. `dark-only`/`light-only` collapse the
  // adaptive + semantic + brand-passthrough emission onto the host selector and
  // drop the manual-toggle / `prefers-color-scheme` blocks.
  const colorScheme = input.config["color-scheme"] ?? "adaptive";
  const lines: string[] = [];
  const slug = toKebabCase(input.config.name);
  const aliasedFamilies = new Map<string, string>();

  lines.push(header("Visor Theme — NextJS Adapter"));

  // 0. Element baseline (VI-616). Ships from visor-core so it reaches every
  //    consumer on `npm update` — components are copy-and-own, so npm is the
  //    only auto-propagating channel Visor has. Delete this one line to
  //    decline (e.g. if the app already ships Tailwind preflight).
  if (includeBaseLayer) {
    lines.push('@import "@loworbitstudio/visor-core/reset";');
    lines.push("");
  }

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
        const url = buildVisorFontUrl(font.org ?? "", font.family, weight, font.cdnBase);
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

  // 2b. Base layer — ORIGINATION (VI-616).
  //
  // visor-core defines `--font-body` / `--text-primary` / `--surface-page` but
  // has no way to bind them to an element: the scaffolded layout is a bare
  // `<body>{children}</body>`. Without this block `--font-sans` is defined and
  // bound to nothing, so `font: inherit` on a control faithfully propagates
  // whatever the consumer hand-wrote. The docs adapter has always done this on
  // `.{slug}-theme`; the nextjs path never got it.
  //
  // Sits in `visor-base`, the lowest layer, so a consumer's own unlayered
  // `body { … }` still wins.
  if (includeBaseLayer) {
    const baseLines: string[] = [];

    // BO-56: pin UA chrome to the brand's single mode. Adaptive themes get
    // `color-scheme` per-mode from the visor-adaptive layer instead.
    if (colorScheme === "dark-only" || colorScheme === "light-only") {
      baseLines.push(sectionComment("Base: UA color-scheme"));
      baseLines.push(
        block("html", [`color-scheme: ${colorScheme === "dark-only" ? "dark" : "light"};`]),
      );
      baseLines.push("");
    }

    baseLines.push(sectionComment("Base: token-to-page binding"));
    baseLines.push(
      block(scopePrefix ?? "body", [
        "font-family: var(--font-body);",
        "font-size: 1rem;",
        "color: var(--text-primary);",
        "background: var(--surface-page, var(--surface-background));",
      ]),
    );

    lines.push(wrapInLayer("visor-base", baseLines.join("\n").trim()));
    lines.push("");
  }

  // 3. Primitives layer
  const primitivesBody = stripHeader(
    generatePrimitivesCss(input.primitives, input.config, {
      aliasedFamilies,
      scopePrefix,
    }),
  );
  lines.push(wrapInLayer("visor-primitives", primitivesBody));
  lines.push("");

  // 3b. Brand pass-through layer (VI-493) — unrecognized `overrides` keys emit
  // as bare `--<key>` custom properties in @layer visor-brand. Light-mode keys
  // attach to the host selector; dark-mode keys to the dark toggle selectors +
  // prefers-color-scheme media query (mirrors generateDarkCss).
  const passthrough = collectBrandPassthrough(input.tokens, input.config.overrides);
  const darkSelectors = scopePrefix
    ? [`${scopePrefix}.dark`, `${scopePrefix}.theme-dark`, `${scopePrefix}[data-theme="dark"]`]
    : [".dark", ".theme-dark", '[data-theme="dark"]'];
  const passthroughCss = generateBrandPassthroughCss(passthrough, {
    light: scopePrefix ?? ":root",
    dark: darkSelectors.join(",\n"),
    prefers: scopePrefix
      ? `${scopePrefix}:not(.light):not(.theme-light):not([data-theme="light"])`
      : ':root:not(.light):not(.theme-light):not([data-theme="light"])',
  }, colorScheme);
  if (passthroughCss) {
    lines.push(wrapInLayer("visor-brand", passthroughCss));
    lines.push("");
  }

  // 3c. Semantic layer (VI-453) — visor-semantic cascade layer.
  //
  // Bare-name intent (--primary, --accent, ...), hairline (--hairline,
  // --hairline-strong), and discrete pixel-named scales (--text-N, --space-N)
  // emit into a separate `visor-semantic` cascade layer so consumer overrides
  // in app-globals can still take precedence.
  //
  // D3: nextjs adapter uses :root for intent/hairline selectors (single-theme
  // bundle) and html:not(.dark)/html.dark for mode scoping. Discrete scales
  // (D4) are mode-agnostic and attach to :root unconditionally.
  const hostSelector = scopePrefix ?? ":root";
  const lightModeSelector = `html:not(.dark) ${scopePrefix ?? ""}`.trim();
  const darkModeSelector = `html.dark ${scopePrefix ?? ""}`.trim();
  const prefersSelector = scopePrefix
    ? `${scopePrefix}:not(.light):not(.theme-light):not([data-theme="light"])`
    : ':root:not(.light):not(.theme-light):not([data-theme="light"])';

  const semanticLines: string[] = [];
  semanticLines.push("/* ── Layer: Semantic aliases (VI-453) ── */");

  // Discrete-scale aliases: mode-agnostic.
  semanticLines.push(sectionComment("Discrete: Text size aliases (--text-N)"));
  semanticLines.push(block(hostSelector, generateTextScaleAliasDecls()));
  semanticLines.push("");
  semanticLines.push(sectionComment("Discrete: Space aliases (--space-N)"));
  semanticLines.push(block(hostSelector, generateSpaceAliasDecls(input.config)));
  semanticLines.push("");

  if (colorScheme === "dark-only") {
    // BO-56: dark intent/hairline live on the host unconditionally.
    semanticLines.push(sectionComment("Intent aliases (dark) — host"));
    semanticLines.push(block(hostSelector, generateIntentDecls(input.tokens, "dark")));
    semanticLines.push("");
    semanticLines.push(sectionComment("Hairline aliases (dark) — host"));
    semanticLines.push(block(hostSelector, generateHairlineDecls(input.tokens, "dark")));
    semanticLines.push("");
  } else if (colorScheme === "light-only") {
    // BO-56: light intent/hairline live on the host unconditionally.
    semanticLines.push(sectionComment("Intent aliases (light) — host"));
    semanticLines.push(block(hostSelector, generateIntentDecls(input.tokens, "light")));
    semanticLines.push("");
    semanticLines.push(sectionComment("Hairline aliases (light) — host"));
    semanticLines.push(block(hostSelector, generateHairlineDecls(input.tokens, "light")));
    semanticLines.push("");
  } else {
    // Light mode intent + hairline.
    semanticLines.push(sectionComment("Intent aliases (light)"));
    semanticLines.push(block(lightModeSelector, generateIntentDecls(input.tokens, "light")));
    semanticLines.push("");
    semanticLines.push(sectionComment("Hairline aliases (light)"));
    semanticLines.push(block(lightModeSelector, generateHairlineDecls(input.tokens, "light")));
    semanticLines.push("");

    // Dark mode intent + hairline — manual toggle.
    semanticLines.push(sectionComment("Intent aliases (dark) — manual toggle"));
    semanticLines.push(block(darkModeSelector, generateIntentDecls(input.tokens, "dark")));
    semanticLines.push("");
    semanticLines.push(sectionComment("Hairline aliases (dark) — manual toggle"));
    semanticLines.push(block(darkModeSelector, generateHairlineDecls(input.tokens, "dark")));
    semanticLines.push("");

    // Dark mode intent + hairline — prefers-color-scheme.
    semanticLines.push(sectionComment("Intent aliases (dark) — prefers-color-scheme"));
    {
      const inner = block(prefersSelector, generateIntentDecls(input.tokens, "dark"));
      semanticLines.push(`@media (prefers-color-scheme: dark) {\n${inner.split("\n").map((l) => `  ${l}`).join("\n")}\n}`);
    }
    semanticLines.push("");
    semanticLines.push(sectionComment("Hairline aliases (dark) — prefers-color-scheme"));
    {
      const inner = block(prefersSelector, generateHairlineDecls(input.tokens, "dark"));
      semanticLines.push(`@media (prefers-color-scheme: dark) {\n${inner.split("\n").map((l) => `  ${l}`).join("\n")}\n}`);
    }
    semanticLines.push("");
  }

  const semanticLayer = wrapInLayer("visor-semantic", semanticLines.join("\n").trim());
  if (semanticLayer) {
    lines.push(semanticLayer);
    lines.push("");
  }

  // 4. Adaptive layer (light + dark). BO-56: single-mode brands emit only one
  // palette (on the host) — the unused generator returns "".
  const lightBody = stripHeader(generateLightCss(input.tokens, { scopePrefix, colorScheme }));
  const darkBody = stripHeader(generateDarkCss(input.tokens, { scopePrefix, colorScheme }));
  const adaptiveBody = [lightBody, darkBody].filter(Boolean).join("\n\n");
  lines.push(
    wrapInLayer("visor-adaptive", adaptiveBody),
  );

  // 4b. Component tokens (VI-625) — the theme's `components:` bindings for the
  // admin-UI families. Appended to the same `visor-adaptive` layer: they are
  // mode-aware like the Tier-1 set, and nothing else declares these property
  // names, so a dedicated layer would buy no resolution power. Emits nothing
  // when the theme binds nothing, which is what keeps an unbound theme
  // byte-identical to a pre-VI-625 one.
  const componentTokensCss = generateComponentTokensCss(
    resolveComponentBindings(input.config.components),
    { light: hostSelector, dark: darkSelectors.join(",\n"), prefers: prefersSelector },
    colorScheme,
  );
  if (componentTokensCss) {
    lines.push("");
    lines.push(wrapInLayer("visor-adaptive", componentTokensCss));
  }

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
