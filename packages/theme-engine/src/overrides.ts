/**
 * Override Application (Stage 4)
 *
 * Applies the optional `overrides` section from .visor.yaml,
 * replacing derived token values with user-specified values.
 */

import type { SemanticTokens, SemanticTokenValue } from "./types.js";

/** Token category prefix → SemanticTokens key */
const TOKEN_CATEGORIES = [
  { prefix: "text-", key: "text" as const },
  { prefix: "surface-", key: "surface" as const },
  { prefix: "border-", key: "border" as const },
  { prefix: "interactive-", key: "interactive" as const },
  { prefix: "hairline-", key: "hairline" as const },
];

/**
 * Find which category and token name an override key maps to.
 * Override keys are CSS custom property names without `--` (e.g., "text-primary").
 *
 * VI-451 extensions:
 *   - Bare keys with no recognized prefix (e.g. `primary`, `accent`) match
 *     against the `intent` group, supporting the shadcn flat-namespace
 *     convention (`primary: "#..."` in YAML overrides).
 *   - Bare `hairline` maps to `hairline.default`; `hairline-strong` etc.
 *     use the standard prefix path.
 */
function findToken(
  key: string,
  tokens: SemanticTokens
): { group: Record<string, SemanticTokenValue>; name: string } | null {
  // Bare `hairline` → hairline.default
  if (key === "hairline" && "default" in tokens.hairline) {
    return { group: tokens.hairline, name: "default" };
  }

  for (const { prefix, key: groupKey } of TOKEN_CATEGORIES) {
    if (key.startsWith(prefix)) {
      const name = key.slice(prefix.length);
      if (name in tokens[groupKey]) {
        return { group: tokens[groupKey], name };
      }
    }
  }

  // Flat-namespace intent override (bare key, no prefix). Matched after
  // prefixed lookups so an existing `text-primary` doesn't get hijacked by
  // an `intent.primary` key.
  if (key in tokens.intent) {
    return { group: tokens.intent, name: key };
  }

  return null;
}

/**
 * Apply override values to semantic tokens.
 * Returns a new SemanticTokens with overrides applied (does not mutate input).
 */
export function applyOverrides(
  tokens: SemanticTokens,
  overrides?: { light?: Record<string, string>; dark?: Record<string, string> }
): SemanticTokens {
  if (!overrides) return tokens;

  // Deep clone to avoid mutation
  const result: SemanticTokens = {
    text: { ...tokens.text },
    surface: { ...tokens.surface },
    border: { ...tokens.border },
    interactive: { ...tokens.interactive },
    intent: { ...tokens.intent },
    hairline: { ...tokens.hairline },
  };

  // Clone individual token values
  for (const group of ["text", "surface", "border", "interactive", "intent", "hairline"] as const) {
    for (const [name, value] of Object.entries(result[group])) {
      result[group][name] = { ...value };
    }
  }

  // Apply light overrides
  if (overrides.light) {
    for (const [key, value] of Object.entries(overrides.light)) {
      const match = findToken(key, result);
      if (match) {
        match.group[match.name] = {
          ...match.group[match.name],
          light: value,
        };
      }
    }
  }

  // Apply dark overrides
  if (overrides.dark) {
    for (const [key, value] of Object.entries(overrides.dark)) {
      const match = findToken(key, result);
      if (match) {
        match.group[match.name] = {
          ...match.group[match.name],
          dark: value,
        };
      }
    }
  }

  return result;
}
