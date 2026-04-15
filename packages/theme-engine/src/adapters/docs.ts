/**
 * Docs Adapter
 *
 * Generates class-scoped CSS for the Visor docs site (fumadocs).
 * Output matches the hand-written theme CSS files in packages/docs/app/.
 *
 * Structure:
 *   1. Font imports (@import Google Fonts, @font-face Visor Fonts)
 *   2. .{slug}-theme { } — all primitives (colors, spacing, radius, typography,
 *      shadows, motion, misc)
 *   3. .dark .{slug}-theme { } — dark semantic tokens
 *      @media (prefers-color-scheme: dark) { .{slug}-theme:not(.light) { } }
 *   4. html:not(.dark) .{slug}-theme { } — light semantic tokens
 *   5. Fumadocs bridge — .dark/.light scoped to theme class
 */

import type {
  GeneratedPrimitives,
  ResolvedThemeConfig,
  SemanticTokens,
  ShadeStep,
  ColorRole,
} from "../types.js";
import { FULL_SHADE_STEPS, SELECTIVE_SHADE_STEPS, generateShadeScale } from "../shades.js";
import { resolveThemeFonts } from "../fonts/pipeline.js";
import { buildVisorFontUrl } from "../fonts/resolve.js";
import { FUMADOCS_BRIDGE_MAP } from "./fumadocs-map.js";
import type { AdapterInput, DocsAdapterOptions } from "./types.js";

/** Color roles that produce full scales vs. selective scales. */
const FULL_SCALE_ROLES: ColorRole[] = ["primary", "accent", "neutral"];
const SELECTIVE_SCALE_ROLES: ColorRole[] = ["success", "warning", "error", "info"];

