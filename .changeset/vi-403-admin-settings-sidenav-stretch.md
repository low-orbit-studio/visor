---
"@loworbitstudio/visor": minor
---

VI-403 feat: `admin-settings-page` sideNav now stretches to fill its grid track via an inner-sticky-stretch pattern.

Previously `.sideNav` was `position: sticky; align-self: start;` which collapsed the rail to content height — so the rail's surface didn't extend to the bottom of the viewport. The block now wraps the sideNav children in a `data-slot="admin-settings-page-side-nav-sticky"` inner div that carries the sticky positioning, while the outer `.sideNav` becomes a stretching grid track. Net: rail surface visible to the bottom of the body; scroll-anchor sticky behavior preserved.

Behavior change: consumers that relied on the rail collapsing to content height need to opt back in via CSS overrides. New `data-slot` hook is additive.
