---
"@loworbitstudio/visor": minor
---

Add `AmbientGlow` component (VI-566) — a decorative drifting radial-glow primitive ported from Blacklight's `.bl-ambient` depth system.

- **`AmbientGlow`** — fixed/absolute decorative layer (`aria-hidden`, `pointer-events: none`) whose color flows entirely through the `--glow-color` CSS custom property, resolved at paint time so live rAF rewrites on ancestor elements repaint without React re-renders.
- **`keyed` variant** — color-mix derived from `--glow-color` for runtime-keyed accents.
- **`gold` variant** — static warm `rgba(255, 190, 38, 0.07)` glow.
- Honors `prefers-reduced-motion` (drift animation disabled).
