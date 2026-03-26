/**
 * Deck Adapter
 *
 * Generates CSS scoped under a .deck--{theme-name} class for pitch decks
 * where multiple themes may coexist on one page. All tokens are nested
 * under the scope class — no :root selectors.
 */

import type {
  GeneratedPrimitives,
  ResolvedThemeConfig,
  SemanticTokens,
  ShadeStep,
  ColorRole,
} from "../types.js";
import { FULL_SHADE_STEPS, SELECTIVE_SHADE_STEPS } from "../shades.js";
import { header, sectionComment } from "../generate-css.js";
import { wrapInLayer } from "./layers.js";
import type { AdapterInput, DeckAdapterOptions } from "./types.js";

/** Color roles that produce full scales vs. selective scales. */
const FULL_SCALE_ROLES: ColorRole[] = ["primary", "accent", "neutral"];
const SELECTIVE_SCALE_ROLES: ColorRole[] = [
  "success",
  "warning",
  "error",
  "info",
];

function toKebabCase(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

function generateScopedPrimitives(
  primitives: GeneratedPrimitives,
  config: ResolvedThemeConfig,
): string[] {
  const decls: string[] = [];

  // Colors
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

  // Spacing
  const multipliers = [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24];
  for (const m of multipliers) {
    const px = config.spacing.base * m;
    const rem = px === 0 ? "0" : `${px / 16}rem`;
    decls.push(`--spacing-${m}: ${rem};`);
  }

  // Radius
  decls.push("--radius-none: 0;");
  decls.push(`--radius-sm: ${config.radius.sm / 16}rem;`);
  decls.push(`--radius-md: ${config.radius.md / 16}rem;`);
  decls.push(`--radius-lg: ${config.radius.lg / 16}rem;`);
  decls.push(`--radius-xl: ${config.radius.xl / 16}rem;`);
  decls.push(`--radius-full: ${config.radius.pill}px;`);

  // Typography
  decls.push(`--font-sans: ${config.typography.body.family};`);
  decls.push(`--font-mono: ${config.typography.mono.family};`);

  return decls;
}

function generateSemanticDecls(
  tokens: SemanticTokens,
  mode: "light" | "dark",
): string[] {
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

/**
 * Generate scoped CSS for a deck theme.
 *
 * All tokens are nested under .deck--{theme-name} with no :root selectors.
 * Dark mode uses .dark .deck--{name} selectors.
 */
export function deckAdapter(
  input: AdapterInput,
  options?: DeckAdapterOptions,
): string {
  const scopeClass =
    options?.scopeClass ?? `.deck--${toKebabCase(input.config.name)}`;
  const lines: string[] = [];

  lines.push(header(`Visor Theme — Deck Adapter (${scopeClass})`));

  // Primitives + light mode tokens
  const primDecls = generateScopedPrimitives(input.primitives, input.config);
  const lightDecls = generateSemanticDecls(input.tokens, "light");

  const lightBlock = [
    `${scopeClass} {`,
    sectionComment("Primitives"),
    ...primDecls.map((d) => `  ${d}`),
    "",
    sectionComment("Semantic (light)"),
    ...lightDecls.map((d) => `  ${d}`),
    "}",
  ].join("\n");

  // Dark mode tokens
  const darkDecls = generateSemanticDecls(input.tokens, "dark");

  const darkBlock = [
    `.dark ${scopeClass} {`,
    ...darkDecls.map((d) => `  ${d}`),
    "}",
    "",
    `@media (prefers-color-scheme: dark) {`,
    `  ${scopeClass}:not(.light) {`,
    ...darkDecls.map((d) => `    ${d}`),
    `  }`,
    `}`,
  ].join("\n");

  lines.push(wrapInLayer("visor-adaptive", lightBlock + "\n\n" + darkBlock));
  lines.push("");

  return lines.join("\n") + "\n";
}
