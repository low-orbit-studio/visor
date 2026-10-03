---
"@loworbitstudio/visor": minor
"@loworbitstudio/visor-theme-engine": minor
---

EmptyState gains `intent="error"` and a `fill` prop. A failed load now wears the empty-state layout: centred icon, heading and description, with the icon and heading in the destructive colour (`--empty-state-error-color` overrides it), `role="alert"` instead of `status`, and an unchipped icon unless `iconWrap` is set. `fill` stretches the empty state to its container and centres it both ways. ErrorPlacard stays for inline, in-card failures; both components' `when_to_use` now point at each other.
