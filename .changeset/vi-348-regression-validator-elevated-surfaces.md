---
"@loworbitstudio/visor-core": patch
---

Extend `theme-text-contrast` regression rule (`scripts/rules/theme-text-contrast.ts`) to validate text-primary, text-secondary, and text-tertiary against surface-card, surface-muted, and surface-popover in addition to page background — 24 checks per theme (3 tokens × 4 surfaces × 2 modes). Surfaces with alpha (rgba) are alpha-composited over the resolved page background before the WCAG 2.1 ratio is computed; the existing `composite()` helper is reused. Catches the gray-on-gray / light-on-light failure mode that motivated this work (e.g., text-tertiary on surface-muted), which previously passed because only the page-bg pairing was checked. Stock theme YAMLs (`neutral`, `space`, `borderless`) gained narrow `surface-muted` overrides (and, for `borderless`, explicit text/surface overrides for both modes) so palette-derived elevated surfaces still clear AA. text-disabled and text-ghost remain exempt per WCAG 1.4.3.
