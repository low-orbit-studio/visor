import { describe, it, expect } from "vitest";
import { FOWT_SCRIPT, generateFowtScript } from "../fowt.js";

describe("FOWT_SCRIPT", () => {
  it("is a non-empty string", () => {
    expect(typeof FOWT_SCRIPT).toBe("string");
    expect(FOWT_SCRIPT.length).toBeGreaterThan(0);
  });

  it("contains localStorage", () => {
    expect(FOWT_SCRIPT).toContain("localStorage");
  });

  it("contains classList.add", () => {
    expect(FOWT_SCRIPT).toContain("classList.add");
  });

  it("reads visor-theme key by default", () => {
    expect(FOWT_SCRIPT).toContain("visor-theme");
  });

  it("checks for dark preference", () => {
    expect(FOWT_SCRIPT).toContain('"dark"');
  });

  it("sets light class as alternative", () => {
    expect(FOWT_SCRIPT).toContain('"light"');
  });

  it("includes prefers-color-scheme fallback", () => {
    expect(FOWT_SCRIPT).toContain("prefers-color-scheme");
  });

  it("is wrapped in try/catch for SSR safety", () => {
    expect(FOWT_SCRIPT).toContain("try {");
    expect(FOWT_SCRIPT).toContain("catch");
  });

  it("is a self-invoking function", () => {
    expect(FOWT_SCRIPT).toMatch(/^\(function\(\)/);
    expect(FOWT_SCRIPT).toMatch(/\)\(\);$/);
  });
});

describe("generateFowtScript", () => {
  it("uses custom storage key", () => {
    const script = generateFowtScript({ storageKey: "my-theme" });
    expect(script).toContain("my-theme");
    expect(script).not.toContain("visor-theme");
  });

  it("defaults to dark when defaultTheme is dark", () => {
    const script = generateFowtScript({ defaultTheme: "dark" });
    // When default is dark, the fallback check should be "true" (always dark)
    expect(script).toContain("(!t && true)");
  });

  it("defaults to light when defaultTheme is light", () => {
    const script = generateFowtScript({ defaultTheme: "light" });
    // When default is light, the fallback check should be "false" (never dark)
    expect(script).toContain("(!t && false)");
  });

  it("uses prefers-color-scheme when no defaultTheme", () => {
    const script = generateFowtScript();
    expect(script).toContain("prefers-color-scheme");
  });

  it("is ES5-safe (no arrow functions or template literals)", () => {
    const script = generateFowtScript();
    expect(script).not.toContain("=>");
    expect(script).not.toMatch(/`/);
  });
});
