---
"@loworbitstudio/visor": minor
---

Add `workspace-switcher` block — a sidebar-header button + Radix `DropdownMenu` listing available workspaces, designed as a drop-in for `AdminShell`'s `logo` slot in multi-tenant admin apps. Trigger renders the current workspace (avatar + name + plan + caret) in `full` mode or avatar + caret only in `compact` mode; current workspace is checkmarked in the dropdown, `onSelect(id)` fires on selection, and `imageUrl` falls back to `initials` via `AvatarImage`. Theme-portable (semantic tokens only) with full keyboard navigation. Install via `npx visor add workspace-switcher`.
