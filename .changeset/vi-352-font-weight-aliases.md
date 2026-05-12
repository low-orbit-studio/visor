---
"@loworbitstudio/visor-theme-engine": minor
---

VI-352 — Add per-family weight-name alias registry for visor-fonts CDN URL builder.

Foundries like Pangram Pangram ship non-standard PostScript names (e.g. `Book` for the regular weight, `Super` for the heaviest). The new `font-aliases.ts` module maps `family → weight → PostScript suffix`; `buildVisorFontUrl()` consults the registry before falling back to the standard `WEIGHT_NAMES` table. Seeded with PP Model Mono and PP Model Plastic (`400 → Book`, `800 → Super`).

No behavior change for any family not listed in the registry — Google-Fonts-style PostScript names continue to resolve through the existing table.
