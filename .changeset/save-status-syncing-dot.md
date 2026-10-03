---
"@loworbitstudio/visor": minor
"@loworbitstudio/visor-theme-engine": minor
---

SaveStatus takes `status="syncing"`, for a first sync from an outside source writing rows the user did not type (`labels.syncing` overrides the word; the consumer sets it, `useAutosave` never emits it), and `unsavedAs="dot"`, which draws Unsaved as a dot alone while the label stays as visually hidden text in the live region, so the dot keeps an accessible name. New theme tokens `--save-status-syncing-color` (the Syncing ink) and `--save-status-dot-size`. The slot is now sized from content: as wide as the longest label (overrides included) in the theme's own font plus room for the retry mark, one width in every state, so a default label never truncates. `--save-status-width` still pins it and wins when set (its unbound fallback is now `auto`, was `7.5rem`).
