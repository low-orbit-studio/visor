/**
 * VI-346: Text-scale AA-by-default regression tests.
 *
 * SEMANTIC_TEXT_MAP was rebalanced to use fixed-L shades for text-secondary
 * (700/300) and text-tertiary (600/400) so derived text values clear WCAG AA
 * (4.5:1) against canonical light/dark backgrounds for any reasonable input
 * neutral. These tests pin that invariant so future map edits can't regress it.
 */

import { generateThemeFromConfig } from "../pipeline.js";
import { generateShadeScale } from "../shades.js";
import { getContrastRatio } from "../color.js";
import type { VisorThemeConfig } from "../types.js";

const AA_RATIO = 4.5;

/**
 * Reasonable input neutrals — span the realistic range used by Visor stock
 * themes (mid-L Tailwind-Zinc / Gray / Slate-class neutrals). Excludes
 * always-dark themes (blackout, borderless) whose input neutrals are
 * intentionally outside the fixed-L invariant.
 */
const REASONABLE_NEUTRALS = [
  { name: "neutral.visor (#71717a / Zinc)", hex: "#71717a" },
  { name: "modern-minimal (#6B7280 / Gray)", hex: "#6B7280" },
  { name: "Slate-class (#7A8285)", hex: "#7A8285" },
];

/** Canonical light-mode backgrounds used by stock themes. */
const LIGHT_BACKGROUNDS = ["#ffffff", "#FFFFFF", "#fafafa"];

/**
 * Canonical dark-mode backgrounds used by stock themes — near-black page
 * and near-black surface (#0a0a0a-class).
 */
const DARK_BACKGROUNDS = ["#000000", "#09090b", "#0a0a0a", "#18181b"];

function buildConfig(neutralHex: string): VisorThemeConfig {
  return {
    name: "AA Test",
    version: 1,
    colors: {
      primary: "#2563EB",
      neutral: neutralHex,
    },
    "colors-dark": {
      background: "#09090b",
      surface: "#18181b",
    },
  };
}

/**
 * Resolve the derived text token hex for a given neutral input and shade.
 * Uses the same shade generator the pipeline uses, so this matches the
 * value emitted into CSS by SEMANTIC_TEXT_MAP.
 */
function derivedNeutral(neutralHex: string, shade: 50 | 300 | 400 | 600 | 700 | 900): string {
  const scale = generateShadeScale(neutralHex, "neutral");
  return scale[shade];
}

