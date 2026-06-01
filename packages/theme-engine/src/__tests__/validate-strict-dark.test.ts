/**
 * Tests for the --strict-dark / strictDark validator option (VI-495).
 *
 * Verifies that:
 * - Without strictDark, DARK_LIGHT_PARITY issues are warnings (non-blocking).
 * - With strictDark, DARK_LIGHT_PARITY issues are promoted to errors (blocking).
 * - A theme with colors.neutral and no colors-dark.neutral fails under strictDark.
 * - A theme with both colors.neutral and colors-dark.neutral passes under strictDark.
 * - A theme with no colors.neutral at all passes under strictDark.
 * - Dark-only extra keys always emit warnings, never errors, even under strictDark.
 */

import { describe, it, expect } from "vitest";
import { validate } from "../validate.js";
import type { VisorThemeConfig } from "../types.js";

// ============================================================
// Fixtures
// ============================================================

/** A theme with a custom neutral but no dark override — the convergent-theme pattern. */
const LIGHT_NEUTRAL_ONLY: VisorThemeConfig = {
  name: "Brand Light Only",
  version: 1,
  colors: {
    primary: "#6366f1",
    neutral: "#6B7280",
  },
};

/** Same brand, compliant: dark neutral provided. */
const BOTH_MODES_NEUTRAL: VisorThemeConfig = {
  name: "Brand Both Modes",
  version: 1,
  colors: {
    primary: "#6366f1",
    neutral: "#7c6f9b",
  },
  "colors-dark": {
    neutral: "#3d3554",
  },
};

/** Multiple light-only colors, no colors-dark at all. */
const FULL_LIGHT_NO_DARK: VisorThemeConfig = {
  name: "Light Only Full",
  version: 1,
  colors: {
    primary: "#2563EB",
    accent: "#8B5CF6",
    neutral: "#6B7280",
    background: "#FFFFFF",
    surface: "#FFFFFF",
  },
};

/** Minimal theme with only primary — no neutral, no dark section. Should always pass. */
const PRIMARY_ONLY: VisorThemeConfig = {
  name: "Primary Only",
  version: 1,
  colors: {
    primary: "#2563EB",
  },
};

/**
 * Theme with neutral in both modes, plus an extra key only in dark.
 * The extra-dark-key path should always be a warning, not an error.
 */
const DARK_HAS_EXTRA_KEY: VisorThemeConfig = {
  name: "Dark Extra Key",
  version: 1,
  colors: {
    primary: "#6366f1",
    neutral: "#6B7280",
  },
  "colors-dark": {
    neutral: "#3d3554",
    background: "#0a0a0a",
  },
};

// ============================================================
// Non-strict mode: DARK_LIGHT_PARITY stays as warning
// ============================================================

describe("validate — non-strict mode (default)", () => {
  it("emits DARK_LIGHT_PARITY as warning (not error) when neutral is missing from dark", () => {
    const result = validate(LIGHT_NEUTRAL_ONLY);
    expect(result.valid).toBe(true);

    const parityErrors = result.errors.filter((e) => e.code === "DARK_LIGHT_PARITY");
    expect(parityErrors).toHaveLength(0);

    const parityWarns = result.warnings.filter((w) => w.code === "DARK_LIGHT_PARITY");
    expect(parityWarns.length).toBeGreaterThan(0);
  });

  it("emits DARK_LIGHT_PARITY as warning when no dark section exists at all", () => {
    const result = validate(FULL_LIGHT_NO_DARK);
    expect(result.valid).toBe(true);

    const parityWarns = result.warnings.filter((w) => w.code === "DARK_LIGHT_PARITY");
    expect(parityWarns.length).toBeGreaterThan(0);
  });

  it("passes cleanly with only primary (no neutral)", () => {
    const result = validate(PRIMARY_ONLY);
    expect(result.valid).toBe(true);
    const parityIssues = [
      ...result.errors.filter((e) => e.code === "DARK_LIGHT_PARITY"),
      ...result.warnings.filter((w) => w.code === "DARK_LIGHT_PARITY"),
    ];
    expect(parityIssues).toHaveLength(0);
  });

  it("passes with neutral in both light and dark", () => {
    const result = validate(BOTH_MODES_NEUTRAL);
    expect(result.valid).toBe(true);
    const parityErrors = result.errors.filter((e) => e.code === "DARK_LIGHT_PARITY");
    expect(parityErrors).toHaveLength(0);
  });
});

// ============================================================
// Strict-dark mode: DARK_LIGHT_PARITY promoted to error
// ============================================================

describe("validate — strictDark: true", () => {
  it("promotes DARK_LIGHT_PARITY to error when neutral is missing from dark", () => {
    const result = validate(LIGHT_NEUTRAL_ONLY, { strictDark: true });
    expect(result.valid).toBe(false);

    const parityErrors = result.errors.filter((e) => e.code === "DARK_LIGHT_PARITY");
    expect(parityErrors.length).toBeGreaterThan(0);
    expect(parityErrors[0].severity).toBe("error");

    // Must not also appear in warnings
    const parityWarns = result.warnings.filter((w) => w.code === "DARK_LIGHT_PARITY");
    expect(parityWarns).toHaveLength(0);
  });

  it("promotes to error when no colors-dark section exists at all", () => {
    const result = validate(FULL_LIGHT_NO_DARK, { strictDark: true });
    expect(result.valid).toBe(false);

    const parityErrors = result.errors.filter((e) => e.code === "DARK_LIGHT_PARITY");
    expect(parityErrors.length).toBeGreaterThan(0);
    expect(parityErrors[0].severity).toBe("error");
  });

  it("passes a theme that supplies both colors.neutral and colors-dark.neutral", () => {
    const result = validate(BOTH_MODES_NEUTRAL, { strictDark: true });
    expect(result.valid).toBe(true);

    const parityErrors = result.errors.filter((e) => e.code === "DARK_LIGHT_PARITY");
    expect(parityErrors).toHaveLength(0);
  });

  it("passes a theme with only primary (no neutral) under strict-dark", () => {
    const result = validate(PRIMARY_ONLY, { strictDark: true });
    expect(result.valid).toBe(true);

    const parityErrors = result.errors.filter((e) => e.code === "DARK_LIGHT_PARITY");
    expect(parityErrors).toHaveLength(0);
  });

  it("dark-only extra key stays a warning, never an error, even under strictDark", () => {
    const result = validate(DARK_HAS_EXTRA_KEY, { strictDark: true });

    // The extra key (background) is only in dark but not in light — this direction
    // is always a warning regardless of strictDark
    const darkOnlyWarns = result.warnings.filter(
      (w) => w.code === "DARK_LIGHT_PARITY" && w.path === "colors"
    );
    expect(darkOnlyWarns.length).toBeGreaterThan(0);
    expect(darkOnlyWarns[0].severity).toBe("warning");
  });

  it("error points to colors-dark as the missing path", () => {
    const result = validate(LIGHT_NEUTRAL_ONLY, { strictDark: true });
    const parityErrors = result.errors.filter((e) => e.code === "DARK_LIGHT_PARITY");
    expect(parityErrors.length).toBeGreaterThan(0);
    expect(parityErrors[0].path).toBe("colors-dark");
  });

  it("result.valid is false (non-zero exit) under strictDark with missing dark neutral", () => {
    const result = validate(LIGHT_NEUTRAL_ONLY, { strictDark: true });
    expect(result.valid).toBe(false);
  });
});
