---
"@loworbitstudio/visor": minor
---

VI-304 feat: add `ChromeButton` — 28px topbar/chrome button primitive.

Admin topbars across r3 (dashboard + events), ENTR admin, Mission Control, and Studio CRM all repeat the same compact button + inline `Kbd` hint pattern. Visor's `Button` is sized for body content (40px / 36px / 32px) and lacks the `Kbd` slot, so every admin shell either reaches for `Button size="sm"` (wrong density) or rebuilds the row inline.

`ChromeButton` makes the chrome-scale pattern first-class:

- 28px height, compact paddings, theme-portable (binds to Visor tokens — no hardcoded colors)
- Optional leading icon slot (`data-slot="chrome-button-icon"`)
- Optional trailing `keys: string[]` slot rendered as `<Kbd keys={keys} size="sm" />` (`data-slot="chrome-button-kbd"`)
- Two variants: `default` (muted interactive surface) and `primary` (accent surface)
- All standard `<button>` HTML attributes pass through; `aria-label` supported for icon-only usage

Net-new primitive — zero risk to existing components. Install via `npx visor add chrome-button`.
