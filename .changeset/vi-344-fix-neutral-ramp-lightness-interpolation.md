---
"@loworbitstudio/visor-theme-engine": patch
---

Fix neutral-ramp lightness interpolation: replaced the `-1` placeholder in `LIGHTNESS_TARGETS[500]` with `0.55` (Tailwind gray-500's OKLCH L) so `computeLightness()` produces well-distributed ramps for any input neutral, not just inputs that coincidentally land near L≈0.55. Removes dead `anchorShade === 600` branches (every role anchors at 500). Affects auto-derived `neutral.50–neutral.950` shades for themes that don't override neutrals explicitly; neutral.200–500 now land in proper gray territory instead of being pushed toward near-white.
