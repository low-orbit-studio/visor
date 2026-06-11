---
"@loworbitstudio/visor": minor
---

Add `flat` prop to BulkActionBar for embedded in-card strip rendering (no shadow, no radius, border-top only).

Pass `flat` when the bar lives inside a table card or panel where the floating rounded-card look is wrong. The existing floating/sticky and inline variants are unchanged — `flat` composes with both.
