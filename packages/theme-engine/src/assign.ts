/**
 * Semantic Token Assignment (Stage 2)
 *
 * Takes generated primitives and resolved config, applies the semantic mapping table,
 * and produces concrete hex values for every semantic token in light and dark modes.
 */

import {
  SEMANTIC_MAP,
  CONFIG_BACKGROUND,
  CONFIG_SURFACE,
  CONFIG_DARK_BACKGROUND,
  CONFIG_DARK_SURFACE,
  INTERACTIVE_TEXT_BG_PAIRS,
  isShadeRef,
} from "./semantic-map.js";
import { parseColor, getLuminance } from "./color.js";
import type {
  GeneratedPrimitives,
  ResolvedThemeConfig,
  SemanticTokens,
  SemanticTokenValue,
  ShadeStep,
  ColorRole,
} from "./types.js";
import type { TokenRef, SemanticMapping } from "./semantic-map.js";

// ============================================================
// Resolution Helpers
// ============================================================

/** Look up a hex value from the generated primitives. */
function lookupShade(
  primitives: GeneratedPrimitives,
  role: ColorRole,
  shade: ShadeStep
): string {
  const scale = primitives[role];
  const value = (scale as Record<number, string>)[shade];
  if (!value) {
    throw new Error(
      `Missing shade ${shade} for role '${role}'. Status colors only have shades 50, 100, 500, 600, 700, 900.`
    );
  }
  return value;
}

/** Resolve a TokenRef to a concrete hex value. */
function resolveRef(
  ref: TokenRef,
  primitives: GeneratedPrimitives,
  config: ResolvedThemeConfig
): string {
  if (isShadeRef(ref)) {
    return lookupShade(primitives, ref.role, ref.shade);
  }

  // Constant refs: either literal hex or config-derived sentinels
  switch (ref.constant) {
    case CONFIG_BACKGROUND:
      return config.colors.background;
    case CONFIG_SURFACE:
      return config.colors.surface;
    case CONFIG_DARK_BACKGROUND:
      return (
        config["colors-dark"]?.background ??
        lookupShade(primitives, "neutral", 950)
      );
    case CONFIG_DARK_SURFACE:
      return (
        config["colors-dark"]?.surface ??
        lookupShade(primitives, "neutral", 900)
      );
    default:
      // Literal hex value (e.g., "#ffffff")
      return ref.constant;
  }
}

/**
 * VI-375: pick the theme's configured text color for a given interactive bg.
 * WCAG relative luminance threshold of 0.5 splits "light enough that near-black
 * reads best" from "dark enough that white reads best". Falls through to
 * text-on-dark on an unparseable bg (defensive; bg is always a resolved hex).
 */
export function pickTextForBg(bgValue: string, config: ResolvedThemeConfig): string {
  const parsed = parseColor(bgValue);
  const luminance = parsed ? getLuminance(...parsed.rgb) : 0;
  return luminance > 0.5
    ? config.typography["text-on-light"]
    : config.typography["text-on-dark"];
}

/**
 * VI-375: derive each interactive `*-text` token from the luminance of its
 * paired `*-bg`, per mode. Mutates `interactive` in place.
 *
 * The `skipTokens` set lets the post-override pass leave user-overridden text
 * tokens untouched (per-token override is the final escape hatch). The set is
 * empty at assignment time. The `mode` param scopes which side(s) to derive —
 * the post-override pass only re-derives the mode(s) whose bg was overridden.
 */
export function deriveInteractiveTextColors(
  interactive: Record<string, SemanticTokenValue>,
  config: ResolvedThemeConfig,
  opts: {
    skipTokens?: Set<string>;
    modes?: ReadonlyArray<"light" | "dark">;
  } = {}
): void {
  const skip = opts.skipTokens ?? new Set<string>();
  const modes = opts.modes ?? (["light", "dark"] as const);
  for (const [textToken, bgToken] of Object.entries(INTERACTIVE_TEXT_BG_PAIRS)) {
    if (skip.has(textToken)) continue;
    const textValue = interactive[textToken];
    const bgValue = interactive[bgToken];
    if (!textValue || !bgValue) continue;
    const next: SemanticTokenValue = { ...textValue };
    for (const mode of modes) {
      next[mode] = pickTextForBg(bgValue[mode], config);
    }
    interactive[textToken] = next;
  }
}

/**
 * VI-375 (Layer 3 fix): after `applyOverrides`, re-derive interactive `*-text`
 * tokens whose paired `*-bg` was overridden, so a brand-overridden button bg
 * (e.g. ENTR dark mint) auto-picks the readable text color. Returns a new
 * SemanticTokens with the `interactive` group updated; does not mutate input.
 *
 * Precedence: a per-token text override (e.g. `interactive-primary-text`) always
 * wins — those tokens are added to the skip set and left as the override set
 * them. Only the mode(s) whose bg was overridden are re-derived; an unchanged
 * mode keeps the value already derived at assignment time.
 */
