---
"@loworbitstudio/visor": minor
---

Add `gated` + `gatedReason` props to Button (VI-454). When `gated=true` the
button renders inert — visually dimmed, cursor not-allowed, click handlers
suppressed — using `aria-disabled="true"` and `data-gated="true"` instead of
the native `disabled` attribute, keeping the button keyboard-focusable so the
anchored tooltip is reachable by keyboard and screen-reader users. When
`gatedReason` is also provided, the button wraps itself in a Radix `<Tooltip>`
that surfaces the reason on hover/focus. CSS treatment is scoped to
`[data-gated="true"]` and is orthogonal to all existing variants and sizes.
Existing call sites are unaffected — both props default to `undefined`.
Consumers using `gatedReason` must supply a `<TooltipProvider>` ancestor.
