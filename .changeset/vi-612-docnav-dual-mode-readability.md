---
"@loworbitstudio/visor": patch
---

DocNav: fix light-mode readability (VI-612). Resting-pill recess dialed to 20% toward neutral-950 so light-mode pills read as a clean recess instead of a heavy gray, and the active pill is now contrast-safe — a legible `--text-primary` label on a distinct `--surface-selected` fill with an accent ring blended into a hairline, rather than raw `--accent` (which rendered white-on-white on white/near-white-accent themes like Blacklight in light mode). All pill states now clear WCAG AA (≥4.5:1) across themes and both modes.
