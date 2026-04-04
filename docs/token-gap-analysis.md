# Token System Gap Analysis

**Ticket:** [VI-123](https://linear.app/low-orbit-studio/issue/VI-123/token-system-gap-analysis)
**Depends on:** [VI-122](https://linear.app/low-orbit-studio/issue/VI-122/token-architecture-research-spike) — Token Architecture Research Spike

---

## Executive Summary

**Recommendation: Modify in place.**

The token system does not need a rebuild. The 3-tier architecture is sound. The semantic and adaptive layers are correct. The only problem is the primitive color layer, which hardcodes Tailwind palette names (`gray`, `blue`, `green`) instead of role names (`neutral`, `primary`, `success`). The fix is a rename across 3 source files and 11 component CSS files — a mechanical find-and-replace, not a rethink.

The migration leaves 793 semantic token references across 114 component files completely untouched. Consumer component code does not change.

---

## Current System Inventory

### Tier 1 — Primitive Tokens (`packages/tokens/src/tokens/primitives.ts`)

**Color primitives: 47 tokens** (the problem tier)

| Category | CSS Variable Pattern | Count | Shade Steps |
|----------|---------------------|-------|-------------|
| Gray | `--color-gray-{step}` | 11 | 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950 |
| Blue | `--color-blue-{step}` | 10 | 50, 100, 200, 300, 400, 500, 600, 700, 800, 900 |
| Green | `--color-green-{step}` | 6 | 50, 100, 500, 600, 700, 900 |
| Amber | `--color-amber-{step}` | 6 | 50, 100, 500, 600, 700, 900 |
| Red | `--color-red-{step}` | 6 | 50, 100, 500, 600, 700, 900 |
| Sky | `--color-sky-{step}` | 6 | 50, 100, 500, 600, 700, 900 |
| Pure | `--color-white`, `--color-black` | 2 | — |

**Non-color primitives: 71 tokens** — spacing (13), radius (8), border widths (4), font sizes (8), font weights (4), line heights (6), shadows (5), z-index (7), font families (2), overlay (1), focus ring (2), motion durations (6), motion easings (5)

Non-color primitives are already role-named (`--spacing-4`, `--radius-md`, `--shadow-sm`). They do not need to change.

### Tier 2 — Semantic Tokens (`packages/tokens/src/tokens/semantic.ts`)

**87 semantic tokens** across 8 categories:

| Category | CSS Prefix | Count |
|----------|-----------|-------|
| Text | `--text-*` | 12 |
| Surface | `--surface-*` | 20 |
| Border | `--border-*` | 9 |
| Interactive | `--interactive-*` | 14 |
| Spacing | `--component-*`, `--layout-*` | 10 |
| Typography | `--font-body`, `--size-*`, `--weight-*` | 15 |
| Motion duration | `--motion-duration-*` | 3 |
| Motion easing | `--motion-easing-*` | 4 |

The semantic category names are solid. They require no changes — only the internal color references change.

### Tier 3 — Adaptive Tokens (`packages/tokens/src/tokens/adaptive.ts`)

**55 light/dark token pairs** covering all color categories:
- Text: 12 pairs
- Surface: 20 pairs
- Border: 9 pairs
- Interactive: 14 pairs

The adaptive mechanics (CSS class switching, `prefers-color-scheme` fallback) are correct. No changes to structure.

---

## Token-by-Token Mapping

### Primitive Color Renames

The mapping is a direct palette name → role name rename. Step numbers stay the same — no reshuffling.

**Neutral (gray → neutral)**

| Current | New | Action |
|---------|-----|--------|
| `--color-gray-50` | `--color-neutral-50` | Rename |
| `--color-gray-100` | `--color-neutral-100` | Rename |
| `--color-gray-200` | `--color-neutral-200` | Rename |
| `--color-gray-300` | `--color-neutral-300` | Rename |
| `--color-gray-400` | `--color-neutral-400` | Rename |
| `--color-gray-500` | `--color-neutral-500` | Rename |
| `--color-gray-600` | `--color-neutral-600` | Rename |
| `--color-gray-700` | `--color-neutral-700` | Rename |
| `--color-gray-800` | `--color-neutral-800` | Rename |
| `--color-gray-900` | `--color-neutral-900` | Rename |
| `--color-gray-950` | `--color-neutral-950` | Rename |

**Primary (blue → primary)**

| Current | New | Action |
|---------|-----|--------|
| `--color-blue-50` | `--color-primary-50` | Rename |
| `--color-blue-100` | `--color-primary-100` | Rename |
| `--color-blue-200` | `--color-primary-200` | Rename |
| `--color-blue-300` | `--color-primary-300` | Rename |
| `--color-blue-400` | `--color-primary-400` | Rename |
| `--color-blue-500` | `--color-primary-500` | Rename |
| `--color-blue-600` | `--color-primary-600` | Rename |
| `--color-blue-700` | `--color-primary-700` | Rename |
| `--color-blue-800` | `--color-primary-800` | Rename |
| `--color-blue-900` | `--color-primary-900` | Rename |

Blue has no 950 step. The theme engine generates a full 11-step scale (adds 950). Net: +1 token.

**Success (green → success)**

| Current | New | Action |
|---------|-----|--------|
| `--color-green-50` | `--color-success-50` | Rename |
| `--color-green-100` | `--color-success-100` | Rename |
| — | `--color-success-200` | New (OKLCH generated) |
| — | `--color-success-300` | New (OKLCH generated) |
| — | `--color-success-400` | New (OKLCH generated) |
| `--color-green-500` | `--color-success-500` | Rename |
| `--color-green-600` | `--color-success-600` | Rename |
| `--color-green-700` | `--color-success-700` | Rename |
| — | `--color-success-800` | New (OKLCH generated) |
| `--color-green-900` | `--color-success-900` | Rename |
| — | `--color-success-950` | New (OKLCH generated) |

**Warning (amber → warning)**, **Error (red → error)**, **Info (sky → info)** follow the same pattern as success: 6 existing tokens renamed, 5 new steps added via OKLCH generation.

**Pure colors**

| Current | New | Action |
|---------|-----|--------|
| `--color-white` | `--color-white` | Keep |
| `--color-black` | `--color-black` | Keep |

White and black are not palette-coupled. They stay.

**Total primitive color change:** 47 tokens → 84 tokens (+37 via OKLCH scale expansion for status roles)

### Non-Color Primitives

No changes. All 71 non-color tokens are already role-named and structurally correct.

### Semantic Token Reference Updates

Semantic token names stay identical. Only the internal color references change.

| Category | Tokens | Refs Updating | Example |
|----------|--------|--------------|---------|
| Text (semantic.ts) | 12 | 12 refs | `"color-gray-900"` → `"color-neutral-900"` |
| Surface (semantic.ts) | 20 | 20 refs | `"color-blue-50"` → `"color-primary-50"` |
| Border (semantic.ts) | 9 | 9 refs | `"color-gray-200"` → `"color-neutral-200"` |
| Interactive (semantic.ts) | 14 | 14 refs | `"color-blue-600"` → `"color-primary-600"` |
| **semantic.ts total** | **55** | **55 refs** | |
| Text (adaptive.ts) | 12 pairs | 24 refs | |
| Surface (adaptive.ts) | 20 pairs | 40 refs | |
| Border (adaptive.ts) | 9 pairs | 18 refs | |
| Interactive (adaptive.ts) | 14 pairs | 28 refs | |
| **adaptive.ts total** | **55** | **110 refs** | |

All updates are mechanical: `color-gray-*` → `color-neutral-*`, `color-blue-*` → `color-primary-*`, `color-green-*` → `color-success-*`, `color-amber-*` → `color-warning-*`, `color-red-*` → `color-error-*`, `color-sky-*` → `color-info-*`. Step numbers do not change.

### Component CSS Fixes (Primitive Leaks)

64 component CSS files reference primitive color tokens directly — a violation of the convention that components should use semantic tokens only. These 11 files have 64 total refs:

| File | Refs | Required Action |
|------|------|----------------|
| `components/ui/sidebar/sidebar.module.css` | 29 | Replace with semantic tokens |
| `packages/docs/components/props-table.module.css` | 15 | Replace with semantic tokens |
| `components/deck/deck-footer/deck-footer.module.css` | 5 | Replace with semantic tokens |
| `packages/docs/components/theme-switcher.module.css` | 3 | Replace with semantic tokens |
| `components/deck/toc-slide/toc-slide.module.css` | 3 | Replace with semantic tokens |
| `packages/docs/app/globals.css` | 2 | Replace with semantic tokens |
| `components/ui/chart/chart.module.css` | 2 | Replace with semantic tokens |
| `components/deck/dot-nav/dot-nav.module.css` | 2 | Replace with semantic tokens |
| `packages/docs/app/create/components/spacing-controls.module.css` | 1 | Replace with semantic tokens |
| `components/deck/slide/slide.module.css` | 1 | Replace with semantic tokens |
| `components/deck/slide-header/slide-header.module.css` | 1 | Replace with semantic tokens |

Note: The `chart.module.css` case may require new semantic tokens if chart-specific palette access is genuinely needed (e.g., `--color-success-3` for a subtle chart fill). This is the one case where a judgment call is needed during implementation.

---

## Blast Radius

### What Changes

| Scope | Files | Refs |
|-------|-------|------|
| `packages/tokens/src/tokens/primitives.ts` | 1 | Full rewrite of color section |
| `packages/tokens/src/tokens/semantic.ts` | 1 | 55 ref updates |
| `packages/tokens/src/tokens/adaptive.ts` | 1 | 110 ref updates |
| Component CSS leaks (11 files) | 11 | 64 ref updates |
| `packages/tokens/src/generate/generate-css.ts` | 1 | No change (already role-agnostic) |
| **Total** | **14 files** | **~229 targeted changes** |

### What Does NOT Change

| Scope | Files | Refs |
|-------|-------|------|
| Component CSS files using semantic tokens | 114 | 793 |
| TypeScript component source files | All | All |
| Theme engine pipeline | All | All |
| `.visor.yaml` theme configs | All | All |
| Consumer project code | All | All |

The 793 semantic token references (`--text-primary`, `--surface-card`, etc.) across 114 component files are completely untouched. This is the correct blast radius for a primitive rename.

---

## shadcn Compatibility Assessment

**Result: Partial. Visor's naming is a superset — Visor covers the same semantic territory with more specific names.**

### Token Mapping Matrix

| shadcn Token | Visor Equivalent | Coverage |
|---|---|---|
| `--background` | `--surface-page` | ✓ Same concept, different name |
| `--foreground` | `--text-primary` | ✓ Same concept, different name |
| `--card` | `--surface-card` | ✓ Direct equivalent |
| `--card-foreground` | `--text-primary` | ✓ No dedicated token (use primary) |
| `--popover` | — | ✗ Gap — no popover surface token |
| `--popover-foreground` | `--text-primary` | ✓ Covered by primary |
| `--primary` | `--interactive-primary-bg` | ✓ More specific name |
| `--primary-foreground` | `--interactive-primary-text` | ✓ Direct equivalent |
| `--secondary` | `--interactive-secondary-bg` | ✓ More specific name |
| `--secondary-foreground` | `--interactive-secondary-text` | ✓ Direct equivalent |
| `--muted` | `--surface-muted` | ✓ Direct equivalent |
| `--muted-foreground` | `--text-secondary` | ✓ Direct equivalent |
| `--accent` | `--surface-accent-default` | ✓ More specific name |
| `--accent-foreground` | `--text-primary` | ✓ Covered by primary |
| `--destructive` | `--interactive-destructive-bg` | ✓ More specific name |
| `--destructive-foreground` | `--interactive-destructive-text` | ✓ Direct equivalent |
| `--border` | `--border-default` | ✓ Direct equivalent |
| `--input` | `--border-default` | ✓ No dedicated input border (acceptable) |
| `--ring` | `--border-focus` | ✓ Direct equivalent |
| `--chart-1` … `--chart-5` | `--color-{role}-{step}` (primitives) | ✓ Escape hatch via role primitives |

### Gaps

1. **`--popover`** — Visor has no dedicated popover surface token. After primitive migration, this can be satisfied with `--color-neutral-1` directly or via a new `--surface-popover` semantic token (out of scope for this migration).

2. **shadcn name compatibility** — Visor's category-prefixed naming (`--text-primary`, `--surface-card`) is more verbose than shadcn's bare names (`--foreground`, `--card`). Per VI-122 decision, Visor keeps its own naming. Adopting shadcn names would create conflicts with projects that use both systems.

3. **Chart primitives** — shadcn ships `--chart-1` through `--chart-5`. Visor does not. After primitive migration, chart consumers can reference `--color-primary-500`, `--color-success-500`, etc. directly — this is the intended escape hatch for admin/visualization work.

**Conclusion:** Visor covers the full shadcn semantic surface. The naming conventions are intentionally different and complementary.

---

## Theme Engine Alignment

The theme engine (`packages/theme-engine/`) is already architecturally aligned with the recommended direction. Key facts:

| Area | Status |
|------|--------|
| Color role names (primary, neutral, accent, success, warning, error, info) | ✓ Aligned |
| CSS variable output format (`--color-{role}-{step}`) | ✓ Aligned |
| Shade step numbering (50, 100, 200 … 900, 950) | ✓ Aligned — NOT 1-12 |
| OKLCH shade generation | ✓ Implemented in `shades.ts` |
| Semantic mapping table (`semantic-map.ts`) | ✓ Uses role/shade tuples |
| Selective vs full scales (6 vs 11 steps for status roles) | ✓ Both supported |

**One clarification from VI-122:** The research doc references "1–12" numbering as a conceptual model (Radix-style). The actual theme engine uses Tailwind-style steps (50–950). The implementation follows Tailwind convention, which aligns with `semantic-map.ts` shade references (`shade: 900`, `shade: 600`). The migration uses 50-950, not 1-12.

**Remaining gap:** The static `primitives.ts` uses hardcoded Tailwind palette names (`gray`, `blue`) while the theme engine generates role-named OKLCH scales (`neutral`, `primary`). This migration closes that gap. After migration, the static token package and theme engine output will use identical CSS variable names.

---

## Modify vs Rebuild Decision

**Decision: Modify in place.**

### Rationale

The rebuild case would be justified if:
- Semantic token names are wrong → they are not; all 87 are well-named
- The adaptive mechanics are broken → they are not; light/dark switching works correctly
- The architecture is fundamentally incompatible → it is not; the 3-tier structure is the right model

The only broken part is the primitive color layer's naming convention. A rename fixes it.

Evidence:
1. **793 component refs stay untouched.** The semantic token names form a stable API. No consumer code changes.
2. **The theme engine is already correct.** It generates `--color-neutral-*`, `--color-primary-*` etc. Migration makes the static package match what the engine already outputs.
3. **165 ref updates are mechanical.** `color-gray-*` → `color-neutral-*` across 3 TypeScript files. There is no semantic judgment required.
4. **14 files total.** For a token layer rewrite, this is minimal scope.
5. **No behavior changes.** The rendered colors do not change during the static token migration (Tailwind hex values are preserved as initial values; OKLCH refinement is a separate concern).

### What Rebuild Would Mean

A rebuild would involve reconsidering the tier structure, semantic naming conventions, adaptive mechanics, or theme engine pipeline. None of these need to change. Doing so would break 793 component refs across 114 files for no gain. That is not the right call pre-1.0.

---

## Migration Scope Estimate

The following implementation tickets can be cut from this analysis:

| Ticket | Scope | Files | Notes |
|--------|-------|-------|-------|
| Rename primitive color tokens | Rename in `primitives.ts` | 1 | Mechanical — palette → role names |
| Update semantic.ts refs | 55 string updates | 1 | Find-and-replace |
| Update adaptive.ts refs | 110 string updates | 1 | Find-and-replace |
| Fix primitive leaks in components | 64 CSS updates | 11 | Requires semantic judgment in chart.module.css |
| Update generate-css.ts if needed | Audit for hardcoded names | 1 | Likely no changes; already role-agnostic |
| Update token-rules.md | Docs | 1 | Reflect new naming convention |

Total implementation scope: ~16 files, 1–2 engineer-days.

The only judgment call is `chart.module.css` — 2 primitive refs that may need new semantic tokens or sanctioned escape-hatch primitive access. Recommend addressing in the component-specific ticket.
