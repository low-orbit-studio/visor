// @vitest-environment node
/**
 * Verifies that font utilities are accessible from the main entry's dist build,
 * and that the deprecated ./fonts subpath export has been removed.
 *
 * These tests intentionally import from `dist/` (not workspace src) to catch
 * regressions in the published artifact. Run `npm run build` before running tests.
 *
 * @vitest-environment node is required because this file uses import.meta.url
 * for dist path resolution, which only works in a Node environment (not jsdom).
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const distIndex = resolve(__dirname, "../../../dist/index.js");

// Fail loudly if someone runs tests before building
let distModule: Record<string, unknown>;
try {
  distModule = await import(distIndex);
} catch {
  throw new Error(
    `dist/index.js not found — run \`npm run build -w @loworbitstudio/visor-theme-engine\` before running tests`
  );
}

describe("font utilities — main-entry dist export", () => {
  it("resolveFont is exported from the main entry", () => {
    expect(typeof distModule.resolveFont).toBe("function");
  });

  it("buildVisorFontUrl is exported from the main entry", () => {
    expect(typeof distModule.buildVisorFontUrl).toBe("function");
  });

  it("resolveThemeFonts is exported from the main entry", () => {
    expect(typeof distModule.resolveThemeFonts).toBe("function");
  });

  it("generatePreloadLinks is exported from the main entry", () => {
    expect(typeof distModule.generatePreloadLinks).toBe("function");
  });

  it("generateStylesheetLinks is exported from the main entry", () => {
    expect(typeof distModule.generateStylesheetLinks).toBe("function");
  });

  it("lookupGoogleFont is exported from the main entry", () => {
    expect(typeof distModule.lookupGoogleFont).toBe("function");
  });
});

describe("exports map — ./fonts subpath removed", () => {
  it('package.json exports does not contain a "./fonts" key', () => {
    const pkgPath = resolve(__dirname, "../../../package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as {
      exports: Record<string, unknown>;
    };
    expect(pkg.exports["./fonts"]).toBeUndefined();
  });
});
