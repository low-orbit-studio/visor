/**
 * Token Validation Script
 *
 * Validates the token system for correctness:
 * - All semantic tokens reference valid primitive token names
 * - All adaptive tokens reference valid primitive token names
 * - All adaptive tokens have both light and dark values
 * - No broken references
 */

import {
  primitiveColors,
  primitiveSpacing,
  primitiveRadius,
  primitiveBorderWidths,
  primitiveFontSizes,
  primitiveFontWeights,
  primitiveLineHeights,
  primitiveShadows,
  primitiveZIndex,
  primitiveFontFamilies,
  primitiveOverlay,
  primitiveFocusRing,
  primitiveMotionDurations,
  primitiveMotionEasings,
} from "../tokens/primitives.js";

import {
  semanticText,
  semanticSurface,
  semanticBorder,
  semanticInteractive,
  semanticSpacing,
  semanticTypography,
  semanticOverlay,
  semanticFocusRing,
  semanticMotionDuration,
  semanticMotionEasing,
} from "../tokens/semantic.js";

import {
  adaptiveText,
  adaptiveSurface,
  adaptiveBorder,
} from "../tokens/adaptive.js";

interface ValidationError {
  location: string;
  message: string;
}

// ============================================================
// Build lookup sets for all valid primitive token names
// ============================================================

function buildPrimitiveLookup(): Set<string> {
  const valid = new Set<string>();

  for (const name of Object.keys(primitiveColors)) {
    valid.add(`color-${name}`);
  }
  for (const name of Object.keys(primitiveSpacing)) {
    valid.add(`spacing-${name}`);
  }
  for (const name of Object.keys(primitiveRadius)) {
    valid.add(`radius-${name}`);
  }
  for (const name of Object.keys(primitiveBorderWidths)) {
    valid.add(`border-width-${name}`);
  }
  for (const name of Object.keys(primitiveFontFamilies)) {
    valid.add(`font-${name}`);
  }
  for (const name of Object.keys(primitiveFontSizes)) {
    valid.add(`font-size-${name}`);
  }
  for (const name of Object.keys(primitiveFontWeights)) {
    valid.add(`font-weight-${name}`);
  }
  for (const name of Object.keys(primitiveLineHeights)) {
    valid.add(`line-height-${name}`);
  }
  for (const name of Object.keys(primitiveShadows)) {
    valid.add(`shadow-${name}`);
  }
  for (const name of Object.keys(primitiveZIndex)) {
    valid.add(`z-${name}`);
  }
  for (const name of Object.keys(primitiveOverlay)) {
    valid.add(`overlay-${name}`);
  }
  for (const name of Object.keys(primitiveFocusRing)) {
    valid.add(`focus-ring-${name}`);
  }
  for (const name of Object.keys(primitiveMotionDurations)) {
    valid.add(`motion-duration-${name}`);
  }
  for (const name of Object.keys(primitiveMotionEasings)) {
    valid.add(`motion-easing-${name}`);
  }

  return valid;
}

// ============================================================
// Validators
// ============================================================

