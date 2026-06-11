---
"@loworbitstudio/visor": minor
---

Add `gated` / `gatedReason` props to the Button primitive for permission-gated state.

A gated button is visually dimmed (`var(--opacity-40)`) and cursor not-allowed, but stays hover-able and keyboard-focusable via `aria-disabled` instead of the native `disabled` attribute. When `gatedReason` is provided, hovering the button surfaces an anchored Tooltip (background `var(--surface-elev)`) explaining why the action is unavailable. Click handlers are suppressed internally — no consumer-side guards needed. Works orthogonally across all variants and sizes.

Requires a `<TooltipProvider>` ancestor when `gatedReason` is set.
