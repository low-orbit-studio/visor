/**
 * Verifies that font utilities are accessible from the main entry's re-export
 * and that the deprecated ./fonts subpath has been removed from the exports map.
 *
 * Imports from src/index.ts (via relative path) rather than dist/ so the test
 * runs without a prior build step in any vitest environment.
 */
import { describe, it, expect } from "vitest";
import {
  resolveFont,
  buildVisorFontUrl,
  resolveThemeFonts,
  generatePreloadLinks,
  generateStylesheetLinks,
  lookupGoogleFont,
} from "../../index.js";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — resolveJsonModule is enabled in tsconfig
import pkg from "../../../package.json";

describe("font utilities — main-entry re-export", () => {
  it("resolveFont is exported from the main entry", () => {
    expect(typeof resolveFont).toBe("function");
  });

  it("buildVisorFontUrl is exported from the main entry", () => {
    expect(typeof buildVisorFontUrl).toBe("function");
  });

  it("resolveThemeFonts is exported from the main entry", () => {
    expect(typeof resolveThemeFonts).toBe("function");
  });

  it("generatePreloadLinks is exported from the main entry", () => {
    expect(typeof generatePreloadLinks).toBe("function");
  });

  it("generateStylesheetLinks is exported from the main entry", () => {
    expect(typeof generateStylesheetLinks).toBe("function");
  });

  it("lookupGoogleFont is exported from the main entry", () => {
    expect(typeof lookupGoogleFont).toBe("function");
  });
});

describe("exports map — ./fonts subpath removed", () => {
  it('package.json exports does not contain a "./fonts" key', () => {
    const exports = (pkg as { exports: Record<string, unknown> }).exports;
    expect(exports["./fonts"]).toBeUndefined();
  });
});
