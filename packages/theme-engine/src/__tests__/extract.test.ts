import { describe, it, expect } from "vitest";
import { extractFromCSS, parseCSSDeclarations, type CSSFile } from "../extract.js";

describe("parseCSSDeclarations", () => {
  it("extracts custom properties from :root", () => {
    const css = `:root {
      --primary-600: #6366f1;
      --neutral-900: #111827;
    }`;
    const decls = parseCSSDeclarations(css);
    expect(decls).toHaveLength(2);
    expect(decls[0]).toEqual({
      property: "--primary-600",
      value: "#6366f1",
      context: "light",
    });
  });

  it("classifies .dark selector as dark context", () => {
    const css = `.dark {
      --surface-page: #0a0a0a;
    }`;
    const decls = parseCSSDeclarations(css);
    expect(decls).toHaveLength(1);
    expect(decls[0].context).toBe("dark");
  });

  it("classifies [data-theme='dark'] as dark context", () => {
    const css = `:root[data-theme="dark"] {
      --background: #000000;
    }`;
    const decls = parseCSSDeclarations(css);
    expect(decls).toHaveLength(1);
    expect(decls[0].context).toBe("dark");
  });

  it("strips CSS comments", () => {
    const css = `:root {
      /* This is a comment */
      --primary-600: #6366f1;
    }`;
    const decls = parseCSSDeclarations(css);
    expect(decls).toHaveLength(1);
    expect(decls[0].value).toBe("#6366f1");
  });

  it("handles nested blocks (e.g., @layer)", () => {
    const css = `@layer base {
      :root {
        --primary-600: #6366f1;
      }
    }`;
    const decls = parseCSSDeclarations(css);
    expect(decls.some((d) => d.property === "--primary-600")).toBe(true);
  });

  it("handles OKLCH color values", () => {
    const css = `:root {
      --primary: oklch(0.5 0.2 260);
    }`;
    const decls = parseCSSDeclarations(css);
    expect(decls).toHaveLength(1);
    expect(decls[0].value).toBe("oklch(0.5 0.2 260)");
  });

  it("handles rgb/rgba color values", () => {
    const css = `:root {
      --text-primary: rgba(255, 255, 255, 0.7);
    }`;
    const decls = parseCSSDeclarations(css);
    expect(decls).toHaveLength(1);
    expect(decls[0].value).toBe("rgba(255, 255, 255, 0.7)");
  });

  it("handles hsl/hsla color values", () => {
    const css = `:root {
      --accent: hsl(210, 80%, 50%);
    }`;
    const decls = parseCSSDeclarations(css);
    expect(decls).toHaveLength(1);
    expect(decls[0].value).toBe("hsl(210, 80%, 50%)");
  });
});

