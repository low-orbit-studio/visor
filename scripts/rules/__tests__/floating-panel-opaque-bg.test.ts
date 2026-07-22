import { describe, it, expect } from 'vitest';
import {
  floatingPanelOpaqueBg,
  isFloatingPanelSource,
  findFloatingBgViolations,
} from '../floating-panel-opaque-bg.js';

describe('floating-panel-opaque-bg rule', () => {
  it('has correct metadata and is a hard gate (not warn-only)', () => {
    expect(floatingPanelOpaqueBg.name).toBe('floating-panel-opaque-bg');
    expect(floatingPanelOpaqueBg.category).toBe('tokens');
    expect(floatingPanelOpaqueBg.warnOnly).toBeFalsy();
  });

  describe('isFloatingPanelSource — structural detection (replaces the name allowlist)', () => {
    it('detects a Radix portal primitive', () => {
      expect(isFloatingPanelSource('import * as X from "@radix-ui/react-popover"')).toBe(true);
      expect(isFloatingPanelSource('import { Root } from "@radix-ui/react-dialog"')).toBe(true);
    });

    it('detects a composed Visor portaled atom by import path (the VI-620/386 miss)', () => {
      // dialog-form / command-dialog compose the dialog atom — this is exactly
      // the case the old name-allowlist forgot.
      expect(isFloatingPanelSource('import { DialogContent } from "../../components/ui/dialog/dialog"')).toBe(true);
      expect(isFloatingPanelSource('import { Command } from "../command/command"')).toBe(true);
    });

    it('detects sonner (toast\'s portaled toaster)', () => {
      expect(isFloatingPanelSource('import { Toaster } from "sonner"')).toBe(true);
    });

    it('does NOT treat a plain in-flow component as floating', () => {
      expect(isFloatingPanelSource('import { cn } from "../../lib/utils"\nimport styles from "./card.module.css"')).toBe(false);
      // A non-portal Radix primitive (slider is inline) is not a floating panel.
      expect(isFloatingPanelSource('import * as S from "@radix-ui/react-slider"')).toBe(false);
    });
  });

  describe('findFloatingBgViolations — the four closed holes', () => {
    it('flags a primary bare --surface-card on a box-shadow\'d panel (the core bug)', () => {
      const css = `.panel {\n  background-color: var(--surface-card, #fff);\n  box-shadow: var(--shadow-lg);\n}`;
      expect(findFloatingBgViolations(css)).toEqual([2]);
    });

    it('HOLE 3 — flags the `background:` shorthand, not only `background-color:`', () => {
      // The exact shape dialog-form/command-dialog used; the old rule matched
      // only `background-color:` and missed this.
      const css = `.panel {\n  background: var(--surface-card, #fff);\n  box-shadow: var(--shadow-lg);\n}`;
      expect(findFloatingBgViolations(css)).toEqual([2]);
    });

    it('HOLE 4-safe — keeps the box-shadow gate (inner backed surfaces are fine)', () => {
      const css = `.well {\n  background: var(--surface-card);\n}`;
      expect(findFloatingBgViolations(css)).toEqual([]);
    });

    it('does NOT flag surface-elev-primary color-mix (dropdown-menu false positive)', () => {
      const css = `.menu {\n  background: var(--surface-elev, color-mix(in srgb, var(--surface-card), var(--surface-muted)));\n  box-shadow: var(--shadow-lg);\n}`;
      expect(findFloatingBgViolations(css)).toEqual([]);
    });

    it('does NOT flag when the panel already uses surface-popover', () => {
      const css = `.panel {\n  background: var(--surface-popover, var(--surface-page, #fff));\n  box-shadow: var(--shadow-lg);\n}`;
      expect(findFloatingBgViolations(css)).toEqual([]);
    });

    it('respects an inline `opaque-bg-exempt` marker (in-flow static cards)', () => {
      const onLine = `.card {\n  background-color: var(--surface-card); /* opaque-bg-exempt: in-flow */\n  box-shadow: var(--shadow-lg);\n}`;
      expect(findFloatingBgViolations(onLine)).toEqual([]);
      const above = `.card {\n  /* opaque-bg-exempt: in-flow static card */\n  background-color: var(--surface-card);\n  box-shadow: var(--shadow-lg);\n}`;
      expect(findFloatingBgViolations(above)).toEqual([]);
    });

    it('regression lock — the pre-VI-622 dialog-form panel would fail today', () => {
      // Reverting VI-622 (surface-card back on the shadowed floating panel)
      // must be caught, not shipped.
      const preFix = `.panel {\n  border-radius: var(--radius-xl);\n  padding: var(--spacing-5);\n  background: var(--surface-card, #ffffff);\n  box-shadow: var(--shadow-lg);\n}`;
      expect(findFloatingBgViolations(preFix)).toEqual([4]);
    });
  });

  it('passes against the reconciled repo (every floating panel is opaque)', async () => {
    const results = await floatingPanelOpaqueBg.run();
    const failures = results.filter((r) => !r.pass);
    expect(
      failures,
      `Expected zero floating-panel violations but got:\n${failures
        .map((f) => `${f.file}:${f.line} ${f.message}`)
        .join('\n')}`,
    ).toHaveLength(0);
  });
});
