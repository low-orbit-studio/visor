---
"@loworbitstudio/visor": minor
---

Add `HeroGlow` decorative primitive (VI-567) — a breathing radial glow band for hero media, color-driven by a live `--glow-color` CSS custom property.

- **Component** `components/visual/hero-glow/hero-glow.tsx` — `position: absolute` element with `aria-hidden="true"` and `pointer-events: none`; glowColor prop sets `--glow-color` inline; external rAF-rate CSS var updates work without React re-renders
- **CSS Module** `hero-glow.module.css` — direct port of `.bl-hero-glow` (blacklight-website BL-326); `radial-gradient(70% 60% at 50% 55%, color-mix(in srgb, var(--glow-color) 16%, transparent), transparent 72%)`; 7s ease-in-out breathe animation (opacity 0.75↔1, scale 1↔1.03); `prefers-reduced-motion` disables animation
- **Registry** — registered in `registry/registry-visual.ts` as `hero-glow` in the `visual-elements` category
- **Docs** — specimen page at `/docs/components/visual-elements/hero-glow` with live preview, API reference, and rAF usage example
