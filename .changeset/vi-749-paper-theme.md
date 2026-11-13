---
"@loworbitstudio/visor-core": minor
"@loworbitstudio/visor-theme-engine": patch
"@loworbitstudio/visor": patch
---

VI-749: add `paper`, Low Orbit's shared theme (`@loworbitstudio/visor-core/themes/paper`, `.paper-theme`). Light is "Paper" and dark is "Paper at night", set in Satoshi, from Flight Deck's codified tokens. It ships the Paper desk scale (desktop density: `--paper-desk-*` type roles, 36px controls, 10/14/20/24/28 corners) and the 12 project hues as theme data (`--paper-hue-<angle>-fill`, `-fill-strong`, `-ink`, `-solid`, per mode). Every text pair a Visor component draws clears WCAG AA in both modes (VI-746). The theme engine gains a test that pins those pairs; its runtime code is unchanged. `visor theme register` keeps a `custom-themes/` YAML on the `theme sync` path even when a stock group shares its label, so registering a custom Low Orbit theme no longer edits `theme-config.ts`.
