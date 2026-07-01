/**
 * BO-56: the engine emits mode-correct CSS from a theme's `color-scheme` field.
 *
 *   dark-only  → dark palette on the host (:root) + `color-scheme: dark`,
 *                zero `@media (prefers-color-scheme: dark)`, zero light blocks.
 *   light-only → inverse (`color-scheme: light`).
 *   adaptive   → historical behavior, byte-for-byte (regression guard).
 *
 * Assertions distinguish the bare `color-scheme:` *property* (semicolon-
 * terminated, e.g. `color-scheme: dark;`) from the `@media (prefers-color-scheme:
 * dark)` *at-rule* — the two share a substring.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { generateThemeData } from "../pipeline.js";
import {
  generateLightCss,
  generateDarkCss,
  generateFullBundleCss,
} from "../generate-css.js";
import type { ColorScheme } from "../types.js";

const DARK_ONLY_YAML = readFileSync(
  resolve(__dirname, "./fixtures/dark-only.visor.yaml"),
  "utf-8",
);

const ADAPTIVE_YAML = readFileSync(
  resolve(__dirname, "./fixtures/minimal.visor.yaml"),
  "utf-8",
);

const LIGHT_ONLY_YAML = `
name: Solar
version: 1
color-scheme: light-only
colors:
  primary: "#2563EB"
`;

function data(yaml: string) {
  const d = generateThemeData(yaml);
  return { ...d, scheme: d.config["color-scheme"] as ColorScheme };
}

describe("BO-56 color-scheme — core generators", () => {
  describe("dark-only", () => {
    const d = data(DARK_ONLY_YAML);

    it("resolves color-scheme to dark-only", () => {
      expect(d.scheme).toBe("dark-only");
    });

    it("generateDarkCss pins the dark palette on the host with color-scheme: dark", () => {
      const dark = generateDarkCss(d.tokens, { colorScheme: d.scheme });
      expect(dark).toContain("color-scheme: dark;");
      // dark surface value lives on :root, not behind a toggle / media query.
      expect(dark).toContain(`--surface-page: ${d.tokens.surface.page.dark};`);
      expect(dark).toContain(":root {");
    });

    it("generateDarkCss emits no prefers-color-scheme media query and no toggle selectors", () => {
      const dark = generateDarkCss(d.tokens, { colorScheme: d.scheme });
      expect(dark).not.toContain("@media (prefers-color-scheme: dark)");
      expect(dark).not.toMatch(/\.dark[\s,{]/);
      expect(dark).not.toContain('[data-theme="dark"]');
    });

    it("generateLightCss emits nothing for a dark-only brand", () => {
      const light = generateLightCss(d.tokens, { colorScheme: d.scheme });
      expect(light).toBe("");
      // no light page white leaks in.
      expect(light).not.toContain(`--surface-page: ${d.tokens.surface.page.light};`);
    });

    it("generateFullBundleCss carries dark-at-host + color-scheme: dark, no prefers", () => {
      const bundle = generateFullBundleCss(d.primitives, d.tokens, d.config);
      expect(bundle).toContain("color-scheme: dark;");
      expect(bundle).not.toContain("@media (prefers-color-scheme: dark)");
      expect(bundle).toContain(`--surface-page: ${d.tokens.surface.page.dark};`);
      expect(bundle).not.toContain(`--surface-page: ${d.tokens.surface.page.light};`);
    });
  });

  describe("light-only (inverse)", () => {
    const d = data(LIGHT_ONLY_YAML);

    it("resolves color-scheme to light-only", () => {
      expect(d.scheme).toBe("light-only");
    });

    it("generateLightCss pins the light palette on the host with color-scheme: light", () => {
      const light = generateLightCss(d.tokens, { colorScheme: d.scheme });
      expect(light).toContain("color-scheme: light;");
      expect(light).toContain(`--surface-page: ${d.tokens.surface.page.light};`);
    });

    it("generateDarkCss emits nothing and there is no prefers media query", () => {
      const dark = generateDarkCss(d.tokens, { colorScheme: d.scheme });
      expect(dark).toBe("");
      const bundle = generateFullBundleCss(d.primitives, d.tokens, d.config);
      expect(bundle).not.toContain("@media (prefers-color-scheme: dark)");
      expect(bundle).toContain("color-scheme: light;");
    });
  });

  describe("adaptive (regression guard — byte-for-byte unchanged)", () => {
    const d = data(ADAPTIVE_YAML);

    it("resolves color-scheme to adaptive by default", () => {
      expect(d.scheme).toBe("adaptive");
    });

    it("still gates dark behind manual-toggle + @media (prefers-color-scheme: dark)", () => {
      const dark = generateDarkCss(d.tokens, { colorScheme: d.scheme });
      expect(dark).toContain("@media (prefers-color-scheme: dark)");
      expect(dark).toContain(".dark");
    });

    it("emits no bare color-scheme property in any generator", () => {
      const light = generateLightCss(d.tokens, { colorScheme: d.scheme });
      const dark = generateDarkCss(d.tokens, { colorScheme: d.scheme });
      const bundle = generateFullBundleCss(d.primitives, d.tokens, d.config);
      expect(light).not.toMatch(/color-scheme:\s*(dark|light);/);
      expect(dark).not.toMatch(/color-scheme:\s*(dark|light);/);
      expect(bundle).not.toMatch(/color-scheme:\s*(dark|light);/);
    });

    it("default-argument output equals explicit-adaptive output (no drift)", () => {
      expect(generateLightCss(d.tokens)).toBe(
        generateLightCss(d.tokens, { colorScheme: "adaptive" }),
      );
      expect(generateDarkCss(d.tokens)).toBe(
        generateDarkCss(d.tokens, { colorScheme: "adaptive" }),
      );
    });
  });
});
