---
"@loworbitstudio/visor": patch
---

VI-393 docs: add `admin-shell` editorial-density showcase.

Adds a new docs page at `/docs/blocks/admin-shell-showcase` that composes
`AdminShell` in the admin-v7-r3 pattern — `WorkspaceSwitcher` in the `logo`
slot, a `ChromeButton` cluster in `topbarEnd`, eyebrow-grouped nav, and a
sidebar footer pairing `Avatar` with a trailing `Kbd` shortcut hint.

Verification harness — no source changes to `admin-shell`. The showcase
proves `AdminShell`'s public API already supports the full r3 editorial-density
composition. The block's `admin-shell.visor.yaml` now carries a `preview_url`
pointing at the showcase so the registry surfaces it.
