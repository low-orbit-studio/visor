---
"@loworbitstudio/visor": minor
---

Add `CardLift` visual component — CSS-only hover lift + live-keyed halo interaction (VI-569).

Port of `.bl-card-lift` from blacklight-website (BL-326). `CardLift` is a thin wrapper `<div>` that applies a `translateY(-4px)` lift, depth shadow, and a `color-mix()` halo on hover. The halo is keyed to `--lift-color` (default: `var(--accent, #6366f1)`) — consumers can pass any CSS color or `var()` reference and the halo tracks live rewrites at paint time without a React re-render.

- `prefers-reduced-motion: reduce` removes all transitions and the transform
- Registered in the visual-elements category; install via `npx visor add card-lift`
