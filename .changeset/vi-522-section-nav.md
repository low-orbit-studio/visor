---
"@loworbitstudio/visor": minor
---

Add `SectionNav` / `SectionNavItem` — a link/anchor-based section sub-navigation strip.

Each item renders a leading Phosphor icon + label + optional trailing count pill, with a static 2px primary underline on the active item (`isActive`) and a count pill that re-tones from neutral to primary-tinted when active. Items navigate via `href`; pass `asChild` with a `next/link` element for client-side routing. Distinct from `Tabs`: no button triggers, no content panels, no animated indicator — built for sub-navigation where each section is its own route (e.g. organization Detail/Roles/Invites). Fully theme-agnostic via CSS custom property tokens.

Install with `npx visor add section-nav`.
