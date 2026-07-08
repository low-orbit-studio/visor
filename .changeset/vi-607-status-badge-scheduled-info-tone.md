---
"@loworbitstudio/visor": patch
---

Re-group `status-badge`'s `scheduled` status from the neutral (grey) color group to the info (blue) group (VI-607). `scheduled` is semantically an upcoming/committed state, not a muted draft, so it now renders with the info tone — `info` in subtle tone and `filled-info` in filled tone — deliberately distinct from `draft`, which stays neutral grey. This makes a faithful compose of designs that paint a scheduled item blue (e.g. Animal §04 Artist Detail's invoice ledger) render correctly without hacking an info-group status key. Fully token-driven — the info tone reuses the existing `--surface-info-default` / info Badge variants; no new tokens.
