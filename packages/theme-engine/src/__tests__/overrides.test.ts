import { applyOverrides } from "../overrides.js";
import type { SemanticTokens } from "../types.js";

function buildMockTokens(): SemanticTokens {
  return {
    text: {
      primary: { light: "#111827", dark: "#f9fafb" },
      secondary: { light: "#4b5563", dark: "#9ca3af" },
    },
    surface: {
      page: { light: "#ffffff", dark: "#030712" },
      card: { light: "#ffffff", dark: "#111827" },
    },
    border: {
      default: { light: "#e5e7eb", dark: "#374151" },
      muted: { light: "#f3f4f6", dark: "#1f2937" },
      strong: { light: "#9ca3af", dark: "#6b7280" },
      input: { light: "#d1d5db", dark: "#4b5563" },
      focus: { light: "#2563eb", dark: "#3b82f6" },
      error: { light: "#ef4444", dark: "#f87171" },
    },
    interactive: {
      "primary-bg": { light: "#2563eb", dark: "#3b82f6" },
      "primary-text": { light: "#ffffff", dark: "#ffffff" },
    },
    intent: {
      primary: { light: "#2563eb", dark: "#3b82f6" },
      "primary-text": { light: "#ffffff", dark: "#ffffff" },
      accent: { light: "#7c3aed", dark: "#a78bfa" },
      success: { light: "#22c55e", dark: "#4ade80" },
      warning: { light: "#f59e0b", dark: "#fbbf24" },
      destructive: { light: "#ef4444", dark: "#f87171" },
      info: { light: "#0ea5e9", dark: "#38bdf8" },
    },
    hairline: {
      default: { light: "rgba(0,0,0,0.06)", dark: "rgba(255,255,255,0.06)" },
      strong: { light: "rgba(0,0,0,0.10)", dark: "rgba(255,255,255,0.10)" },
    },
  };
}

