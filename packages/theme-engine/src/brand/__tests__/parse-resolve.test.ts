/**
 * Brand block — parse (schema validation) + resolve (config defaults).
 *
 * Covers the integration between the `brand` block and the core pipeline:
 *   - validateConfig accepts/rejects brand declarations.
 *   - resolveConfig fills the Visor default brand and merges per-slot overrides.
 */

import { describe, it, expect } from "vitest";
import { validateConfig } from "../../schema.js";
import { resolveConfig } from "../../resolve.js";
import { DEFAULT_VISOR_BRAND, VISOR_DEFAULT_BRAND_PATH } from "../resolve.js";
import type { VisorThemeConfig } from "../../types.js";

const base: VisorThemeConfig = {
  name: "Test",
  version: 1,
  colors: { primary: "#2563EB" },
};

describe("validateConfig — brand block", () => {
  it("accepts a well-formed local brand block", () => {
    const result = validateConfig({
      ...base,
      brand: {
        source: "local",
        logo: {
          slug: "test",
          formats: ["svg"],
          light: "/themes/test/brand/logo.svg",
          dark: "/themes/test/brand/logo-dark.svg",
          clearSpace: "0.5rem",
          aspectRatio: "3 / 1",
        },
      },
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("accepts a visor-brands brand block with org", () => {
    const result = validateConfig({
      ...base,
      brand: { source: "visor-brands", org: "low-orbit-studio", logo: { slug: "visor" } },
    });
    expect(result.valid).toBe(true);
  });

  it("rejects an unknown top-level brand key", () => {
    const result = validateConfig({
      ...base,
      brand: { logoo: { slug: "x" } },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("brand.logoo"))).toBe(true);
  });

  it("rejects an unknown slot key", () => {
    const result = validateConfig({
      ...base,
      brand: { source: "local", logo: { slug: "x", colour: "red" } },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("brand.logo.colour"))).toBe(true);
  });

  it("rejects an invalid source value", () => {
    const result = validateConfig({ ...base, brand: { source: "cdn" } });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("brand.source"))).toBe(true);
  });

  it("requires org when source is visor-brands without a cdn-override", () => {
    const result = validateConfig({ ...base, brand: { source: "visor-brands", logo: { slug: "x" } } });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("brand.org"))).toBe(true);
  });

  it("allows omitted org when a cdn-override base is set", () => {
    const result = validateConfig({
      ...base,
      brand: { source: "visor-brands", "cdn-overrides": { "visor-brands": "https://brands.acme.com" }, logo: { slug: "x" } },
    });
    expect(result.valid).toBe(true);
  });

  it("rejects a non-array formats field", () => {
    const result = validateConfig({
      ...base,
      brand: { source: "local", logo: { slug: "x", formats: "svg" as unknown as string[] } },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("formats"))).toBe(true);
  });

  it("validates custom slots", () => {
    const result = validateConfig({
      ...base,
      brand: { source: "local", custom: { appIcon: { slug: "x", bogus: 1 } } },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("brand.custom.appIcon.bogus"))).toBe(true);
  });
});

describe("resolveConfig — brand defaults", () => {
  it("fills the Visor default brand when brand is omitted (D3)", () => {
    const resolved = resolveConfig(base);
    expect(resolved.brand).toEqual(DEFAULT_VISOR_BRAND);
    expect(resolved.brand.logo?.light).toBe(`${VISOR_DEFAULT_BRAND_PATH}/visor-logo-light.svg`);
  });

  it("merges a partial brand over the default per-slot", () => {
    const resolved = resolveConfig({
      ...base,
      brand: {
        source: "local",
        logo: { slug: "test", light: "/themes/test/brand/logo.svg", dark: "/themes/test/brand/logo-dark.svg" },
      },
    });
    // Declared slot wins.
    expect(resolved.brand.logo?.light).toBe("/themes/test/brand/logo.svg");
    // Undeclared slots inherit the Visor default.
    expect(resolved.brand.brandmark).toEqual(DEFAULT_VISOR_BRAND.brandmark);
    expect(resolved.brand.wordmark).toEqual(DEFAULT_VISOR_BRAND.wordmark);
    // source override carries through.
    expect(resolved.brand.source).toBe("local");
  });

  it("carries custom slots through resolution", () => {
    const resolved = resolveConfig({
      ...base,
      brand: { source: "local", custom: { appIcon: { slug: "x", light: "/a.png", dark: "/a.png" } } },
    });
    expect(resolved.brand.custom?.appIcon?.light).toBe("/a.png");
  });
});
