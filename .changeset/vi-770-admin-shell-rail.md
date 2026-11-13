---
"@loworbitstudio/visor": minor
"@loworbitstudio/visor-theme-engine": minor
"@loworbitstudio/visor-core": patch
---

AdminShell (VI-770): the sidebar folds to an icon rail and back. `collapsible` draws a fold button beside the logo ("Collapse the sidebar" / "Expand the sidebar", with `aria-expanded`), and ⌘\ (Ctrl+\ off a Mac) toggles it; `collapseShortcut` picks another key or `false`. `storageKey` remembers the choice in localStorage (a private window opens expanded), `defaultCollapsed` sets the start, and `collapsed` / `onCollapsedChange` make it controlled. The shell and sidebar carry `data-collapsed`, and labels marked `data-admin-shell-label` are hidden visually in the rail but keep naming their items. The rail is desk-only. The theme engine adds `rail-width` (68px), `rail-duration` and `rail-easing` to the `admin-shell` family, and Paper folds on its 480ms `cubic-bezier(0.2, 0.8, 0.2, 1)`.