describe("VI-346: text-scale AA-by-default", () => {
  describe("text-tertiary (light mode) clears AA on white", () => {
    for (const { name, hex } of REASONABLE_NEUTRALS) {
      it(`${name}: shade 600 on white >= 4.5:1`, () => {
        const tertiary = derivedNeutral(hex, 600);
        for (const bg of LIGHT_BACKGROUNDS) {
          const ratio = getContrastRatio(tertiary, bg);
          expect(ratio, `${tertiary} on ${bg}`).toBeGreaterThanOrEqual(AA_RATIO);
        }
      });
    }
  });

  describe("text-tertiary (dark mode) clears AA on near-black backgrounds", () => {
    for (const { name, hex } of REASONABLE_NEUTRALS) {
      it(`${name}: shade 400 on dark backgrounds >= 4.5:1`, () => {
        const tertiary = derivedNeutral(hex, 400);
        for (const bg of DARK_BACKGROUNDS) {
          const ratio = getContrastRatio(tertiary, bg);
          expect(ratio, `${tertiary} on ${bg}`).toBeGreaterThanOrEqual(AA_RATIO);
        }
      });
    }
  });

  describe("text-secondary (light mode) clears AA on white", () => {
    for (const { name, hex } of REASONABLE_NEUTRALS) {
      it(`${name}: shade 700 on white >= 4.5:1`, () => {
        const secondary = derivedNeutral(hex, 700);
        for (const bg of LIGHT_BACKGROUNDS) {
          const ratio = getContrastRatio(secondary, bg);
          expect(ratio, `${secondary} on ${bg}`).toBeGreaterThanOrEqual(AA_RATIO);
        }
      });
    }
  });

  describe("text-secondary (dark mode) clears AA on near-black backgrounds", () => {
    for (const { name, hex } of REASONABLE_NEUTRALS) {
      it(`${name}: shade 300 on dark backgrounds >= 4.5:1`, () => {
        const secondary = derivedNeutral(hex, 300);
        for (const bg of DARK_BACKGROUNDS) {
          const ratio = getContrastRatio(secondary, bg);
          expect(ratio, `${secondary} on ${bg}`).toBeGreaterThanOrEqual(AA_RATIO);
        }
      });
    }
  });

  describe("text-primary (light + dark) clears AA on canonical backgrounds", () => {
    // Sanity check — text-primary was already AA-clean; pin it.
    for (const { name, hex } of REASONABLE_NEUTRALS) {
      it(`${name}: shade 900 on white >= 4.5:1`, () => {
        const primary = derivedNeutral(hex, 900);
        for (const bg of LIGHT_BACKGROUNDS) {
          expect(getContrastRatio(primary, bg)).toBeGreaterThanOrEqual(AA_RATIO);
        }
      });
      it(`${name}: shade 50 on near-black >= 4.5:1`, () => {
        const primary = derivedNeutral(hex, 50);
        for (const bg of DARK_BACKGROUNDS) {
          expect(getContrastRatio(primary, bg)).toBeGreaterThanOrEqual(AA_RATIO);
        }
      });
    }
  });

  describe("hierarchy: text-secondary outpaces text-tertiary by >= 1.5x contrast", () => {
    // Apparent hierarchy must be preserved — secondary should be visibly
    // darker (light) / lighter (dark) than tertiary. Anchoring this at a
    // 1.5x ratio difference makes the contract testable.
    for (const { name, hex } of REASONABLE_NEUTRALS) {
      it(`${name}: light mode secondary contrast - tertiary contrast > 1.5`, () => {
        const secondary = derivedNeutral(hex, 700);
        const tertiary = derivedNeutral(hex, 600);
        const secondaryRatio = getContrastRatio(secondary, "#ffffff");
        const tertiaryRatio = getContrastRatio(tertiary, "#ffffff");
        expect(secondaryRatio - tertiaryRatio).toBeGreaterThan(1.5);
      });

      it(`${name}: dark mode secondary contrast - tertiary contrast > 1.5`, () => {
        const secondary = derivedNeutral(hex, 300);
        const tertiary = derivedNeutral(hex, 400);
        const secondaryRatio = getContrastRatio(secondary, "#09090b");
        const tertiaryRatio = getContrastRatio(tertiary, "#09090b");
        expect(secondaryRatio - tertiaryRatio).toBeGreaterThan(1.5);
      });
    }
  });

  describe("pipeline integration: derived text tokens land in CSS output", () => {
    // Round-trip sanity: building a theme from a reasonable neutral produces
    // CSS that contains the expected fixed-L hex values for secondary/tertiary.
    it("emits shade-700 hex into light --text-secondary for #71717a neutral", () => {
      const config = buildConfig("#71717a");
      const output = generateThemeFromConfig(config);
      const expectedSecondary = derivedNeutral("#71717a", 700);
      expect(output.lightCss).toContain(`--text-secondary: ${expectedSecondary}`);
    });

    it("emits shade-600 hex into light --text-tertiary for #71717a neutral", () => {
      const config = buildConfig("#71717a");
      const output = generateThemeFromConfig(config);
      const expectedTertiary = derivedNeutral("#71717a", 600);
      expect(output.lightCss).toContain(`--text-tertiary: ${expectedTertiary}`);
    });

    it("emits shade-300 hex into dark --text-secondary for #71717a neutral", () => {
      const config = buildConfig("#71717a");
      const output = generateThemeFromConfig(config);
      const expectedSecondary = derivedNeutral("#71717a", 300);
      expect(output.darkCss).toContain(`--text-secondary: ${expectedSecondary}`);
    });

    it("emits shade-400 hex into dark --text-tertiary for #71717a neutral", () => {
      const config = buildConfig("#71717a");
      const output = generateThemeFromConfig(config);
      const expectedTertiary = derivedNeutral("#71717a", 400);
      expect(output.darkCss).toContain(`--text-tertiary: ${expectedTertiary}`);
    });
  });
});
