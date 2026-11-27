---
"@loworbitstudio/visor": minor
---

feat: add DecisionDock (VI-865), a floating answer bar with keys and a sent state

`npx visor add decision-dock` ships a frosted bar, sticky at the bottom of the view, carrying the item's context and its answer buttons, each with its key. `kind="approve"` is Needs Work (N) and Approve (A); `kind="pick"` is Needs Work and Send X (Enter), disabled with no key until `choice` is set; `kind="run"` is Needs Work and I Ran It (R). Needs Work opens a note in place that sends with ⌘↵ and closes with Esc. An answer calls `onAnswer(verdict, note?)` and turns the bar into a sent state: a drawn check, the verdict line and a progress bar that calls `onAdvance` when it fills (`--decision-dock-advance`, 1.2s). Over a photo (`data-glass="on"`) it reads the glass layer. Below 640px it spans the screen and the buttons share the row. CSS keyframes only, no animation library.
