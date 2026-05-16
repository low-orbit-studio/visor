---
"@loworbitstudio/visor": minor
---

VI-398 feat: stat-card `hero` variant defaults to 56px (editorial admin density).

Adds `--stat-card-value-size-hero` (default `var(--font-size-6xl, 3.5rem)`) as a separate hook from `--stat-card-value-size`. `.value[data-value-as="hero"]` reads through the new hook with the previous size as a chained fallback. Default `valueAs="hero"` cards now render at 56px instead of ~30px — matches the editorial admin baseline (admin-v7-r3). Consumers binding either custom property override the new default; non-hero variants are byte-for-byte unchanged.
