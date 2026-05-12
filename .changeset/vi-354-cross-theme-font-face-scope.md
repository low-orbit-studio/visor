---
"@loworbitstudio/visor-theme-engine": minor
---

VI-354 fix: scope cross-theme `@font-face` declarations by aliasing the family name per theme so co-loaded themes don't overwrite each other's per-theme properties (e.g. `size-adjust`).

When two themes that share a visor-fonts family (e.g. both reference `PP Model Mono`) declared different `typography.scale` values, the generated `@font-face` blocks collided globally — the later-declared theme's `size-adjust` silently overrode the earlier theme's for shared weights, corrupting typography rendering in the earlier theme without warning.

The fix aliases each theme's visor-fonts `@font-face` family as `"{family} [{theme-slug}]"` in both the docs and nextjs adapters. The theme's `--font-*` CSS vars now list the aliased name first with the bare family as a fallback, so DevTools surface the alias for debugging and the cascade has a graceful-degradation hint. No `.visor.yaml` changes required — the fix is contained in the engine's CSS emitter.

**Consumer migration note:** The engine no longer emits an `@font-face` block for the bare family name. Consumer CSS that hardcodes `font-family: "PP Model Mono"` (or any bare visor-fonts family name) will no longer load that font — the browser falls through to system fonts. **Always reference fonts through `var(--font-heading)` / `var(--font-sans)` / `var(--font-mono)` / etc.** The bare family in those stacks is a fallback hint, not a registered font.

Affects: themes that share a visor-fonts family across multiple co-loaded themes will start emitting aliased `@font-face` family names. Themes using only Google Fonts or local fonts are unaffected.