function toKebabCase(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

function generateColorDecls(primitives: GeneratedPrimitives): string[] {
  const decls: string[] = [];
  decls.push("--color-white: #ffffff;");
  decls.push("--color-black: #000000;");

  const allRoles: ColorRole[] = [...FULL_SCALE_ROLES, ...SELECTIVE_SCALE_ROLES];
  for (const role of allRoles) {
    const scale = primitives[role];
    const steps: ShadeStep[] = FULL_SCALE_ROLES.includes(role)
      ? (FULL_SHADE_STEPS as unknown as ShadeStep[])
      : (SELECTIVE_SHADE_STEPS as unknown as ShadeStep[]);
    for (const step of steps) {
      const value = (scale as Record<number, string>)[step];
      decls.push(`--color-${role}-${step}: ${value};`);
    }
  }
  return decls;
}

function generateSpacingDecls(config: ResolvedThemeConfig): string[] {
  const multipliers = [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24];
  return multipliers.map((m) => {
    const px = config.spacing.base * m;
    const rem = px === 0 ? "0" : `${px / 16}rem`;
    return `--spacing-${m}: ${rem};`;
  });
}

function generateRadiusDecls(config: ResolvedThemeConfig): string[] {
  return [
    "--radius-none: 0;",
    `--radius-sm: ${config.radius.sm / 16}rem; /* ${config.radius.sm}px */`,
    `--radius-md: ${config.radius.md / 16}rem; /* ${config.radius.md}px */`,
    `--radius-lg: ${config.radius.lg / 16}rem; /* ${config.radius.lg}px */`,
    `--radius-xl: ${config.radius.xl / 16}rem; /* ${config.radius.xl}px */`,
    `--radius-2xl: ${(config.radius.xl * 1.333) / 16}rem; /* ${Math.round(config.radius.xl * 1.333)}px */`,
    `--radius-3xl: ${(config.radius.xl * 2) / 16}rem; /* ${config.radius.xl * 2}px */`,
    `--radius-full: ${config.radius.pill}px;`,
  ];
}

function generateTypographyDecls(config: ResolvedThemeConfig): string[] {
  const decls: string[] = [];

  // Font families
  decls.push(`--font-display: ${config.typography.display.family};`);
  decls.push(`--font-sans: ${config.typography.body.family};`);
  decls.push(`--font-heading: var(--font-sans);`);
  decls.push(`--font-body: ${config.typography.body.family};`);
  decls.push(`--font-mono: ${config.typography.mono.family};`);

  // Font sizes
  const fontSizes: Record<string, number> = {
    xs: 12, sm: 14, base: 16, lg: 18, xl: 20, "2xl": 24, "3xl": 30, "4xl": 36,
  };
  for (const [name, px] of Object.entries(fontSizes)) {
    decls.push(`--font-size-${name}: ${px / 16}rem; /* ${px}px */`);
  }

  // Font weights
  decls.push(`--font-weight-normal: ${config.typography.body.weight};`);
  decls.push("--font-weight-medium: 500;");
  decls.push(`--font-weight-semibold: ${config.typography.heading.weight};`);
  decls.push("--font-weight-bold: 700;");

  // Line heights
  const lineHeights: Record<string, number> = {
    none: 1, tight: 1.25, snug: 1.375, normal: 1.5, relaxed: 1.625, loose: 2,
  };
  for (const [name, value] of Object.entries(lineHeights)) {
    decls.push(`--line-height-${name}: ${value};`);
  }

  // Letter spacing
  decls.push("--letter-spacing-normal: 0.05em;");

  return decls;
}

function generateShadowDecls(config: ResolvedThemeConfig): string[] {
  return [
    `--shadow-xs: ${config.shadows.xs};`,
    `--shadow-sm: ${config.shadows.sm};`,
    `--shadow-md: ${config.shadows.md};`,
    `--shadow-lg: ${config.shadows.lg};`,
    `--shadow-xl: ${config.shadows.xl};`,
  ];
}

function generateMotionDecls(config: ResolvedThemeConfig): string[] {
  return [
    `--motion-duration-100: ${config.motion["duration-fast"]};`,
    "--motion-duration-150: 150ms;",
    `--motion-duration-200: ${config.motion["duration-normal"]};`,
    "--motion-duration-300: 300ms;",
    `--motion-duration-500: ${config.motion["duration-slow"]};`,
    "--motion-duration-800: 800ms;",
    "--motion-easing-linear: linear;",
    "--motion-easing-ease-in: cubic-bezier(0.4, 0, 1, 1);",
    "--motion-easing-ease-out: cubic-bezier(0, 0, 0.2, 1);",
    `--motion-easing-ease-in-out: ${config.motion.easing};`,
    "--motion-easing-spring: cubic-bezier(0.34, 1.56, 0.64, 1);",
  ];
}

function generateMiscDecls(): string[] {
  return [
    "--border-width-1: 1px;",
    "--border-width-2: 2px;",
    "--border-width-3: 3px;",
    "--border-width-4: 4px;",
    "--z-base: 0;",
    "--z-raised: 1;",
    "--z-dropdown: 1000;",
    "--z-sticky: 1100;",
    "--z-modal: 1300;",
    "--z-popover: 1400;",
    "--z-toast: 1500;",
    "--overlay-bg: rgba(0, 0, 0, 0.5);",
    "--focus-ring-width: 2px;",
    "--focus-ring-offset: 2px;",
  ];
}

function generateSemanticDecls(tokens: SemanticTokens, mode: "light" | "dark"): string[] {
  const decls: string[] = [];
  for (const [name, values] of Object.entries(tokens.text)) {
    decls.push(`--text-${name}: ${values[mode]};`);
  }
  for (const [name, values] of Object.entries(tokens.surface)) {
    decls.push(`--surface-${name}: ${values[mode]};`);
  }
  for (const [name, values] of Object.entries(tokens.border)) {
    decls.push(`--border-${name}: ${values[mode]};`);
  }
  for (const [name, values] of Object.entries(tokens.interactive)) {
    decls.push(`--interactive-${name}: ${values[mode]};`);
  }
  return decls;
}

function generateFumadocsBridgeDecls(tokens: SemanticTokens, mode: "light" | "dark"): string[] {
  const decls: string[] = [];
  for (const [fdToken, entry] of Object.entries(FUMADOCS_BRIDGE_MAP)) {
    const tokenMap = tokens[entry.category];
    const value = tokenMap?.[entry.visorToken];
    if (!value) {
      decls.push(`/* --color-${fdToken}: unmapped */`);
    } else {
      decls.push(`--color-${fdToken}: ${value[mode]};`);
    }
  }
  return decls;
}

function block(selector: string, decls: string[]): string {
  return [`${selector} {`, ...decls.map((d) => `  ${d}`), "}"].join("\n");
}

function sectionComment(label: string): string {
  return `\n/* --- ${label} --- */`;
}

/**
 * Generate docs-site CSS for a theme.
 *
 * Output is class-scoped (.{slug}-theme) with no @layer wrapping,
 * matching the hand-written theme files in packages/docs/app/.
 */
export function docsAdapter(
  input: AdapterInput,
  options?: DocsAdapterOptions,
): string {
  const slug = toKebabCase(input.config.name);
  const scopeClass = `.${slug}-theme`;
  const includeFontImports = options?.includeFontImports ?? true;
  const lines: string[] = [];

  // ─── Font imports ─────────────────────────────────────────────────────────

  if (includeFontImports && input.config.typography) {
    const fontResult = resolveThemeFonts(input.config.typography);
    const fontSlots = [fontResult.heading, fontResult.display, fontResult.body, fontResult.mono];

    // Google Fonts @import
    const seenUrls = new Set<string>();
    for (const font of fontSlots) {
      if (font && font.source === "google-fonts" && font.cssUrl && !seenUrls.has(font.cssUrl)) {
        seenUrls.add(font.cssUrl);
        lines.push(`@import url("${font.cssUrl}");`);
        lines.push("");
      }
    }

    // Visor Fonts @font-face
    const scale = input.config.typography?.scale ?? 1;
    const seenFamilies = new Set<string>();
    for (const font of fontSlots) {
      if (font && font.source === "visor-fonts" && !seenFamilies.has(font.family)) {
        seenFamilies.add(font.family);
        for (const weight of font.weights) {
          const url = buildVisorFontUrl(font.org ?? "", font.family, weight);
          lines.push("@font-face {");
          lines.push(`  font-family: "${font.family}";`);
          lines.push(`  src: url("${url}") format("woff2");`);
          lines.push(`  font-weight: ${weight};`);
          lines.push(`  font-style: ${font.italic ? "italic" : "normal"};`);
          lines.push(`  font-display: ${font.display};`);
          if (scale !== 1) {
            lines.push(`  size-adjust: ${Math.round(scale * 100)}%;`);
          }
          lines.push("}");
          lines.push("");
        }
      }
    }
  }

  // ─── Section 1: Shared tokens (mode-independent primitives) ───────────────

  lines.push("\n/* ── Section 1: Shared tokens (mode-independent) ── */");

  const sharedDecls: string[] = [
    "min-height: 100vh;",
    "font-size: 1rem;",
    `background: var(--surface-page, var(--surface-background));`,
    "color: var(--text-primary);",
    "font-family: var(--font-sans);",
  ];

  lines.push(sectionComment("Primitive: Colors"));
  lines.push(block(scopeClass, [
    ...sharedDecls,
    "",
    ...generateColorDecls(input.primitives),
  ]));
  lines.push("");

  lines.push(sectionComment("Primitive: Spacing"));
  lines.push(block(scopeClass, generateSpacingDecls(input.config)));
  lines.push("");

  lines.push(sectionComment("Primitive: Border Radius"));
  lines.push(block(scopeClass, generateRadiusDecls(input.config)));
  lines.push("");

  lines.push(sectionComment("Primitive: Typography"));
  lines.push(block(scopeClass, generateTypographyDecls(input.config)));
  lines.push("");

  lines.push(sectionComment("Primitive: Shadows"));
  lines.push(block(scopeClass, generateShadowDecls(input.config)));
  lines.push("");

  lines.push(sectionComment("Primitive: Motion"));
  lines.push(block(scopeClass, generateMotionDecls(input.config)));
  lines.push("");

  lines.push(sectionComment("Primitive: Miscellaneous"));
  lines.push(block(scopeClass, generateMiscDecls()));
  lines.push("");

  // ─── Section 2: Dark mode overrides ───────────────────────────────────────

  lines.push("\n/* ── Section 2: Dark mode overrides ── */");

  const darkDecls = generateSemanticDecls(input.tokens, "dark");

  // If colors-dark specifies a dark-mode primary or accent, regenerate their
  // shade scales from the dark brand color and emit as primitive overrides
  // in .dark {scope}. This makes dark-first themes (e.g. ENTR) show the dark
  // brand color at --color-primary-500 (the "brand anchor" step).
  const colorsDark = input.config["colors-dark"];
  const darkPrimitiveOverrides: string[] = [];
  if (colorsDark?.primary) {
    const darkPrimary = generateShadeScale(colorsDark.primary, "primary") as Record<number, string>;
    for (const step of FULL_SHADE_STEPS) {
      darkPrimitiveOverrides.push(`--color-primary-${step}: ${darkPrimary[step]};`);
    }
  }
  if (colorsDark?.accent) {
    const darkAccent = generateShadeScale(colorsDark.accent, "accent") as Record<number, string>;
    for (const step of FULL_SHADE_STEPS) {
      darkPrimitiveOverrides.push(`--color-accent-${step}: ${darkAccent[step]};`);
    }
  }
  if (darkPrimitiveOverrides.length > 0) {
    lines.push(sectionComment("Primitive overrides (dark) — dark brand color anchors at shade 500"));
    lines.push(block(`.dark ${scopeClass}`, darkPrimitiveOverrides));
    lines.push("");
  }

  // Manual toggle
  const categories = ["Text", "Surface", "Border", "Interactive"];
  const categoryDecls = [
    Object.entries(input.tokens.text).map(([n, v]) => `--text-${n}: ${v.dark};`),
    Object.entries(input.tokens.surface).map(([n, v]) => `--surface-${n}: ${v.dark};`),
    Object.entries(input.tokens.border).map(([n, v]) => `--border-${n}: ${v.dark};`),
    Object.entries(input.tokens.interactive).map(([n, v]) => `--interactive-${n}: ${v.dark};`),
  ];
  for (let i = 0; i < categories.length; i++) {
    lines.push(sectionComment(`Adaptive: ${categories[i]} (dark) — manual toggle`));
    lines.push(block(`.dark ${scopeClass}`, categoryDecls[i]));
    lines.push("");
  }

  // prefers-color-scheme duplicate
  const pcsCategories = [
    { label: "Text", entries: Object.entries(input.tokens.text).map(([n, v]) => `--text-${n}: ${v.dark};`) },
    { label: "Surface", entries: Object.entries(input.tokens.surface).map(([n, v]) => `--surface-${n}: ${v.dark};`) },
    { label: "Border", entries: Object.entries(input.tokens.border).map(([n, v]) => `--border-${n}: ${v.dark};`) },
    { label: "Interactive", entries: Object.entries(input.tokens.interactive).map(([n, v]) => `--interactive-${n}: ${v.dark};`) },
  ];
  for (const cat of pcsCategories) {
    lines.push(sectionComment(`Adaptive: ${cat.label} (dark) — prefers-color-scheme`));
    const inner = block(`${scopeClass}:not(.light)`, cat.entries);
    lines.push(`@media (prefers-color-scheme: dark) {\n${inner.split("\n").map((l) => `  ${l}`).join("\n")}\n}`);
    lines.push("");
  }

  // Primitive overrides also apply under prefers-color-scheme when no manual toggle set
  if (darkPrimitiveOverrides.length > 0) {
    lines.push(sectionComment("Primitive overrides (dark) — prefers-color-scheme"));
    const inner = block(`${scopeClass}:not(.light)`, darkPrimitiveOverrides);
    lines.push(`@media (prefers-color-scheme: dark) {\n${inner.split("\n").map((l) => `  ${l}`).join("\n")}\n}`);
    lines.push("");
  }

  // ─── Section 3: Light mode overrides ──────────────────────────────────────

  lines.push("\n/* ── Section 3: Light mode overrides ── */");

  const lightCategoryDecls = [
    { label: "Text", entries: Object.entries(input.tokens.text).map(([n, v]) => `--text-${n}: ${v.light};`) },
    { label: "Surface", entries: Object.entries(input.tokens.surface).map(([n, v]) => `--surface-${n}: ${v.light};`) },
    { label: "Border", entries: Object.entries(input.tokens.border).map(([n, v]) => `--border-${n}: ${v.light};`) },
    { label: "Interactive", entries: Object.entries(input.tokens.interactive).map(([n, v]) => `--interactive-${n}: ${v.light};`) },
  ];
  for (const cat of lightCategoryDecls) {
    lines.push(sectionComment(`Adaptive: ${cat.label} (light)`));
    lines.push(block(`html:not(.dark) ${scopeClass}`, cat.entries));
    lines.push("");
  }

  // ─── Section 4: Framework bridge (fumadocs) ────────────────────────────────

  lines.push(sectionComment("Fumadocs bridge: dark"));
  lines.push(block(`.dark ${scopeClass}`, generateFumadocsBridgeDecls(input.tokens, "dark")));
  lines.push("");

  lines.push(sectionComment("Fumadocs bridge: light"));
  lines.push(block(`html:not(.dark) ${scopeClass}`, generateFumadocsBridgeDecls(input.tokens, "light")));
  lines.push("");

  return lines.join("\n") + "\n";
}
