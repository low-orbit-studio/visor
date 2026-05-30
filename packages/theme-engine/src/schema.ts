/**
 * JSON Schema & Validation
 *
 * Exports the .visor.yaml JSON Schema and a lightweight validation function.
 * No external validation library — keeps the bundle small for browser use.
 */

import visorThemeSchema from "./visor-theme.schema.json";
import { isValidHex, isValidColor } from "./color.js";
import { MATERIAL_TEXT_SLOTS } from "./types.js";
import type { VisorThemeConfig } from "./types.js";

export { visorThemeSchema };

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ============================================================
// Known Keys — mirrors the JSON Schema structure
// ============================================================

const KNOWN_TOP_LEVEL_KEYS = new Set([
  "name", "version", "group", "label", "default-mode", "colors", "colors-dark", "typography",
  "brand", "spacing", "radius", "shadows", "strokeWidths", "motion", "overrides",
]);

const KNOWN_COLOR_KEYS = new Set([
  "primary", "accent", "neutral", "background", "surface",
  "success", "warning", "error", "info",
]);

const KNOWN_TYPOGRAPHY_KEYS = new Set([
  "heading", "display", "body", "mono", "letter-spacing", "scale", "slots", "cdn-overrides",
]);

const KNOWN_CDN_OVERRIDE_KEYS = new Set(["visor-fonts"]);

const KNOWN_TYPOGRAPHY_FONT_KEYS = new Set(["family", "weight", "weights", "source", "org"]);
const KNOWN_TYPOGRAPHY_MONO_KEYS = new Set(["family", "weight", "weights", "source", "org"]);
const KNOWN_LETTER_SPACING_KEYS = new Set(["tight", "normal", "wide"]);
const KNOWN_SLOT_NAMES = new Set<string>(MATERIAL_TEXT_SLOTS);
const KNOWN_SLOT_OVERRIDE_KEYS = new Set(["size", "weight", "letter-spacing"]);

const KNOWN_SPACING_KEYS = new Set(["base"]);
const KNOWN_RADIUS_KEYS = new Set(["sm", "md", "lg", "xl", "pill"]);
const KNOWN_SHADOW_KEYS = new Set(["xs", "sm", "md", "lg", "xl"]);
const KNOWN_STROKE_WIDTH_KEYS = new Set(["thin", "regular", "medium", "thick"]);
// VI-451 (drive-by): allow `easing-overshoot` as a tier-2 motion field for
// themes that opt into bouncy entrances (e.g. marker
// pops). Engine emits `--motion-easing-overshoot` when present; absent themes
// fall through to the existing `--motion-easing-spring` default. The CLI
// design-check rule still flags bouncy easings in component CSS — this is
// only a schema unblock so the theme YAML validates.
const KNOWN_MOTION_KEYS = new Set(["duration-fast", "duration-normal", "duration-slow", "easing", "easing-overshoot"]);
const KNOWN_OVERRIDES_KEYS = new Set(["light", "dark"]);

// VI-470: brand block. Shared org/source/cdn-overrides defaults plus the
// standard variant slots and an optional `custom` map of operator-defined slots.
const KNOWN_BRAND_KEYS = new Set([
  "org", "source", "cdn-overrides", "logo", "brandmark", "wordmark", "monochrome", "favicon", "animated", "custom",
]);
const KNOWN_BRAND_STANDARD_SLOTS = ["logo", "brandmark", "wordmark", "monochrome", "favicon", "animated"] as const;
const KNOWN_BRAND_SLOT_KEYS = new Set(["slug", "formats", "light", "dark", "clearSpace", "aspectRatio"]);
const KNOWN_BRAND_SOURCES = new Set(["visor-brands", "local"]);
const KNOWN_BRAND_CDN_OVERRIDE_KEYS = new Set(["visor-brands"]);

/**
 * Check for unknown keys at every nesting level.
 * Catches typos like `colour` instead of `colors`.
 */
