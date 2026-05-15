---
"@loworbitstudio/visor-core": minor
---

VI-385 feat: add `quick-actions` primitive — vertical list of action rows pairing a left-aligned label with a right-aligned `Kbd` shortcut.

Ports the r3 admin dashboard's "Quick" panel composition into a first-class Visor primitive. Sized for dashboard side-rail digests and command-palette previews. Display-only by default: rows render as plain `<li>` with semantic `<kbd>` chrome. Supplying `onActivate` flips rows into `role="button"` with `tabIndex={0}` and click + Enter/Space activation — mirroring the opt-in interactive pattern used elsewhere in Visor.

Composes the existing `Kbd` primitive at `size="sm"` for each row. No new tokens — relies on `--surface-card`, `--text-secondary`, and standard spacing/font-size tokens. Registered as `category: navigation` so `npx visor add quick-actions` works.