function validateSemanticTokens(
  primitives: Set<string>
): ValidationError[] {
  const errors: ValidationError[] = [];

  const groups: Array<{
    groupName: string;
    prefix: string;
    tokens: Record<string, string>;
  }> = [
    { groupName: "semanticText", prefix: "text", tokens: semanticText as Record<string, string> },
    { groupName: "semanticSurface", prefix: "surface", tokens: semanticSurface as Record<string, string> },
    { groupName: "semanticBorder", prefix: "border", tokens: semanticBorder as Record<string, string> },
    { groupName: "semanticInteractive", prefix: "interactive", tokens: semanticInteractive as Record<string, string> },
  ];

  for (const { groupName, prefix, tokens } of groups) {
    for (const [name, ref] of Object.entries(tokens)) {
      if (!primitives.has(ref)) {
        errors.push({
          location: `${groupName}.${name}`,
          message: `--${prefix}-${name} references unknown primitive: "${ref}" (expected --${ref} to exist)`,
        });
      }
    }
  }

  // Semantic spacing references spacing primitives
  for (const [name, ref] of Object.entries(semanticSpacing)) {
    if (!primitives.has(ref)) {
      errors.push({
        location: `semanticSpacing.${name}`,
        message: `--${name} references unknown primitive: "${ref}"`,
      });
    }
  }

  // Semantic typography references font primitives
  for (const [name, ref] of Object.entries(semanticTypography)) {
    if (!primitives.has(ref)) {
      errors.push({
        location: `semanticTypography.${name}`,
        message: `--${name} references unknown primitive: "${ref}"`,
      });
    }
  }

  // Semantic overlay references overlay primitives
  for (const [name, ref] of Object.entries(semanticOverlay)) {
    if (!primitives.has(ref)) {
      errors.push({
        location: `semanticOverlay.${name}`,
        message: `--overlay-${name} references unknown primitive: "${ref}"`,
      });
    }
  }

  // Semantic focus ring references focus ring primitives
  for (const [name, ref] of Object.entries(semanticFocusRing)) {
    if (!primitives.has(ref)) {
      errors.push({
        location: `semanticFocusRing.${name}`,
        message: `--focus-ring-${name} references unknown primitive: "${ref}"`,
      });
    }
  }

  // Semantic motion duration references motion duration primitives
  for (const [name, ref] of Object.entries(semanticMotionDuration)) {
    if (!primitives.has(ref)) {
      errors.push({
        location: `semanticMotionDuration.${name}`,
        message: `--motion-duration-${name} references unknown primitive: "${ref}"`,
      });
    }
  }

  // Semantic motion easing references motion easing primitives
  for (const [name, ref] of Object.entries(semanticMotionEasing)) {
    if (!primitives.has(ref)) {
      errors.push({
        location: `semanticMotionEasing.${name}`,
        message: `--motion-easing-${name} references unknown primitive: "${ref}"`,
      });
    }
  }

  return errors;
}

function validateAdaptiveTokens(
  primitives: Set<string>
): ValidationError[] {
  const errors: ValidationError[] = [];

  const groups: Array<{
    groupName: string;
    tokens: Record<string, { light: string; dark: string }>;
  }> = [
    { groupName: "adaptiveText", tokens: adaptiveText },
    { groupName: "adaptiveSurface", tokens: adaptiveSurface },
    { groupName: "adaptiveBorder", tokens: adaptiveBorder },
  ];

  for (const { groupName, tokens } of groups) {
    for (const [name, values] of Object.entries(tokens)) {
      // Check both light and dark exist
      if (!values.light) {
        errors.push({
          location: `${groupName}.${name}`,
          message: `Missing light theme value`,
        });
      }
      if (!values.dark) {
        errors.push({
          location: `${groupName}.${name}`,
          message: `Missing dark theme value`,
        });
      }

      // Validate references
      if (values.light && !primitives.has(values.light)) {
        errors.push({
          location: `${groupName}.${name}.light`,
          message: `References unknown primitive: "${values.light}"`,
        });
      }
      if (values.dark && !primitives.has(values.dark)) {
        errors.push({
          location: `${groupName}.${name}.dark`,
          message: `References unknown primitive: "${values.dark}"`,
        });
      }
    }
  }

  return errors;
}

// ============================================================
// Main
// ============================================================

function main(): void {
  console.log("Validating Visor design tokens...\n");

  const primitives = buildPrimitiveLookup();
  const errors: ValidationError[] = [];

  // Validate semantic tokens
  const semanticErrors = validateSemanticTokens(primitives);
  errors.push(...semanticErrors);

  // Validate adaptive tokens
  const adaptiveErrors = validateAdaptiveTokens(primitives);
  errors.push(...adaptiveErrors);

  // Report results
  if (errors.length === 0) {
    console.log("✓ All tokens are valid\n");
    console.log(`  Primitives registered: ${primitives.size}`);
    console.log(`  Semantic groups validated: 10`);
    console.log(`  Adaptive groups validated: 3`);
    process.exit(0);
  } else {
    console.error(`✗ Found ${errors.length} validation error(s):\n`);
    for (const error of errors) {
      console.error(`  [${error.location}] ${error.message}`);
    }
    console.error("");
    process.exit(1);
  }
}

main();
