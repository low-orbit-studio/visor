---
"@loworbitstudio/visor": minor
"@loworbitstudio/visor-theme-engine": minor
---

SaveStatus takes `status="syncing"`, for a first sync from an outside source writing rows the user did not type (`labels.syncing` overrides the word; the consumer sets it, `useAutosave` never emits it), and `unsavedAs="dot"`, which draws Unsaved as a dot alone while the label stays as visually hidden text in the live region, so the dot keeps an accessible name. New theme tokens `--save-status-syncing-color` (the Syncing ink) and `--save-status-dot-size`. The slot width holds for every state, the dot included.
