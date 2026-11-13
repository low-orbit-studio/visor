---
"@loworbitstudio/visor-theme-engine": minor
"@loworbitstudio/visor-core": patch
"@loworbitstudio/visor": patch
---

VI-753: AdminShell's rules are now theme tokens. The block reads `--admin-shell-sidebar-border`, `--admin-shell-sidebar-header-border`, `--admin-shell-sidebar-footer-border`, `--admin-shell-topbar-bg` and `--admin-shell-topbar-border`, each falling back to the value it drew before, so an unbound theme renders unchanged. The theme engine adds them as the `admin-shell` component-token family (`components.admin-shell` in `.visor.yaml`). The `paper` theme binds the borders to `none` and the topbar to `var(--surface-page)`, so its shell is borderless without app CSS.
