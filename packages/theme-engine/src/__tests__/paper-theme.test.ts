/**
 * VI-749: Paper, the shared Low Orbit theme (light "Paper", dark "Paper at night").
 *
 * Pins three things: the theme applies in both modes, it carries the desk scale and the
 * 12 project hues as theme data, and every text pair a Visor component draws clears
 * WCAG AA (VI-746). The pair list follows the LO-308 browser measurement: every text
 * role on every plain surface, status text on its own surfaces, inverse text on strong
 * fills, each interactive text on its fills, and the segmented control's bound pair.
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { generateThemeData } from "../pipeline.js";
import { docsAdapter } from "../adapters/docs.js";
import { nextjsAdapter } from "../adapters/nextjs.js";
import { compositeOverBackground, getContrastRatio, parseColor, rgbToHex } from "../color.js";
import type { SemanticTokens } from "../types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const YAML = readFileSync(resolve(__dirname, "../../../../themes/paper.visor.yaml"), "utf-8");
const data = generateThemeData(YAML);
const MODES = ["light", "dark"] as const;
type Mode = (typeof MODES)[number];

const HUES = [75, 99, 123, 147, 171, 195, 219, 243, 267, 291, 315, 339];
const STATUS = ["error", "success", "warning", "info"] as const;

function token(tokens: SemanticTokens, name: string, mode: Mode): string {
  for (const group of ["text", "surface", "interactive"] as const) {
    const prefix = `${group}-`;
    if (name.startsWith(prefix) && name.slice(prefix.length) in tokens[group]) {
      return tokens[group][name.slice(prefix.length)][mode];
    }
  }
  throw new Error(`unknown token ${name}`);
}

/** Opaque hex for a colour drawn over `under` (hex). Fails on anything unresolvable. */
function flatten(value: string, under: string): string {
  const parsed = parseColor(value);
  if (!parsed) throw new Error(`cannot resolve ${value}`);
  const base = parseColor(under)!.rgb;
  return rgbToHex(compositeOverBackground(parsed, base));
}

function ratio(text: string, surface: string, mode: Mode, tokens = data.tokens): number {
  const page = token(tokens, "surface-page", mode);
  const bg = flatten(surface.startsWith("#") || surface.startsWith("rgb") ? surface : token(tokens, surface, mode), page);
  const fg = flatten(text.startsWith("#") || text.startsWith("rgb") ? text : token(tokens, text, mode), bg);
  return getContrastRatio(fg, bg);
}

function textPairs(tokens: SemanticTokens): [string, string][] {
  const surfaces = Object.keys(tokens.surface).map((k) => `surface-${k}`);
  const plain = surfaces.filter(
    (s) =>
      !/-(default|strong|overlay)$/.test(s) &&
      !/^surface-(error|success|warning|info)-/.test(s) &&
      !/^surface-elev-\d$/.test(s),
  );
  const strong = surfaces.filter((s) => /-(default|strong)$/.test(s) && s !== "surface-interactive-default");
  const text = ["primary", "secondary", "tertiary", "muted", "link", "link-hover", ...STATUS].map((t) => `text-${t}`);

  const pairs: [string, string][] = [];
  for (const t of text) for (const s of plain) pairs.push([t, s]);
  for (const k of STATUS)
    for (const s of surfaces.filter((x) => x.startsWith(`surface-${k}-`) && !x.endsWith("-default"))) pairs.push([`text-${k}`, s]);
  for (const t of ["text-inverse", "text-inverse-secondary"]) for (const s of strong) pairs.push([t, s]);
  for (const kind of ["primary", "secondary", "destructive"])
    for (const bg of Object.keys(tokens.interactive).filter((k) => k.startsWith(`${kind}-bg`)))
      pairs.push([`interactive-${kind}-text`, `interactive-${bg}`]);
  return pairs;
}

