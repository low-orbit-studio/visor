---
"@loworbitstudio/visor": patch
---

Sparkline & Progress: SSR-safe entrance animations, fix invisible-by-default sparkline, and eliminate a phantom token.

- **SSR-safe entrance animations.** Both primitives drove their entrance via `useState` + `useEffect` + `requestAnimationFrame`, which only fires reliably on a fresh client mount. On a full page reload the server rendered the sparkline fully undrawn and the JS reveal lost the hydration race, leaving the line **invisible**; Progress simply didn't animate. The entrance is now a pure CSS `@keyframes` whose resting state is the final, visible state — visible even with zero JS, and identical on reload vs. client navigation. Sparkline now uses no hooks at all. `prefers-reduced-motion` still collapses to instant; `animate={false}` is unchanged.
- **Sparkline renders by default.** Its default stroke referenced `var(--accent-primary)`, which is emitted by **no theme**, so SVG `stroke` fell back to its initial value `none` (invisible). It now defaults to the brand color `var(--primary, currentColor)` (with a can't-go-invisible `currentColor` fallback).
- **Phantom-token cleanup.** `--accent-primary` (defined in no theme) was used as a dead middle fallback across ~18 components/blocks (e.g. `var(--interactive-primary-bg, var(--accent-primary, #111827))`). Replaced with the canonical brand `--primary`, so themes that bind only the brand color (e.g. ENTR mint) resolve to it instead of silently falling through to gray — making VI-410's intended accent-only-theme behavior actually work.
