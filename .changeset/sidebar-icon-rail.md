---
"@loworbitstudio/visor": minor
---

Sidebar works as an icon rail. `SidebarMenuButton` now implements `asChild` (Radix Slot, so a Next `<Link>` can be the item) and `tooltip` (shown on an icon rail, naming the button for assistive tech, portaled into the Sidebar so a scoped theme reaches it). `Sidebar` takes `position="contained"` so a rail sits under an app bar instead of pinning to the viewport. `SidebarProvider` takes `keyboardShortcut` and skips Cmd/Ctrl+B (and its `preventDefault`) when only `collapsible="none"` sidebars are mounted. `SidebarProvider` now includes a `TooltipProvider`. The `blacklight-app` render theme binds `tooltip-bg` / `tooltip-text`, and `visor render sidebar` adds an icon-rail fixture.

The sidebar menu button's focus ring is now drawn inset, so the overflow-clipped icon rail shows it on all four sides. Tooltip has a dark-mode default (`--text-primary` ground under `--text-inverse` ink) so it is legible in stock dark themes with no override; light mode and any `--tooltip-bg` / `--tooltip-text` binding are unchanged.