describe("VI-749: paper theme", () => {
  it("applies in both modes with the docs and nextjs adapters", () => {
    expect(data.config.name).toBe("paper");
    expect(data.output.lightCss.length).toBeGreaterThan(0);
    expect(data.output.darkCss.length).toBeGreaterThan(0);
    const docs = docsAdapter(data);
    expect(docs).toContain(".paper-theme");
    expect(docs).toContain("Satoshi");
    expect(nextjsAdapter(data)).toContain("--paper-desk-title: 900 34px/38px");
  });

  it("carries the desk scale: type roles, 36px controls, desk corners", () => {
    const css = nextjsAdapter(data);
    for (const decl of [
      "--paper-desk-title: 900 34px/38px",
      "--paper-desk-title-2: 900 22px/27px",
      "--paper-desk-row: 600 15px/20px",
      "--paper-desk-body: 500 14px/20px",
      "--paper-desk-sub: 400 13px/18px",
      "--paper-desk-label: 700 11px/16px",
      "--paper-track-label: 0.08em",
      "--paper-control-h: 36px",
      "--paper-radius-sheet: 28px",
      "--radius-sm: 0.625rem",
      "--radius-md: 0.875rem",
      "--radius-lg: 1.25rem",
      "--radius-xl: 1.5rem",
      "--button-md-height: 36px",
      "--input-md-height: 36px",
    ]) {
      expect(css, decl).toContain(decl);
    }
  });

  it("declares the field family, a fill and no edge, in both modes (VI-754)", () => {
    const fields = ["input", "textarea", "select", "number-input", "tag-input", "combobox", "otp"];
    for (const mode of MODES) {
      const o = data.config.overrides![mode]!;
      for (const f of fields) {
        expect(o[`${f}-bg`], `${mode} ${f}-bg`).toMatch(/^rgba\(/);
        expect(o[`${f}-border`], `${mode} ${f}-border`).toBe("transparent");
      }
    }
    for (const css of [nextjsAdapter(data), docsAdapter(data)]) {
      expect(css).toContain("--input-bg: rgba(30, 31, 33, 0.06)");
      expect(css).toContain("--input-bg: rgba(245, 245, 240, 0.06)");
      expect(css).toContain("--otp-border: transparent");
    }
  });

  it("sets the 13px desk type floor on the ramp (VI-754)", () => {
    for (const css of [nextjsAdapter(data), docsAdapter(data)]) {
      expect(css).toContain("--font-size-xs: 0.8125rem; /* 13px */");
      expect(css).toContain("--font-size-sm: 0.875rem; /* 14px */");
    }
  });

  it("ships the 12 project hues as theme data in both modes", () => {
    for (const mode of MODES) {
      const overrides = data.config.overrides?.[mode] ?? {};
      for (const h of HUES)
        for (const role of ["fill", "fill-strong", "ink", "solid"])
          expect(overrides[`paper-hue-${h}-${role}`], `${mode} hue ${h} ${role}`).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("draws every project hue's ink on its own fills at AA", () => {
    for (const mode of MODES) {
      const o = data.config.overrides![mode]!;
      for (const h of HUES)
        for (const fill of ["fill", "fill-strong"])
          expect(getContrastRatio(o[`paper-hue-${h}-ink`], o[`paper-hue-${h}-${fill}`]), `${mode} hue ${h} ink on ${fill}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("clears AA on every text pair a component draws, in both modes (VI-746)", () => {
    const fails: string[] = [];
    for (const mode of MODES) {
      for (const [t, s] of textPairs(data.tokens)) {
        const r = ratio(t, s, mode);
        if (r < 4.5) fails.push(`${mode} ${r.toFixed(2)} ${t} on ${s}`);
      }
      const seg = { light: ["#1e1f21", "#f7f6f2"], dark: ["#f5f5f0", "#3d4245"] }[mode];
      const segRatio = ratio(seg[0], seg[1], mode);
      if (segRatio < 4.5) fails.push(`${mode} ${segRatio.toFixed(2)} segmented-control indicator-text on indicator-bg`);
    }
    expect(fails).toEqual([]);
  });

  it("closes the pairs LO-308 measured under AA", () => {
    const vi746: [Mode, string, string][] = [
      ["light", "text-error", "surface-error-soft"],
      ["light", "text-success", "surface-success-soft"],
      ["light", "text-warning", "surface-warning-soft"],
      ["dark", "text-error", "surface-error-soft"],
      ["dark", "text-success", "surface-success-soft"],
      ["dark", "text-warning", "surface-warning-soft"],
      ["light", "text-inverse", "surface-error-default"],
      ["light", "text-inverse", "surface-success-default"],
      ["light", "text-inverse", "surface-warning-default"],
      ["light", "text-inverse", "surface-info-default"],
      ["dark", "text-inverse", "surface-accent-default"],
      ["dark", "interactive-primary-text", "interactive-primary-bg-hover"],
      ["light", "interactive-destructive-text", "interactive-destructive-bg"],
      ["dark", "interactive-destructive-text", "interactive-destructive-bg"],
    ];
    for (const [mode, t, s] of vi746) expect(ratio(t, s, mode), `${mode} ${t} on ${s}`).toBeGreaterThanOrEqual(4.5);
  });

  it("draws the AdminShell by tone, not rules (VI-753)", () => {
    const css = nextjsAdapter(data);
    for (const slot of ["sidebar", "sidebar-header", "sidebar-footer", "topbar"]) {
      expect(css).toContain(`--admin-shell-${slot}-border: none;`);
    }
    expect(css).toContain("--admin-shell-topbar-bg: var(--surface-page);");
  });

  it("draws the ProportionBar's parts at 3:1 on the card, coral named in AA text (VI-766)", () => {
    const pb = data.config.components!["proportion-bar"] as Record<string, string | { light: string; dark: string }>;
    const at = (key: string, mode: Mode) => {
      const v = pb[key];
      return typeof v === "string" ? v : v[mode];
    };
    const fails: string[] = [];
    for (const mode of MODES) {
      for (const key of ["fill-1", "fill-2", "fill-3", "fill-4", "hatch-color", "stripe-a", "stripe-b"]) {
        const r = ratio(at(key, mode), "surface-card", mode);
        if (r < 3) fails.push(`${mode} ${r.toFixed(2)} ${key} on surface-card`);
      }
      // Coral fills under 3:1 on the light card, so the legend names it in text-error.
      for (const t of ["text-error", "text-primary", "text-secondary"]) {
        const r = ratio(t, "surface-card", mode);
        if (r < 4.5) fails.push(`${mode} ${r.toFixed(2)} legend ${t} on surface-card`);
      }
    }
    expect(fails).toEqual([]);
    expect(at("alert-bg", "light")).toBe("#f28b6d");
  });

  it("folds the AdminShell sidebar on Paper's 480ms ease (VI-770)", () => {
    const css = nextjsAdapter(data);
    expect(css).toContain("--admin-shell-rail-duration: 480ms;");
    expect(css).toContain("--admin-shell-rail-easing: cubic-bezier(0.2, 0.8, 0.2, 1);");
  });

  it("draws the LayerChart's investment and unresolved blocks with AA text (VI-769)", () => {
    const lc = data.config.components!["layer-chart"] as Record<string, { light: string; dark: string }>;
    const mix = (a: string, b: string, p: number) => {
      const [x, y] = [parseColor(a)!.rgb, parseColor(b)!.rgb];
      return rgbToHex(x.map((c, i) => c * p + y[i] * (1 - p)) as typeof x);
    };
    const fails: string[] = [];
    for (const mode of MODES) {
      const page = token(data.tokens, "surface-page", mode);
      const [fill, strong, ink] = [lc["investment-fill"][mode], lc["investment-fill-strong"][mode], lc["investment-ink"][mode]];
      // The layer steps the chart draws: strong, 68% and 38% of strong into fill, fill, 66% of fill into the page.
      const steps = [strong, mix(strong, fill, 0.68), mix(strong, fill, 0.38), fill, mix(fill, page, 0.66)];
      for (const s of steps) if (ratio(ink, s, mode) < 4.5) fails.push(`${mode} ink on ${s}`);
      if (ratio("text-error", lc["alert-fill"][mode], mode) < 4.5) fails.push(`${mode} text-error on alert-fill`);
    }
    expect(fails).toEqual([]);
    // Unresolved is coral mixed into the page: 40% light, 30% at night (LO-343).
    expect(lc["alert-fill"].light).toBe(mix("#f28b6d", "#fcfcfb", 0.4));
    expect(lc["alert-fill"].dark).toBe(mix("#f28b6d", "#0c1015", 0.3));
  });

  it("stripes the billing slider's gap in Emerald, money at stake, in both modes (VI-768)", () => {
    const css = nextjsAdapter(data);
    expect(css).toContain("--billing-slider-gap-color: #0b6e4f;");
    expect(css).toContain("--billing-slider-gap-color: #5fd4a8;");
  });

  it("keeps Paper's colours: grounds, cards, ink, Tide and coral", () => {
    const t = data.tokens;
    expect(token(t, "surface-page", "light")).toBe("#fcfcfb");
    expect(token(t, "surface-card", "light")).toBe("#f7f6f2");
    expect(token(t, "surface-page", "dark")).toBe("#0c1015");
    expect(token(t, "surface-card", "dark")).toBe("#151b20");
    expect(token(t, "text-primary", "light")).toBe("#1e1f21");
    expect(token(t, "text-primary", "dark")).toBe("#f5f5f0");
    expect(token(t, "interactive-primary-bg", "light")).toBe("#1a5f7a");
    expect(token(t, "surface-error-default", "dark")).toBe("#f28b6d");
  });
});
