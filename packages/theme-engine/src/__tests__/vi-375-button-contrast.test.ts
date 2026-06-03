/**
 * VI-375: interactive button-text contrast blind-spot regression tests.
 *
 * Reproduces the ENTR class of bug: a bright dark-mode brand button bg
 * (`overrides.dark.interactive-primary-bg: #6BEBA5`) used to render hardcoded
 * white text (~1.5:1, well under WCAG AA) AND the validator never noticed,
 * because:
 *   Layer 1 — `primary-text` was a hardcoded `#ffffff` constant (no derivation).
 *   Layer 2 — no validator check paired `*-text` with `*-bg`.
 *   Layer 3 — the one interactive check read the RAW dark primary, not the
 *             post-override `interactive-primary-bg`.
 *
 * The fix: `*-text` derives from the paired `*-bg` luminance using the
 * theme-level `text-on-light` / `text-on-dark` defaults (per-token override
 * still wins); the validator adds an interactive-pair contrast loop and reads
 * post-override + re-derived values. These tests pin all four acceptance
 * bullets so a future edit can't silently regress the blind spot.
 */

import { generateThemeDataFromConfig } from "../pipeline.js";
import { validate } from "../validate.js";
import { getContrastRatio } from "../color.js";
import type { VisorThemeConfig } from "../types.js";

const AA_TEXT = 4.5;

/** ENTR-style: bright mint dark-mode button bg, NO text override. */
function entrMintNoTextOverride(
  extraTypography?: VisorThemeConfig["typography"],
): VisorThemeConfig {
  return {
    name: "ENTR",
    version: 1,
    colors: { primary: "#0EA47A" },
    ...(extraTypography ? { typography: extraTypography } : {}),
    overrides: { dark: { "interactive-primary-bg": "#6BEBA5" } },
  };
}

/** Only the interactive-primary-text vs -bg WCAG warnings (both modes). */
function primaryButtonWarnings(config: VisorThemeConfig): string[] {
  return validate(config)
    .warnings.filter(
      (w) =>
        w.code === "WCAG_CONTRAST" &&
        w.message.includes("interactive-primary-text on interactive-primary-bg"),
    )
    .map((w) => w.message);
}

describe("VI-375 — interactive button text derives from paired bg", () => {
  describe("Layer 1 — auto-pick text by paired bg luminance", () => {
    it("a light button bg picks the text-on-light default; a dark button bg picks text-on-dark", () => {
      // Construct a theme whose dark button bg is bright (mint) and supply a
      // readable on-light color so the auto-pick is observable.
      const { tokens } = generateThemeDataFromConfig(
        entrMintNoTextOverride({ "text-on-light": "#1E1F21" }),
      );
      // Dark primary-bg is the bright mint override → luminance > 0.5 → on-light.
      expect(tokens.interactive["primary-bg"].dark.toLowerCase()).toBe("#6beba5");
      expect(tokens.interactive["primary-text"].dark).toBe("#1E1F21");
    });

    it("primary-text is no longer a hardcoded white constant — it tracks text-on-dark", () => {
      const { tokens } = generateThemeDataFromConfig({
        name: "T",
        version: 1,
        colors: { primary: "#2563EB" },
        typography: { "text-on-dark": "#EFEFEF" },
      });
      // Dark blue button bg → dark enough → on-dark default (here #EFEFEF).
      expect(tokens.interactive["primary-text"].dark).toBe("#EFEFEF");
    });
  });

  describe("Acceptance bullets", () => {
    it("Bullet 1: mint bg with NO text override emits a WCAG_CONTRAST warning for primary-text vs primary-bg", () => {
      const warnings = primaryButtonWarnings(entrMintNoTextOverride());
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings.some((m) => m.startsWith("Dark mode:"))).toBe(true);
    });

    it("Bullet 2: same theme + text-on-light auto-picks the readable color and the warning clears", () => {
      const config = entrMintNoTextOverride({ "text-on-light": "#1E1F21" });
      const { tokens } = generateThemeDataFromConfig(config);
      // Auto-pick selected the on-light near-black for the bright mint bg.
      expect(tokens.interactive["primary-text"].dark).toBe("#1E1F21");
      // And the auto-picked pair clears AA, so no warning.
      expect(primaryButtonWarnings(config)).toEqual([]);
      const ratio = getContrastRatio(
        tokens.interactive["primary-text"].dark,
        tokens.interactive["primary-bg"].dark,
      );
      expect(ratio).toBeGreaterThanOrEqual(AA_TEXT);
    });

    it("Bullet 3: per-token interactive-primary-text override wins over the auto-pick", () => {
      const config: VisorThemeConfig = {
        name: "ENTR",
        version: 1,
        colors: { primary: "#0EA47A" },
        // text-on-light would also resolve here, but the per-token override
        // must take precedence regardless.
        typography: { "text-on-light": "#777777" },
        overrides: {
          dark: {
            "interactive-primary-bg": "#6BEBA5",
            "interactive-primary-text": "#1E1F21",
          },
        },
      };
      const { tokens } = generateThemeDataFromConfig(config);
      expect(tokens.interactive["primary-text"].dark).toBe("#1E1F21");
      expect(primaryButtonWarnings(config)).toEqual([]);
    });

    it("Bullet 4 (invariant): the old hardcoded-white pin is gone — text reacts to bg", () => {
      // White-on-mint must NOT be the rendered value anymore when text-on-light
      // is configured; the derivation, not a constant, decides.
      const { tokens } = generateThemeDataFromConfig(
        entrMintNoTextOverride({ "text-on-light": "#1E1F21" }),
      );
      expect(tokens.interactive["primary-text"].dark).not.toBe("#FFFFFF");
      expect(tokens.interactive["primary-text"].dark).not.toBe("#ffffff");
    });
  });

  describe("Layer 3 — validator reads post-override interactive bg", () => {
    it("the interactive-pair check evaluates the OVERRIDDEN mint bg, not the raw dark primary", () => {
      // With default text-on-light (white), the mint bg + white text fails AA;
      // the warning text names the actual mint-vs-white ratio (~1.5:1), proving
      // the check consumed the post-override bg.
      const warnings = primaryButtonWarnings(entrMintNoTextOverride());
      const dark = warnings.find((m) => m.startsWith("Dark mode:"));
      expect(dark).toBeDefined();
      // Extract the ratio and assert it reflects white-on-bright-mint (< 2:1),
      // which is only possible if the post-override mint bg was used.
      const match = dark!.match(/ratio ([\d.]+):1/);
      expect(match).not.toBeNull();
      expect(Number(match![1])).toBeLessThan(2);
    });
  });

  describe("schema — text-on-light / text-on-dark accepted and validated", () => {
    it("accepts valid text-on-light / text-on-dark colors (no INVALID/UNKNOWN errors)", () => {
      const result = validate({
        name: "T",
        version: 1,
        colors: { primary: "#2563EB" },
        typography: { "text-on-light": "#1E1F21", "text-on-dark": "#FFFFFF" },
      });
      expect(
        result.errors.filter(
          (e) => e.message.includes("text-on-light") || e.message.includes("text-on-dark"),
        ),
      ).toEqual([]);
    });

    it("rejects an invalid text-on-light color value", () => {
      const result = validate({
        name: "T",
        version: 1,
        colors: { primary: "#2563EB" },
        typography: { "text-on-light": "not-a-color" },
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes("text-on-light"))).toBe(true);
    });
  });
});
