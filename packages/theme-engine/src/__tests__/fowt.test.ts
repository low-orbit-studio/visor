import { describe, it, expect } from "vitest";
import { FOWT_SCRIPT, generateFowtScript, generateThemeFowtScript } from "../fowt.js";

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

/**
 * Execute an emitted FOWT script against a minimal stubbed browser environment
 * and return the resolved theme name (the attribute the script stamps on
 * <html>). `getItem` is a function so each storage state — valid, unknown,
 * absent, throwing — can be simulated.
 */
function runThemeScript(
  script: string,
  getItem: (key: string) => string | null,
  attribute = "data-theme-name",
): { resolved: string | null; disabledByName: Record<string, boolean> } {
  const styleNames = ["alpha", "beta", "gamma"];
  const disabledByName: Record<string, boolean> = {};
  const styleEls = styleNames.map((name) => {
    const el = {
      _name: name,
      disabled: false,
      getAttribute(a: string): string | null {
        return a === "data-theme-css" ? name : null;
      },
    };
    return el;
  });

  let resolved: string | null = null;
  const documentElement = {
    setAttribute(a: string, value: string): void {
      if (a === attribute) resolved = value;
    },
  };

  const sandbox = {
    localStorage: { getItem },
    document: {
      documentElement,
      querySelectorAll(sel: string): unknown[] {
        return sel === "style[data-theme-css]" ? styleEls : [];
      },
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  new Function("localStorage", "document", script)(sandbox.localStorage, sandbox.document);

  for (const el of styleEls) disabledByName[el._name] = el.disabled;
  return { resolved, disabledByName };
}

describe("generateThemeFowtScript", () => {
  const baseOptions = {
    themes: ["alpha", "beta", "gamma"],
    defaultTheme: "alpha",
  };

  it("reads the default 'visor-theme-name' storage key", () => {
    const script = generateThemeFowtScript(baseOptions);
    expect(script).toContain('localStorage.getItem("visor-theme-name")');
  });

  it("uses a custom storage key", () => {
    const script = generateThemeFowtScript({ ...baseOptions, storageKey: "my-theme-name" });
    expect(script).toContain('localStorage.getItem("my-theme-name")');
    expect(script).not.toContain("visor-theme-name");
  });

  it("inlines the registered-theme allowlist", () => {
    const script = generateThemeFowtScript(baseOptions);
    expect(script).toContain('["alpha","beta","gamma"]');
  });

  it("stamps the default data-theme-name attribute", () => {
    const script = generateThemeFowtScript(baseOptions);
    expect(script).toContain('setAttribute("data-theme-name"');
  });

  it("stamps a custom attribute", () => {
    const script = generateThemeFowtScript({ ...baseOptions, attribute: "data-palette" });
    expect(script).toContain('setAttribute("data-palette"');
    expect(script).not.toContain('setAttribute("data-theme-name"');
  });

  it("toggles style[data-theme-css] disabled states", () => {
    const script = generateThemeFowtScript(baseOptions);
    expect(script).toContain('querySelectorAll("style[data-theme-css]")');
    expect(script).toContain(".disabled =");
  });

  it("is wrapped in try/catch for pre-paint safety", () => {
    const script = generateThemeFowtScript(baseOptions);
    expect(script).toContain("try {");
    expect(script).toContain("catch");
  });

  it("is a self-invoking function", () => {
    const script = generateThemeFowtScript(baseOptions);
    expect(script).toMatch(/^\(function\(\)/);
    expect(script).toMatch(/\)\(\);$/);
  });

  it("is ES5-safe (no arrow functions or template literals)", () => {
    const script = generateThemeFowtScript(baseOptions);
    expect(script).not.toContain("=>");
    expect(script).not.toMatch(/`/);
  });

  // --- Storage-state coverage (verification plan) ---

  it("storage state: valid stored theme is applied", () => {
    const script = generateThemeFowtScript(baseOptions);
    const { resolved, disabledByName } = runThemeScript(script, () => "beta");
    expect(resolved).toBe("beta");
    expect(disabledByName).toEqual({ alpha: true, beta: false, gamma: true });
  });

  it("storage state: unknown stored theme falls back to default", () => {
    const script = generateThemeFowtScript(baseOptions);
    const { resolved, disabledByName } = runThemeScript(script, () => "not-registered");
    expect(resolved).toBe("alpha");
    expect(disabledByName).toEqual({ alpha: false, beta: true, gamma: true });
  });

  it("storage state: no stored value falls back to default", () => {
    const script = generateThemeFowtScript(baseOptions);
    const { resolved, disabledByName } = runThemeScript(script, () => null);
    expect(resolved).toBe("alpha");
    expect(disabledByName).toEqual({ alpha: false, beta: true, gamma: true });
  });

  it("storage state: localStorage throwing is swallowed by try/catch", () => {
    const script = generateThemeFowtScript(baseOptions);
    expect(() =>
      runThemeScript(script, () => {
        throw new Error("localStorage disabled");
      }),
    ).not.toThrow();
    // Nothing is stamped/toggled because the read throws before any DOM work.
    const { resolved } = runThemeScript(script, () => {
      throw new Error("localStorage disabled");
    });
    expect(resolved).toBeNull();
  });

  it("storage state: valid stored theme applied under a custom attribute", () => {
    const script = generateThemeFowtScript({ ...baseOptions, attribute: "data-palette" });
    const { resolved } = runThemeScript(script, () => "gamma", "data-palette");
    expect(resolved).toBe("gamma");
  });
});