function checkUnknownKeys(obj: Record<string, unknown>, errors: string[]): void {
  // Top-level
  for (const key of Object.keys(obj)) {
    if (!KNOWN_TOP_LEVEL_KEYS.has(key)) {
      errors.push(`Unknown top-level key '${key}'. Valid keys: ${[...KNOWN_TOP_LEVEL_KEYS].join(", ")}`);
    }
  }

  // colors
  if (typeof obj.colors === "object" && obj.colors !== null) {
    for (const key of Object.keys(obj.colors as Record<string, unknown>)) {
      if (!KNOWN_COLOR_KEYS.has(key)) {
        errors.push(`Unknown key 'colors.${key}'. Valid keys: ${[...KNOWN_COLOR_KEYS].join(", ")}`);
      }
    }
  }

  // colors-dark
  if (typeof obj["colors-dark"] === "object" && obj["colors-dark"] !== null) {
    for (const key of Object.keys(obj["colors-dark"] as Record<string, unknown>)) {
      if (!KNOWN_COLOR_KEYS.has(key)) {
        errors.push(`Unknown key 'colors-dark.${key}'. Valid keys: ${[...KNOWN_COLOR_KEYS].join(", ")}`);
      }
    }
  }

  // typography
  if (typeof obj.typography === "object" && obj.typography !== null) {
    const typo = obj.typography as Record<string, unknown>;
    for (const key of Object.keys(typo)) {
      if (!KNOWN_TYPOGRAPHY_KEYS.has(key)) {
        errors.push(`Unknown key 'typography.${key}'. Valid keys: ${[...KNOWN_TYPOGRAPHY_KEYS].join(", ")}`);
      }
    }
    // typography.heading
    if (typeof typo.heading === "object" && typo.heading !== null) {
      for (const key of Object.keys(typo.heading as Record<string, unknown>)) {
        if (!KNOWN_TYPOGRAPHY_FONT_KEYS.has(key)) {
          errors.push(`Unknown key 'typography.heading.${key}'. Valid keys: ${[...KNOWN_TYPOGRAPHY_FONT_KEYS].join(", ")}`);
        }
      }
    }
    // typography.display
    if (typeof typo.display === "object" && typo.display !== null) {
      for (const key of Object.keys(typo.display as Record<string, unknown>)) {
        if (!KNOWN_TYPOGRAPHY_FONT_KEYS.has(key)) {
          errors.push(`Unknown key 'typography.display.${key}'. Valid keys: ${[...KNOWN_TYPOGRAPHY_FONT_KEYS].join(", ")}`);
        }
      }
    }
    // typography.body
    if (typeof typo.body === "object" && typo.body !== null) {
      for (const key of Object.keys(typo.body as Record<string, unknown>)) {
        if (!KNOWN_TYPOGRAPHY_FONT_KEYS.has(key)) {
          errors.push(`Unknown key 'typography.body.${key}'. Valid keys: ${[...KNOWN_TYPOGRAPHY_FONT_KEYS].join(", ")}`);
        }
      }
    }
    // typography.mono
    if (typeof typo.mono === "object" && typo.mono !== null) {
      for (const key of Object.keys(typo.mono as Record<string, unknown>)) {
        if (!KNOWN_TYPOGRAPHY_MONO_KEYS.has(key)) {
          errors.push(`Unknown key 'typography.mono.${key}'. Valid keys: ${[...KNOWN_TYPOGRAPHY_MONO_KEYS].join(", ")}`);
        }
      }
    }
    // typography.cdn-overrides
    if (typeof typo["cdn-overrides"] === "object" && typo["cdn-overrides"] !== null) {
      for (const key of Object.keys(typo["cdn-overrides"] as Record<string, unknown>)) {
        if (!KNOWN_CDN_OVERRIDE_KEYS.has(key)) {
          errors.push(`Unknown key 'typography.cdn-overrides.${key}'. Valid keys: ${[...KNOWN_CDN_OVERRIDE_KEYS].join(", ")}`);
        }
      }
    }
    // typography.letter-spacing
    if (typeof typo["letter-spacing"] === "object" && typo["letter-spacing"] !== null) {
      for (const key of Object.keys(typo["letter-spacing"] as Record<string, unknown>)) {
        if (!KNOWN_LETTER_SPACING_KEYS.has(key)) {
          errors.push(`Unknown key 'typography.letter-spacing.${key}'. Valid keys: ${[...KNOWN_LETTER_SPACING_KEYS].join(", ")}`);
        }
      }
    }
    // typography.slots — Material-slot-keyed overrides for the generated TextTheme
    if (typeof typo.slots === "object" && typo.slots !== null) {
      const slots = typo.slots as Record<string, unknown>;
      for (const slotName of Object.keys(slots)) {
        if (!KNOWN_SLOT_NAMES.has(slotName)) {
          errors.push(
            `Unknown key 'typography.slots.${slotName}'. Valid keys: ${[...MATERIAL_TEXT_SLOTS].join(", ")}`,
          );
          continue;
        }
        const override = slots[slotName];
        if (typeof override !== "object" || override === null) {
          errors.push(
            `'typography.slots.${slotName}' must be an object with optional size/weight/letter-spacing fields`,
          );
          continue;
        }
        for (const key of Object.keys(override as Record<string, unknown>)) {
          if (!KNOWN_SLOT_OVERRIDE_KEYS.has(key)) {
            errors.push(
              `Unknown key 'typography.slots.${slotName}.${key}'. Valid keys: ${[...KNOWN_SLOT_OVERRIDE_KEYS].join(", ")}`,
            );
          }
        }
      }
    }
  }

  // brand (VI-470)
  if (typeof obj.brand === "object" && obj.brand !== null) {
    const brand = obj.brand as Record<string, unknown>;
    for (const key of Object.keys(brand)) {
      if (!KNOWN_BRAND_KEYS.has(key)) {
        errors.push(`Unknown key 'brand.${key}'. Valid keys: ${[...KNOWN_BRAND_KEYS].join(", ")}`);
      }
    }
    // brand.cdn-overrides
    if (typeof brand["cdn-overrides"] === "object" && brand["cdn-overrides"] !== null) {
      for (const key of Object.keys(brand["cdn-overrides"] as Record<string, unknown>)) {
        if (!KNOWN_BRAND_CDN_OVERRIDE_KEYS.has(key)) {
          errors.push(`Unknown key 'brand.cdn-overrides.${key}'. Valid keys: ${[...KNOWN_BRAND_CDN_OVERRIDE_KEYS].join(", ")}`);
        }
      }
    }
    // standard slots
    for (const slot of KNOWN_BRAND_STANDARD_SLOTS) {
      const slotObj = brand[slot];
      if (typeof slotObj === "object" && slotObj !== null) {
        for (const key of Object.keys(slotObj as Record<string, unknown>)) {
          if (!KNOWN_BRAND_SLOT_KEYS.has(key)) {
            errors.push(`Unknown key 'brand.${slot}.${key}'. Valid keys: ${[...KNOWN_BRAND_SLOT_KEYS].join(", ")}`);
          }
        }
      }
    }
    // custom slots
    if (typeof brand.custom === "object" && brand.custom !== null) {
      const custom = brand.custom as Record<string, unknown>;
      for (const slotName of Object.keys(custom)) {
        const slotObj = custom[slotName];
        if (typeof slotObj !== "object" || slotObj === null) {
          errors.push(`'brand.custom.${slotName}' must be an object with optional slug/formats/light/dark/clearSpace/aspectRatio fields`);
          continue;
        }
        for (const key of Object.keys(slotObj as Record<string, unknown>)) {
          if (!KNOWN_BRAND_SLOT_KEYS.has(key)) {
            errors.push(`Unknown key 'brand.custom.${slotName}.${key}'. Valid keys: ${[...KNOWN_BRAND_SLOT_KEYS].join(", ")}`);
          }
        }
      }
    }
  }

  // spacing
  if (typeof obj.spacing === "object" && obj.spacing !== null) {
    for (const key of Object.keys(obj.spacing as Record<string, unknown>)) {
      if (!KNOWN_SPACING_KEYS.has(key)) {
        errors.push(`Unknown key 'spacing.${key}'. Valid keys: ${[...KNOWN_SPACING_KEYS].join(", ")}`);
      }
    }
  }

  // radius
  if (typeof obj.radius === "object" && obj.radius !== null) {
    for (const key of Object.keys(obj.radius as Record<string, unknown>)) {
      if (!KNOWN_RADIUS_KEYS.has(key)) {
        errors.push(`Unknown key 'radius.${key}'. Valid keys: ${[...KNOWN_RADIUS_KEYS].join(", ")}`);
      }
    }
  }

  // shadows
  if (typeof obj.shadows === "object" && obj.shadows !== null) {
    for (const key of Object.keys(obj.shadows as Record<string, unknown>)) {
      if (!KNOWN_SHADOW_KEYS.has(key)) {
        errors.push(`Unknown key 'shadows.${key}'. Valid keys: ${[...KNOWN_SHADOW_KEYS].join(", ")}`);
      }
    }
  }

  // strokeWidths
  if (typeof obj.strokeWidths === "object" && obj.strokeWidths !== null) {
    for (const key of Object.keys(obj.strokeWidths as Record<string, unknown>)) {
      if (!KNOWN_STROKE_WIDTH_KEYS.has(key)) {
        errors.push(`Unknown key 'strokeWidths.${key}'. Valid keys: ${[...KNOWN_STROKE_WIDTH_KEYS].join(", ")}`);
      }
    }
  }

  // motion
  if (typeof obj.motion === "object" && obj.motion !== null) {
    for (const key of Object.keys(obj.motion as Record<string, unknown>)) {
      if (!KNOWN_MOTION_KEYS.has(key)) {
        errors.push(`Unknown key 'motion.${key}'. Valid keys: ${[...KNOWN_MOTION_KEYS].join(", ")}`);
      }
    }
  }

  // overrides
  if (typeof obj.overrides === "object" && obj.overrides !== null) {
    for (const key of Object.keys(obj.overrides as Record<string, unknown>)) {
      if (!KNOWN_OVERRIDES_KEYS.has(key)) {
        errors.push(`Unknown key 'overrides.${key}'. Valid keys: ${[...KNOWN_OVERRIDES_KEYS].join(", ")}`);
      }
    }
  }
}

