---
"@loworbitstudio/visor": minor
---

Progress: the indicator now sweeps from 0% to its value on initial mount over a default 1500ms (new `duration` prop; consumes `var(--motion-duration-1500, 1500ms)`), respecting `prefers-reduced-motion`. Note: the default entrance timing changed from 300ms to 1500ms — pass `duration={300}` to restore the prior timing. `animate={false}` remains static.
