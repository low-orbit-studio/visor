import { describe, it, expect } from "vitest";
import {
  buildVisorBrandUrl,
  resolveBrandSlot,
  resolveBrandSource,
  DEFAULT_VISOR_BRAND,
  VISOR_BRANDS_CDN,
  VISOR_DEFAULT_BRAND_PATH,
} from "../resolve.js";
import type { BrandSlot, VisorBrand } from "../types.js";

describe("buildVisorBrandUrl", () => {
  it("builds a default CDN URL for the light variant", () => {
    const url = buildVisorBrandUrl("low-orbit-studio", "blacklight", "logo", "light", "svg");
    expect(url).toBe(`${VISOR_BRANDS_CDN}/low-orbit-studio/blacklight/logo.svg`);
  });

  it("appends -dark suffix for the dark variant", () => {
    const url = buildVisorBrandUrl("low-orbit-studio", "blacklight", "logo", "dark", "svg");
    expect(url).toBe(`${VISOR_BRANDS_CDN}/low-orbit-studio/blacklight/logo-dark.svg`);
  });

  it("honors a cdnBase override", () => {
    const url = buildVisorBrandUrl("acme", "acme", "brandmark", "light", "svg", "https://brands.acme.com");
    expect(url).toBe("https://brands.acme.com/acme/acme/brandmark.svg");
  });

  it("drops the org segment when org is empty (CDN encodes the namespace)", () => {
    const url = buildVisorBrandUrl("", "acme", "logo", "light", "svg", "https://brands.acme.com");
    expect(url).toBe("https://brands.acme.com/acme/logo.svg");
  });

  it("respects the requested format", () => {
    const url = buildVisorBrandUrl("low-orbit-studio", "visor", "favicon", "light", "png");
    expect(url).toBe(`${VISOR_BRANDS_CDN}/low-orbit-studio/visor/favicon.png`);
  });
});

describe("resolveBrandSource", () => {
  it("defaults to visor-brands when source is omitted", () => {
    expect(resolveBrandSource({})).toBe("visor-brands");
  });

  it("returns the declared source", () => {
    expect(resolveBrandSource({ source: "local" })).toBe("local");
  });
});

describe("resolveBrandSlot — source: local (Phase 1)", () => {
  const opts = { source: "local" as const, org: "low-orbit-studio" };

  it("resolves explicit light/dark public paths verbatim", () => {
    const slot: BrandSlot = {
      light: "/themes/blacklight/brand/logo.svg",
      dark: "/themes/blacklight/brand/logo-dark.svg",
    };
    const r = resolveBrandSlot("logo", slot, opts);
    expect(r.source).toBe("local");
    expect(r.light).toBe("/themes/blacklight/brand/logo.svg");
    expect(r.dark).toBe("/themes/blacklight/brand/logo-dark.svg");
    expect(r.guidance).toBeNull();
  });

  it("infers a conventional public/ path when no explicit value is given", () => {
    const slot: BrandSlot = { slug: "blacklight", formats: ["svg"] };
    const r = resolveBrandSlot("logo", slot, opts);
    expect(r.light).toBe("/themes/blacklight/brand/logo.svg");
    expect(r.dark).toBe("/themes/blacklight/brand/logo-dark.svg");
    // No explicit path → emits setup guidance.
    expect(r.guidance).toContain("local asset");
  });

  it("uses the variant name as slug fallback", () => {
    const r = resolveBrandSlot("brandmark", { formats: ["svg"] }, opts);
    expect(r.light).toBe("/themes/brandmark/brand/brandmark.svg");
  });

  it("defaults format to svg", () => {
    const r = resolveBrandSlot("wordmark", { slug: "x" }, opts);
    expect(r.light).toBe("/themes/x/brand/wordmark.svg");
  });

  it("carries clearSpace and aspectRatio tokens through (Q6)", () => {
    const slot: BrandSlot = { slug: "x", clearSpace: "0.5rem", aspectRatio: "3 / 1" };
    const r = resolveBrandSlot("logo", slot, opts);
    expect(r.clearSpace).toBe("0.5rem");
    expect(r.aspectRatio).toBe("3 / 1");
  });

  it("nulls clearSpace and aspectRatio when not declared", () => {
    const r = resolveBrandSlot("logo", { slug: "x" }, opts);
    expect(r.clearSpace).toBeNull();
    expect(r.aspectRatio).toBeNull();
  });
});

describe("resolveBrandSlot — source: visor-brands (CDN, Phase 2+)", () => {
  const opts = { source: "visor-brands" as const, org: "low-orbit-studio", cdnBase: null };

  it("builds CDN URLs for both modes", () => {
    const r = resolveBrandSlot("logo", { slug: "visor", formats: ["svg"] }, opts);
    expect(r.light).toBe(`${VISOR_BRANDS_CDN}/low-orbit-studio/visor/logo.svg`);
    expect(r.dark).toBe(`${VISOR_BRANDS_CDN}/low-orbit-studio/visor/logo-dark.svg`);
    expect(r.guidance).toBeNull();
  });

  it("honors explicit per-mode overrides as full paths", () => {
    const slot: BrandSlot = { slug: "visor", light: "https://cdn.example/x.svg" };
    const r = resolveBrandSlot("logo", slot, opts);
    expect(r.light).toBe("https://cdn.example/x.svg");
    // dark falls back to the built CDN URL.
    expect(r.dark).toBe(`${VISOR_BRANDS_CDN}/low-orbit-studio/visor/logo-dark.svg`);
  });
});

describe("DEFAULT_VISOR_BRAND", () => {
  it("is a local-source brand pointing at the canonical public/ path", () => {
    expect(DEFAULT_VISOR_BRAND.source).toBe("local");
    expect(DEFAULT_VISOR_BRAND.org).toBe("low-orbit-studio");
    expect(DEFAULT_VISOR_BRAND.logo?.light).toBe(`${VISOR_DEFAULT_BRAND_PATH}/logo.svg`);
    expect(DEFAULT_VISOR_BRAND.logo?.dark).toBe(`${VISOR_DEFAULT_BRAND_PATH}/logo-dark.svg`);
  });

  it("pins clearSpace + aspectRatio on the standard lockups (Q6)", () => {
    expect(DEFAULT_VISOR_BRAND.logo?.aspectRatio).toBe("3 / 1");
    expect(DEFAULT_VISOR_BRAND.logo?.clearSpace).toBe("0.5rem");
    expect(DEFAULT_VISOR_BRAND.brandmark?.aspectRatio).toBe("1 / 1");
  });

  it("covers all five standard variants", () => {
    const brand: VisorBrand = DEFAULT_VISOR_BRAND;
    expect(brand.logo).toBeDefined();
    expect(brand.brandmark).toBeDefined();
    expect(brand.wordmark).toBeDefined();
    expect(brand.monochrome).toBeDefined();
    expect(brand.favicon).toBeDefined();
  });
});