describe("applyOverrides", () => {
  it("returns tokens unchanged when no overrides provided", () => {
    const tokens = buildMockTokens();
    const result = applyOverrides(tokens);
    expect(result).toBe(tokens);
  });

  it("replaces the correct light token value", () => {
    const tokens = buildMockTokens();
    const result = applyOverrides(tokens, {
      light: { "text-primary": "#000000" },
    });
    expect(result.text.primary.light).toBe("#000000");
    expect(result.text.primary.dark).toBe("#f9fafb");
  });

  it("replaces the correct dark token value", () => {
    const tokens = buildMockTokens();
    const result = applyOverrides(tokens, {
      dark: { "surface-page": "#1a1a1a" },
    });
    expect(result.surface.page.dark).toBe("#1a1a1a");
    expect(result.surface.page.light).toBe("#ffffff");
  });

  it("leaves non-overridden tokens unchanged", () => {
    const tokens = buildMockTokens();
    const result = applyOverrides(tokens, {
      light: { "text-primary": "#000000" },
    });
    expect(result.text.secondary.light).toBe("#4b5563");
    expect(result.surface.page.light).toBe("#ffffff");
    expect(result.interactive["primary-bg"].light).toBe("#2563eb");
  });

  it("silently ignores unknown override keys", () => {
    const tokens = buildMockTokens();
    const result = applyOverrides(tokens, {
      light: { "text-nonexistent": "#FF0000" },
      dark: { "surface-unknown": "#00FF00" },
    });
    // Should not throw, tokens unchanged
    expect(result.text.primary.light).toBe("#111827");
    expect(result.surface.page.dark).toBe("#030712");
  });

  it("does not mutate the input object", () => {
    const tokens = buildMockTokens();
    const originalLight = tokens.text.primary.light;
    const originalDark = tokens.text.primary.dark;

    applyOverrides(tokens, {
      light: { "text-primary": "#000000" },
      dark: { "text-primary": "#FFFFFF" },
    });

    expect(tokens.text.primary.light).toBe(originalLight);
    expect(tokens.text.primary.dark).toBe(originalDark);
  });

  describe("VI-451 — intent + hairline overrides", () => {
    it("flat-namespace key (`primary`) overrides intent.primary, not text.primary", () => {
      const tokens = buildMockTokens();
      const result = applyOverrides(tokens, {
        dark: { primary: "#6BEBA5" },
      });
      expect(result.intent.primary.dark).toBe("#6BEBA5");
      // text.primary untouched
      expect(result.text.primary.dark).toBe("#f9fafb");
    });

    it("`text-primary` still routes to text.primary, not intent.primary", () => {
      const tokens = buildMockTokens();
      const result = applyOverrides(tokens, {
        dark: { "text-primary": "#FAFCFE", primary: "#6BEBA5" },
      });
      expect(result.text.primary.dark).toBe("#FAFCFE");
      expect(result.intent.primary.dark).toBe("#6BEBA5");
    });

    it("bare `hairline` maps to hairline.default; `hairline-strong` to hairline.strong", () => {
      const tokens = buildMockTokens();
      const result = applyOverrides(tokens, {
        dark: {
          hairline: "rgba(255,255,255,0.06)",
          "hairline-strong": "rgba(255,255,255,0.10)",
        },
      });
      expect(result.hairline.default.dark).toBe("rgba(255,255,255,0.06)");
      expect(result.hairline.strong.dark).toBe("rgba(255,255,255,0.10)");
    });

    it("intent overrides accept all 7 bare keys (primary, primary-text, accent, success, warning, destructive, info)", () => {
      const tokens = buildMockTokens();
      const result = applyOverrides(tokens, {
        dark: {
          primary: "#A1",
          "primary-text": "#A2",
          accent: "#A3",
          success: "#A4",
          warning: "#A5",
          destructive: "#A6",
          info: "#A7",
        },
      });
      expect(result.intent.primary.dark).toBe("#A1");
      expect(result.intent["primary-text"].dark).toBe("#A2");
      expect(result.intent.accent.dark).toBe("#A3");
      expect(result.intent.success.dark).toBe("#A4");
      expect(result.intent.warning.dark).toBe("#A5");
      expect(result.intent.destructive.dark).toBe("#A6");
      expect(result.intent.info.dark).toBe("#A7");
    });

    it("does not mutate intent/hairline groups in the input", () => {
      const tokens = buildMockTokens();
      const originalPrimary = tokens.intent.primary.dark;
      const originalHairline = tokens.hairline.default.dark;
      applyOverrides(tokens, {
        dark: { primary: "#000", hairline: "rgba(0,0,0,1)" },
      });
      expect(tokens.intent.primary.dark).toBe(originalPrimary);
      expect(tokens.hairline.default.dark).toBe(originalHairline);
    });
  });

  it("collapses border-default, border-muted, border-strong to transparent in both modes (borderless pattern)", () => {
    const tokens = buildMockTokens();
    const result = applyOverrides(tokens, {
      dark: {
        "border-default": "transparent",
        "border-muted": "transparent",
        "border-strong": "transparent",
      },
      light: {
        "border-default": "transparent",
        "border-muted": "transparent",
        "border-strong": "transparent",
      },
    });

    // All three structural border tokens collapse to transparent in both modes
    expect(result.border.default.dark).toBe("transparent");
    expect(result.border.default.light).toBe("transparent");
    expect(result.border.muted.dark).toBe("transparent");
    expect(result.border.muted.light).toBe("transparent");
    expect(result.border.strong.dark).toBe("transparent");
    expect(result.border.strong.light).toBe("transparent");

    // Feedback/accessibility borders (input, focus, error) remain visible
    expect(result.border.input.light).toBe("#d1d5db");
    expect(result.border.input.dark).toBe("#4b5563");
    expect(result.border.focus.light).toBe("#2563eb");
    expect(result.border.focus.dark).toBe("#3b82f6");
    expect(result.border.error.light).toBe("#ef4444");
    expect(result.border.error.dark).toBe("#f87171");
  });
});
