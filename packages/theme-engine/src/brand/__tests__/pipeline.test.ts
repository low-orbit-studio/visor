import { describe, it, expect } from "vitest";
import { resolveThemeBrand } from "../pipeline.js";
import { VISOR_DEFAULT_BRAND_PATH } from "../resolve.js";
import type { VisorBrand } from "../types.js";

describe("resolveThemeBrand — defaults (D3)", () => {
  it("falls back to the Visor default brand when brand is undefined", () => {
    const result = resolveThemeBrand(undefined);
    const variantNames = result.variants.map((v) => v.variant);
    expect(variantNames).toEqual(["logo", "brandmark", "wordmark", "monochrome", "favicon"]);
    const logo = result.variants.find((v) => v.variant === "logo")!;
    expect(logo.light).toBe(`${VISOR_DEFAULT_BRAND_PATH}/visor-logo-light.svg`);
    expect(logo.dark).toBe(`${VISOR_DEFAULT_BRAND_PATH}/visor-logo-dark.svg`);
  });

  it("emits no custom variants by default", () => {
    const result = resolveThemeBrand(undefined);
    expect(result.custom).toEqual([]);
  });
});

describe("resolveThemeBrand — explicit brand", () => {
  const localBrand: VisorBrand = {
    org: "low-orbit-studio",
    source: "local",
    logo: {
      slug: "blacklight",
      formats: ["svg"],
      light: "/themes/blacklight/brand/logo.svg",
      dark: "/themes/blacklight/brand/logo-dark.svg",
      aspectRatio: "3 / 1",
      clearSpace: "0.5rem",
    },
    brandmark: { slug: "blacklight", light: "/themes/blacklight/brand/mark.svg", dark: "/themes/blacklight/brand/mark-dark.svg" },
  };

  it("resolves only the declared standard slots", () => {
    const result = resolveThemeBrand(localBrand);
    expect(result.variants.map((v) => v.variant)).toEqual(["logo", "brandmark"]);
  });

  it("resolves custom slots in declaration order", () => {
    const brand: VisorBrand = {
      ...localBrand,
      custom: {
        appIcon: { slug: "blacklight", formats: ["png"], light: "/themes/blacklight/brand/app-icon.png", dark: "/themes/blacklight/brand/app-icon.png" },
      },
    };
    const result = resolveThemeBrand(brand);
    expect(result.custom.map((v) => v.variant)).toEqual(["appIcon"]);
    expect(result.custom[0].light).toBe("/themes/blacklight/brand/app-icon.png");
  });
});

