# W032 — Floating panels must fill with an opaque surface, never a bare `--surface-card`

**Tags:** css, tokens, themes, floating-panel, dialog, popover, validator, coverage-hole

## The Lesson

A floating / portaled panel — a modal (`dialog`, `dialog-form`), popover, dropdown, command palette (`command-dialog`), tooltip, or toast — renders over the dimmed backdrop with **no opaque layer behind it**. Its background fill is therefore the only thing between the viewer and the scrim + page. It **must be opaque**.

`--surface-card` is a *card-in-flow* token. A theme may legitimately make it **translucent glass** — `blackout` (the docs default) and `modern-minimal` set `--surface-card: rgba(255,255,255,0.04)`, designed to layer over the opaque `--surface-page`. That's correct for a card sitting on the page. Used as a **floating panel's** primary fill, the 4%-white glass has nothing opaque behind it and reads straight through to the dimmed page — a "partially transparent" panel.

**Fix:** fill floating panels with `var(--surface-popover, var(--surface-page, #ffffff))`. `--surface-popover` is the purpose-built opaque floating-panel token (VI-209) and equals `--surface-card` on every solid theme (neutral `#18181b`, space `#0e0e18`), so the swap changes nothing where the panel already rendered correctly — only the glass-theme case is fixed.

## What Was Surprising

This bug shipped **three-plus times** (Select popover, DateRangePicker, then `dialog-form` + `command-dialog`) even though a prevention rule — `scripts/rules/floating-panel-opaque-bg.ts` — was written in the **same commit** (`e08e93be`, VI-209) that introduced `--surface-popover`. The guard existed the whole time; it just never fired on the offenders, because it had **four independent coverage holes**, any one of which was sufficient:

1. **Scope** — it globbed only `components/**`. `dialog-form` and `command-dialog` live in `blocks/`, which was never scanned.
2. **Name allowlist** — it fired only on a hardcoded `FLOATING_PANEL_NAMES` set (`popover`, `command`, `select`, …). The two blocks weren't in it, and `command-dialog` ≠ the listed `command`. Every new floating component had to be *remembered* into the list.
3. **Property** — it matched only `background-color:`. Both blocks used the `background:` **shorthand**.
4. **box-shadow gate** — reasonable in itself (it isolates the outermost elevated panel from inner backed surfaces), but combined with the above it meant even a scanned file could slip.

The deepest driver was the **hand-maintained allowlist** (hole 2): a lint that requires a human to enroll each new target reproduces the "codified but never adopted" gap it was meant to close. This is the same failure class as W-111.

## The Fix (VI-623)

Rewrote the rule to detect floating panels **structurally** and close every hole:

- **Detection by composition, not name:** a `.module.css` is a floating panel when its sibling `.tsx` renders a portaled atom — a Radix portal primitive (`@radix-ui/react-{dialog,popover,dropdown-menu,context-menu,menubar,hover-card,tooltip,select,toast}`), a composed Visor atom by import path (`…/dialog/dialog`, `…/command/command`), or `sonner`. A new floating block is covered automatically.
- **Scope:** scans `components/**` **and** `blocks/**`.
- **Property:** matches `background:` and `background-color:`.
- **Primary-token precision:** flags only when `--surface-card` is the **first** var() in the value. `var(--surface-elev, color-mix(… --surface-card …))` resolves to its opaque primary and is *not* flagged (dropdown-menu false positive avoided).
- **box-shadow gate kept** — isolates the outer elevated panel; inner backed wells (no shadow) are fine.
- **In-flow opt-out:** a static-positioned card that sits on the page (e.g. confirm-dialog's `.inlineSurface`) declares `/* opaque-bg-exempt: <reason> */` on or directly above the fill line.

Fixing the guard surfaced two more latent instances of the same bug that it now legitimately catches — the `dialog` atom's **editorial** variant and `session-timeout`'s card — both fixed in the same pass.

## How To Catch This Earlier

- New floating surface? Fill it with `var(--surface-popover, …)`, never a bare `--surface-card`. The validator now enforces it structurally.
- Any "partially transparent panel" report → check the panel's **primary** surface token against a **glass** theme (`blackout`, `modern-minimal`), not a solid one. Solid themes (`neutral`, `space`) hide the bug because their `--surface-card` is opaque.
- When you add a lint/guard, trigger it from an **intrinsic signal** (here: composing a portaled atom), not a hand-maintained list — or it will silently stop covering the next case.

## Canonical Example

`blocks/dialog-form/dialog-form.module.css` `.panel` and `blocks/command-dialog/command-dialog.module.css` `.command` (VI-622); the rewritten `scripts/rules/floating-panel-opaque-bg.ts` + `scripts/rules/__tests__/floating-panel-opaque-bg.test.ts` (VI-623).

## Adjacent Wisdom

- [W023](./W023-design-checker-regex-vs-postcss.md) — design-checker: regex over PostCSS, track selector context for multi-line rules.
- The BO-68 `token-resolution-transparency` rule (token-rules.md §13) — a *sibling* browser-based check for luminance intent-inversion (recessed/raised), a different axis from this alpha/opacity guard.