export function reapplyInteractiveTextDerivation(
  tokens: SemanticTokens,
  config: ResolvedThemeConfig,
  overrides?: { light?: Record<string, string>; dark?: Record<string, string> }
): SemanticTokens {
  if (!overrides) return tokens;

  // Which text tokens did the user explicitly override (any mode)? Skip those.
  const skip = new Set<string>();
  // Which bg tokens were overridden, and in which modes?
  const bgOverriddenModes = new Map<string, Set<"light" | "dark">>();

  for (const mode of ["light", "dark"] as const) {
    const modeOverrides = overrides[mode];
    if (!modeOverrides) continue;
    for (const key of Object.keys(modeOverrides)) {
      if (!key.startsWith("interactive-")) continue;
      const tokenName = key.slice("interactive-".length);
      if (tokenName in INTERACTIVE_TEXT_BG_PAIRS) {
        skip.add(tokenName);
      }
      // Did this override target a paired bg token?
      for (const [textToken, bgToken] of Object.entries(INTERACTIVE_TEXT_BG_PAIRS)) {
        if (tokenName === bgToken) {
          if (!bgOverriddenModes.has(textToken)) {
            bgOverriddenModes.set(textToken, new Set());
          }
          bgOverriddenModes.get(textToken)!.add(mode);
        }
      }
    }
  }

  if (bgOverriddenModes.size === 0) return tokens;

  // Clone the interactive group (shallow per-token clone) before re-deriving.
  const interactive: Record<string, SemanticTokenValue> = {};
  for (const [name, value] of Object.entries(tokens.interactive)) {
    interactive[name] = { ...value };
  }

  for (const [textToken, modes] of bgOverriddenModes) {
    if (skip.has(textToken)) continue;
    deriveInteractiveTextColors(interactive, config, {
      // Re-derive only this token by skipping the others.
      skipTokens: new Set(
        Object.keys(INTERACTIVE_TEXT_BG_PAIRS).filter((t) => t !== textToken)
      ),
      modes: [...modes],
    });
  }

  return { ...tokens, interactive };
}

/** Resolve a single mapping entry to a SemanticTokenValue. */
function resolveMapping(
  mapping: SemanticMapping,
  lightPrimitives: GeneratedPrimitives,
  darkPrimitives: GeneratedPrimitives,
  config: ResolvedThemeConfig
): SemanticTokenValue {
  return {
    light: resolveRef(mapping.light, lightPrimitives, config),
    dark: resolveRef(mapping.dark, darkPrimitives, config),
  };
}

// ============================================================
// Main Assignment
// ============================================================

/**
 * Assign semantic tokens from mode-specific shade scales and resolved config.
 * lightPrimitives drives light-mode token values; darkPrimitives drives dark-mode
 * values — allowing themes with colors-dark overrides to produce correct dark
 * semantic tokens (e.g. surface-accent-default uses the dark brand color).
 */
export function assignSemanticTokens(
  lightPrimitives: GeneratedPrimitives,
  darkPrimitives: GeneratedPrimitives,
  config: ResolvedThemeConfig
): SemanticTokens {
  const text: Record<string, SemanticTokenValue> = {};
  const surface: Record<string, SemanticTokenValue> = {};
  const border: Record<string, SemanticTokenValue> = {};
  const interactive: Record<string, SemanticTokenValue> = {};
  const intent: Record<string, SemanticTokenValue> = {};
  const hairline: Record<string, SemanticTokenValue> = {};

  for (const [name, mapping] of Object.entries(SEMANTIC_MAP.text)) {
    text[name] = resolveMapping(mapping, lightPrimitives, darkPrimitives, config);
  }

  for (const [name, mapping] of Object.entries(SEMANTIC_MAP.surface)) {
    surface[name] = resolveMapping(mapping, lightPrimitives, darkPrimitives, config);
  }

  for (const [name, mapping] of Object.entries(SEMANTIC_MAP.border)) {
    border[name] = resolveMapping(mapping, lightPrimitives, darkPrimitives, config);
  }

  for (const [name, mapping] of Object.entries(SEMANTIC_MAP.interactive)) {
    interactive[name] = resolveMapping(mapping, lightPrimitives, darkPrimitives, config);
  }
  // VI-375: second pass — resolve `*-text` derive-on-bg sentinels against the
  // now-resolved paired `*-bg` values (e.g. primary-text picks text-on-light vs
  // text-on-dark from primary-bg luminance). A later post-override pass
  // re-derives any pair whose `*-bg` was overridden (Layer 3 fix).
  deriveInteractiveTextColors(interactive, config);

  for (const [name, mapping] of Object.entries(SEMANTIC_MAP.intent)) {
    intent[name] = resolveMapping(mapping, lightPrimitives, darkPrimitives, config);
  }

  for (const [name, mapping] of Object.entries(SEMANTIC_MAP.hairline)) {
    hairline[name] = resolveMapping(mapping, lightPrimitives, darkPrimitives, config);
  }

  return { text, surface, border, interactive, intent, hairline };
}
