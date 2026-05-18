---
"@loworbitstudio/visor": minor
---

VI-386 feat: add `CommandDialog` block — drop-in ⌘K palette composing the `command` + `dialog` primitives.

New `blocks/command-dialog/` block that ports the r3 admin-ui palette visual contract onto Visor tokens. Composes existing primitives (`Command`, `CommandInput`, `CommandList`, `CommandGroup`, `CommandItem`, `CommandEmpty`, `Dialog`, `DialogContent`, `DialogTitle`, `Kbd`) — does not fork any of them — and exposes named slots for the parts every admin shell re-implements by hand: scope chip, group heading with optional count, item meta, item Kbd shortcut, footer hint row, and result count.

Props: `open` + `onOpenChange` (controlled), `placeholder?`, `scope?` (string → "in {scope}" or full ReactNode), `groups: CommandDialogGroup[]`, `footerHints?: CommandDialogFooterHint[]`, `resultCount?` (derived from groups when omitted), `hideResultCount?`, `enableShortcut?` (default `true`; binds ⌘K / Ctrl+K to toggle open, cleans up on unmount), `className?` (forwarded to `DialogContent`).

Data slots on every meaningful node: `command-dialog`, `command-dialog-input-row`, `command-dialog-scope-chip`, `command-dialog-scope-label`, `command-dialog-group-heading`, `command-dialog-item-icon`, `command-dialog-item-label`, `command-dialog-item-meta`, `command-dialog-item-kbd`, `command-dialog-footer`, `command-dialog-footer-hints`, `command-dialog-footer-hint`, `command-dialog-result-count`.

Hit-highlighting is pass-through — callers wrap matched substrings in `<span data-hit>` inside item labels and the block's CSS paints them with the accent token. No auto-highlighting; consumers wire their own search.

Registered in `registry/registry-blocks.ts` so `npx visor add block command-dialog` resolves. Docs proxy + demo added under `packages/docs/components/blocks/`.
