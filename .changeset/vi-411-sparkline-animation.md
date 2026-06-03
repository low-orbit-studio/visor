---
"@loworbitstudio/visor": minor
"@loworbitstudio/visor-core": minor
---

Sparkline: add an entrance path-draw animation (`animate`, default true; `duration`, default 1500ms) that draws the line left→right on mount, respecting `prefers-reduced-motion`. `animate={false}` is unchanged from the prior static render. Adds the `--motion-duration-1500` primitive to the motion-duration ladder (consumed by Progress entrance animation, VI-412).