describe("resolveThemeBrand — CSS emission", () => {
  const brand: VisorBrand = {
    org: "low-orbit-studio",
    source: "local",
    logo: {
      slug: "blacklight",
      formats: ["svg"],
      light: "/themes/blacklight/brand/logo.svg",
      dark: "/themes/blacklight/brand/logo-dark.svg",
      aspectRatio: "3 / 1",
      clearSpace: "0.5rem",
    },
  };

  it("emits mode-scoped --brand-{variant} for light and dark (Q1)", () => {
    const result = resolveThemeBrand(brand, { scope: ".blacklight-theme" });
    // Light value under html:not(.dark).
    expect(result.css).toContain("html:not(.dark) .blacklight-theme {");
    expect(result.css).toContain('--brand-logo: url("/themes/blacklight/brand/logo.svg");');
    // Dark value under .dark.
    expect(result.css).toContain(".dark .blacklight-theme {");
    expect(result.css).toContain('--brand-logo: url("/themes/blacklight/brand/logo-dark.svg");');
  });

  it("emits explicit -light / -dark forced-mode aliases (Q1)", () => {
    const result = resolveThemeBrand(brand, { scope: ".blacklight-theme" });
    expect(result.css).toContain('--brand-logo-light: url("/themes/blacklight/brand/logo.svg");');
    expect(result.css).toContain('--brand-logo-dark: url("/themes/blacklight/brand/logo-dark.svg");');
  });

  it("emits per-variant clearSpace + aspectRatio tokens (Q6)", () => {
    const result = resolveThemeBrand(brand, { scope: ".blacklight-theme" });
    expect(result.css).toContain("--brand-logo-clear-space: 0.5rem;");
    expect(result.css).toContain("--brand-logo-aspect-ratio: 3 / 1;");
  });

  it("emits a prefers-color-scheme dark fallback", () => {
    const result = resolveThemeBrand(brand, { scope: ".blacklight-theme" });
    expect(result.css).toContain("@media (prefers-color-scheme: dark)");
    expect(result.css).toContain(".blacklight-theme:not(.light) {");
  });

  it("falls back to :root selectors when no scope is supplied", () => {
    const result = resolveThemeBrand(brand);
    expect(result.css).toContain(":root {");
    expect(result.css).toContain(".dark {");
    expect(result.css).toContain(":root:not(.light) {");
  });

  it("omits clearSpace/aspectRatio tokens for slots that don't declare them", () => {
    const noTokens: VisorBrand = {
      source: "local",
      wordmark: { slug: "x", light: "/themes/x/brand/wordmark.svg", dark: "/themes/x/brand/wordmark.svg" },
    };
    const result = resolveThemeBrand(noTokens, { scope: ".x-theme" });
    expect(result.css).not.toContain("--brand-wordmark-clear-space");
    expect(result.css).not.toContain("--brand-wordmark-aspect-ratio");
  });

  it("returns empty CSS when there are no variants", () => {
    const empty: VisorBrand = { source: "local" };
    const result = resolveThemeBrand(empty, { scope: ".x-theme" });
    expect(result.css).toBe("");
  });
});

describe("resolveThemeBrand — warnings", () => {
  it("warns for local slots with no explicit path", () => {
    const brand: VisorBrand = {
      source: "local",
      logo: { slug: "blacklight", formats: ["svg"] },
    };
    const result = resolveThemeBrand(brand);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain("local asset");
  });

  it("does not warn for visor-brands CDN slots", () => {
    const brand: VisorBrand = {
      org: "low-orbit-studio",
      source: "visor-brands",
      logo: { slug: "visor", formats: ["svg"] },
    };
    const result = resolveThemeBrand(brand);
    expect(result.warnings).toEqual([]);
  });
});

describe("resolveThemeBrand — animated slot (VI-488)", () => {
  it("emits --brand-animated + forced-mode aliases when declared", () => {
    const brand: VisorBrand = {
      source: "local",
      animated: {
        slug: "blacklight",
        formats: ["svg"],
        light: "/themes/blacklight/brand/animated.svg",
        dark: "/themes/blacklight/brand/animated-dark.svg",
      },
    };
    const result = resolveThemeBrand(brand, { scope: ".blacklight-theme" });
    expect(result.variants.map((v) => v.variant)).toContain("animated");
    expect(result.css).toContain('--brand-animated: url("/themes/blacklight/brand/animated.svg");');
    expect(result.css).toContain('--brand-animated-light: url("/themes/blacklight/brand/animated.svg");');
    expect(result.css).toContain('--brand-animated-dark: url("/themes/blacklight/brand/animated-dark.svg");');
  });

  it("emits no --brand-animated when the theme omits it (optional, D2)", () => {
    const brand: VisorBrand = {
      source: "local",
      logo: { slug: "x", light: "/themes/x/brand/logo.svg", dark: "/themes/x/brand/logo-dark.svg" },
    };
    const result = resolveThemeBrand(brand, { scope: ".x-theme" });
    expect(result.css).not.toContain("--brand-animated");
  });

  it("does not add animated to the Visor default brand (D2)", () => {
    const result = resolveThemeBrand(undefined);
    expect(result.variants.map((v) => v.variant)).not.toContain("animated");
  });
});