describe("extractFromCSS", () => {
  it("extracts primary color from named tokens", () => {
    const files: CSSFile[] = [
      {
        path: "tokens.css",
        content: `:root {
          --primary-600: #6366f1;
          --primary-700: #4f46e5;
        }`,
      },
    ];
    const result = extractFromCSS(files, "test-theme");
    expect(result.config.name).toBe("test-theme");
    expect(result.config.version).toBe(1);
    expect(result.config.colors.primary).toBeDefined();
  });

  it("extracts colors from Visor semantic tokens (high confidence)", () => {
    const files: CSSFile[] = [
      {
        path: "tokens.css",
        content: `:root {
          --text-primary: #111827;
          --text-link: #6366f1;
          --text-success: #15803d;
          --surface-page: #ffffff;
          --border-default: #e5e7eb;
          --interactive-primary-bg: #6366f1;
        }`,
      },
    ];
    const result = extractFromCSS(files, "test-theme");

    // Should have high-confidence tokens
    const highTokens = result.tokens.filter((t) => t.confidence === "high");
    expect(highTokens.length).toBeGreaterThan(0);
  });

  it("extracts dark mode colors", () => {
    const files: CSSFile[] = [
      {
        path: "tokens.css",
        content: `:root {
          --primary-600: #6366f1;
          --surface-page: #ffffff;
        }
        .dark {
          --surface-page: #0a0a0a;
          --background: #000000;
        }`,
      },
    ];
    const result = extractFromCSS(files);
    expect(result.config["colors-dark"]).toBeDefined();
    expect(result.config["colors-dark"]?.background).toBe("#000000");
  });

  it("extracts typography tokens", () => {
    const files: CSSFile[] = [
      {
        path: "tokens.css",
        content: `:root {
          --primary-600: #6366f1;
          --font-family-heading: "Inter";
          --font-family-body: "Inter";
          --font-family-mono: "JetBrains Mono";
          --font-weight-heading: 700;
          --font-weight-body: 400;
        }`,
      },
    ];
    const result = extractFromCSS(files);
    expect(result.config.typography?.heading?.family).toBe("Inter");
    expect(result.config.typography?.heading?.weight).toBe(700);
    expect(result.config.typography?.body?.family).toBe("Inter");
    expect(result.config.typography?.mono?.family).toBe("JetBrains Mono");
  });

  it("extracts radius tokens", () => {
    const files: CSSFile[] = [
      {
        path: "tokens.css",
        content: `:root {
          --primary-600: #6366f1;
          --radius-sm: 2;
          --radius-md: 4;
          --radius-lg: 8;
          --radius-xl: 12;
          --radius-pill: 9999;
        }`,
      },
    ];
    const result = extractFromCSS(files);
    expect(result.config.radius?.sm).toBe(2);
    expect(result.config.radius?.md).toBe(4);
    expect(result.config.radius?.lg).toBe(8);
    expect(result.config.radius?.xl).toBe(12);
    expect(result.config.radius?.pill).toBe(9999);
  });

  it("extracts shadow tokens", () => {
    const files: CSSFile[] = [
      {
        path: "tokens.css",
        content: `:root {
          --primary-600: #6366f1;
          --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }`,
      },
    ];
    const result = extractFromCSS(files);
    expect(result.config.shadows?.sm).toBe("0 1px 2px 0 rgba(0, 0, 0, 0.05)");
    expect(result.config.shadows?.md).toBe("0 4px 6px -1px rgba(0, 0, 0, 0.1)");
  });

  it("extracts motion tokens", () => {
    const files: CSSFile[] = [
      {
        path: "tokens.css",
        content: `:root {
          --primary-600: #6366f1;
          --motion-duration-fast: 100ms;
          --motion-duration-normal: 200ms;
          --motion-easing: cubic-bezier(0.4, 0, 0.2, 1);
        }`,
      },
    ];
    const result = extractFromCSS(files);
    expect(result.config.motion?.["duration-fast"]).toBe("100ms");
    expect(result.config.motion?.["duration-normal"]).toBe("200ms");
  });

  it("reports unmapped tokens", () => {
    const files: CSSFile[] = [
      {
        path: "tokens.css",
        content: `:root {
          --primary-600: #6366f1;
          --custom-brand-color: #ff6b2b;
          --some-other-color: #abcdef;
        }`,
      },
    ];
    const result = extractFromCSS(files);
    expect(result.unmapped.length).toBeGreaterThan(0);
  });

  it("warns when no custom properties are found", () => {
    const files: CSSFile[] = [
      {
        path: "empty.css",
        content: "body { color: red; }",
      },
    ];
    const result = extractFromCSS(files);
    expect(result.warnings.some((w) => w.includes("No CSS custom properties"))).toBe(true);
  });

  it("handles multiple files", () => {
    const files: CSSFile[] = [
      {
        path: "primitives.css",
        content: `:root {
          --primary-600: #6366f1;
          --neutral-900: #111827;
        }`,
      },
      {
        path: "semantic.css",
        content: `:root {
          --text-primary: #111827;
          --surface-page: #ffffff;
        }`,
      },
    ];
    const result = extractFromCSS(files);
    expect(result.config.colors.primary).toBeDefined();
    expect(result.tokens.length).toBeGreaterThan(0);
  });

  it("handles hex color formats", () => {
    const files: CSSFile[] = [
      {
        path: "tokens.css",
        content: `:root { --primary-600: #6366f1; }`,
      },
    ];
    const result = extractFromCSS(files);
    expect(result.config.colors.primary).toBe("#6366f1");
  });

  it("handles rgb/rgba color formats", () => {
    const files: CSSFile[] = [
      {
        path: "tokens.css",
        content: `:root { --primary-600: rgb(99, 102, 241); }`,
      },
    ];
    const result = extractFromCSS(files);
    expect(result.config.colors.primary).toBe("rgb(99, 102, 241)");
  });

  it("handles hsl/hsla color formats", () => {
    const files: CSSFile[] = [
      {
        path: "tokens.css",
        content: `:root { --primary-600: hsl(239, 84%, 67%); }`,
      },
    ];
    const result = extractFromCSS(files);
    expect(result.config.colors.primary).toBe("hsl(239, 84%, 67%)");
  });

  it("handles oklch color formats", () => {
    const files: CSSFile[] = [
      {
        path: "tokens.css",
        content: `:root { --primary-600: oklch(0.5 0.2 260); }`,
      },
    ];
    const result = extractFromCSS(files);
    expect(result.config.colors.primary).toBe("oklch(0.5 0.2 260)");
  });

  it("produces deterministic output for the same input", () => {
    const files: CSSFile[] = [
      {
        path: "tokens.css",
        content: `:root {
          --primary-600: #6366f1;
          --accent-600: #f59e0b;
          --text-primary: #111827;
        }`,
      },
    ];
    const result1 = extractFromCSS(files, "test");
    const result2 = extractFromCSS(files, "test");
    expect(JSON.stringify(result1)).toBe(JSON.stringify(result2));
  });

  it("skips var() references as color values", () => {
    const files: CSSFile[] = [
      {
        path: "tokens.css",
        content: `:root {
          --primary-600: #6366f1;
          --text-primary: var(--neutral-900);
        }`,
      },
    ];
    const result = extractFromCSS(files);
    // var() references should not be treated as color values
    const varTokens = result.tokens.filter((t) => t.value.startsWith("var("));
    expect(varTokens).toHaveLength(0);
  });

  it("extracts spacing base token", () => {
    const files: CSSFile[] = [
      {
        path: "tokens.css",
        content: `:root {
          --primary-600: #6366f1;
          --spacing-base: 4;
        }`,
      },
    ];
    const result = extractFromCSS(files);
    expect(result.config.spacing?.base).toBe(4);
  });

  it("uses default primary when no primary color is found", () => {
    const files: CSSFile[] = [
      {
        path: "tokens.css",
        content: `:root {
          --radius-sm: 2;
          --spacing-base: 4;
        }`,
      },
    ];
    const result = extractFromCSS(files);
    expect(result.config.colors.primary).toBe("#6366f1");
    expect(result.warnings.some((w) => w.includes("primary color"))).toBe(true);
  });
});