/**
 * Lightweight structural validation for a .visor.yaml config object.
 * Checks required fields, types, and hex color format.
 * For full JSON Schema validation, use the exported schema with ajv or similar.
 */
export function validateConfig(config: unknown): ValidationResult {
  const errors: string[] = [];

  if (typeof config !== "object" || config === null) {
    return { valid: false, errors: ["Config must be an object"] };
  }

  const obj = config as Record<string, unknown>;

  // Unknown key rejection (catches typos like `colour` instead of `colors`)
  checkUnknownKeys(obj, errors);

  // Required fields
  if (typeof obj.name !== "string" || obj.name.length === 0) {
    errors.push("'name' is required and must be a non-empty string");
  }

  if (obj.version !== 1) {
    errors.push("'version' must be 1");
  }

  // Colors
  if (obj.label !== undefined && typeof obj.label !== "string") {
    errors.push("'label' must be a string (optional display name override)");
  }

  if (obj["default-mode"] !== undefined) {
    const mode = obj["default-mode"];
    if (mode !== "dark" && mode !== "light") {
      errors.push("'default-mode' must be either 'dark' or 'light'");
    }
  }

  if (typeof obj.colors !== "object" || obj.colors === null) {
    errors.push("'colors' is required and must be an object");
    return { valid: false, errors };
  }

  const colors = obj.colors as Record<string, unknown>;

  if (typeof colors.primary !== "string" || !isValidColor(colors.primary)) {
    errors.push("'colors.primary' is required and must be a valid CSS color (hex, rgba, hsla, or oklch)");
  }

  // Validate optional color fields
  const optionalColorFields = [
    "accent",
    "neutral",
    "background",
    "surface",
    "success",
    "warning",
    "error",
    "info",
  ];

  for (const field of optionalColorFields) {
    if (colors[field] !== undefined) {
      if (typeof colors[field] !== "string" || !isValidColor(colors[field] as string)) {
        errors.push(`'colors.${field}' must be a valid CSS color (hex, rgba, hsla, or oklch)`);
      }
    }
  }

  // Validate colors-dark if present
  if (obj["colors-dark"] !== undefined) {
    if (typeof obj["colors-dark"] !== "object" || obj["colors-dark"] === null) {
      errors.push("'colors-dark' must be an object");
    } else {
      const darkColors = obj["colors-dark"] as Record<string, unknown>;
      const allColorFields = ["primary", ...optionalColorFields];
      for (const field of allColorFields) {
        if (darkColors[field] !== undefined) {
          if (
            typeof darkColors[field] !== "string" ||
            !isValidColor(darkColors[field] as string)
          ) {
            errors.push(`'colors-dark.${field}' must be a valid CSS color (hex, rgba, hsla, or oklch)`);
          }
        }
      }
    }
  }

  // Validate motion duration patterns
  if (obj.motion && typeof obj.motion === "object") {
    const motion = obj.motion as Record<string, unknown>;
    for (const key of ["duration-fast", "duration-normal", "duration-slow"]) {
      if (motion[key] !== undefined) {
        if (
          typeof motion[key] !== "string" ||
          !/^\d+ms$/.test(motion[key] as string)
        ) {
          errors.push(`'motion.${key}' must match pattern "Nms" (e.g., "200ms")`);
        }
      }
    }
  }

  // Validate typography font source/org cross-field constraints
  if (typeof obj.typography === "object" && obj.typography !== null) {
    const typo = obj.typography as Record<string, unknown>;
    // When a theme declares `cdn-overrides.visor-fonts`, the override CDN
    // typically already encodes a project namespace (e.g.,
    // fonts.knowmentum.ai already implies "knowmentum"), so the per-slot
    // `org` segment may be omitted (empty string). Without an override,
    // org remains required so default visor-fonts URLs stay well-formed.
    const cdnOverrides = typo["cdn-overrides"] as Record<string, unknown> | undefined;
    const visorFontsOverride = cdnOverrides?.["visor-fonts"];
    if (visorFontsOverride !== undefined && typeof visorFontsOverride !== "string") {
      errors.push(`'typography.cdn-overrides.visor-fonts' must be a string URL`);
    }
    if (typeof visorFontsOverride === "string" && visorFontsOverride.length === 0) {
      errors.push(`'typography.cdn-overrides.visor-fonts' must not be empty`);
    }
    const orgOptional = typeof visorFontsOverride === "string" && visorFontsOverride.length > 0;
    for (const slot of ["heading", "display", "body"]) {
      const font = typo[slot] as Record<string, unknown> | undefined;
      if (font && font.source === "visor-fonts" && !orgOptional && !font.org) {
        errors.push(`'typography.${slot}.org' is required when source is 'visor-fonts' (unless typography.cdn-overrides.visor-fonts is set)`);
      }
      if (font && font.weights !== undefined) {
        if (
          !Array.isArray(font.weights) ||
          !(font.weights as unknown[]).every((w) => typeof w === "number" && w > 0)
        ) {
          errors.push(`'typography.${slot}.weights' must be an array of positive numbers (e.g., [300, 500])`);
        }
      }
    }

    // Validate typography.slots.<slot> override values
    if (typeof typo.slots === "object" && typo.slots !== null) {
      const slots = typo.slots as Record<string, unknown>;
      for (const slotName of Object.keys(slots)) {
        const override = slots[slotName];
        if (typeof override !== "object" || override === null) continue;
        const o = override as Record<string, unknown>;
        if (o.size !== undefined && (typeof o.size !== "number" || o.size <= 0)) {
          errors.push(`'typography.slots.${slotName}.size' must be a positive number (logical pixels)`);
        }
        if (
          o.weight !== undefined &&
          (typeof o.weight !== "number" || o.weight < 100 || o.weight > 900)
        ) {
          errors.push(`'typography.slots.${slotName}.weight' must be between 100 and 900`);
        }
        if (
          o["letter-spacing"] !== undefined &&
          typeof o["letter-spacing"] !== "number"
        ) {
          errors.push(`'typography.slots.${slotName}.letter-spacing' must be a number (Flutter logical pixels)`);
        }
      }
    }
  }

  // Validate brand block (VI-470)
  if (obj.brand !== undefined) {
    if (typeof obj.brand !== "object" || obj.brand === null) {
      errors.push("'brand' must be an object");
    } else {
      const brand = obj.brand as Record<string, unknown>;
      // source enum
      if (brand.source !== undefined && !KNOWN_BRAND_SOURCES.has(brand.source as string)) {
        errors.push(`'brand.source' must be one of: ${[...KNOWN_BRAND_SOURCES].join(", ")}`);
      }
      // cdn-overrides.visor-brands must be a non-empty string URL when present
      const brandCdn = brand["cdn-overrides"] as Record<string, unknown> | undefined;
      const visorBrandsOverride = brandCdn?.["visor-brands"];
      if (visorBrandsOverride !== undefined && typeof visorBrandsOverride !== "string") {
        errors.push("'brand.cdn-overrides.visor-brands' must be a string URL");
      }
      if (typeof visorBrandsOverride === "string" && visorBrandsOverride.length === 0) {
        errors.push("'brand.cdn-overrides.visor-brands' must not be empty");
      }
      // org is required when source is visor-brands (unless a cdn-override base
      // already encodes the namespace) — mirrors the typography visor-fonts rule.
      const orgOptional = typeof visorBrandsOverride === "string" && visorBrandsOverride.length > 0;
      if (brand.source === "visor-brands" && !orgOptional && !brand.org) {
        errors.push("'brand.org' is required when brand.source is 'visor-brands' (unless brand.cdn-overrides.visor-brands is set)");
      }
      // per-slot field types (formats must be a string array when present)
      const allSlots: Record<string, unknown>[] = [];
      for (const slot of KNOWN_BRAND_STANDARD_SLOTS) {
        if (typeof brand[slot] === "object" && brand[slot] !== null) {
          allSlots.push(brand[slot] as Record<string, unknown>);
        }
      }
      if (typeof brand.custom === "object" && brand.custom !== null) {
        for (const slot of Object.values(brand.custom as Record<string, unknown>)) {
          if (typeof slot === "object" && slot !== null) allSlots.push(slot as Record<string, unknown>);
        }
      }
      for (const slot of allSlots) {
        if (slot.formats !== undefined) {
          if (!Array.isArray(slot.formats) || !(slot.formats as unknown[]).every((f) => typeof f === "string")) {
            errors.push("'brand.<slot>.formats' must be an array of format strings (e.g., [\"svg\", \"png\"])");
          }
        }
      }
      // animated is SVG-only (D3): an animated brand asset must be a
      // self-contained animated SVG — it animates inside <img>, which raster
      // formats cannot do. Reject any non-svg format or explicit non-.svg path.
      if (typeof brand.animated === "object" && brand.animated !== null) {
        const animated = brand.animated as Record<string, unknown>;
        if (
          Array.isArray(animated.formats) &&
          !(animated.formats as unknown[]).every(
            (f) => typeof f === "string" && f.toLowerCase() === "svg",
          )
        ) {
          errors.push("'brand.animated.formats' must be SVG-only (the animated slot accepts self-contained animated SVGs only)");
        }
        for (const mode of ["light", "dark"] as const) {
          const p = animated[mode];
          if (typeof p === "string" && !p.toLowerCase().endsWith(".svg")) {
            errors.push(`'brand.animated.${mode}' must be an .svg path (the animated slot is SVG-only)`);
          }
        }
      }
    }
  }

  // Validate overrides
  if (obj.overrides !== undefined) {
    if (typeof obj.overrides !== "object" || obj.overrides === null) {
      errors.push("'overrides' must be an object");
    } else {
      const overrides = obj.overrides as Record<string, unknown>;
      for (const mode of ["light", "dark"]) {
        if (overrides[mode] !== undefined) {
          if (typeof overrides[mode] !== "object" || overrides[mode] === null) {
            errors.push(`'overrides.${mode}' must be an object`);
          }
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Type guard that validates and narrows an unknown config to VisorThemeConfig.
 */
export function isVisorThemeConfig(
  config: unknown
): config is VisorThemeConfig {
  return validateConfig(config).valid;
}
