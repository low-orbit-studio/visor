---
"@loworbitstudio/visor-core": minor
---

VI-384 feat: `DataTable` row tone, clickable rows, and selected-row styling.

Three additive extensions to the existing `DataTable` primitive — group rows + sticky group headers already shipped, so this ticket focuses on per-row affordances:

1. **Selected-row CSS rule.** Wires the latent `data-state="selected"` attribute (already emitted by TanStack via `row.getIsSelected()` but unstyled) to `var(--surface-selected)`. Closes a latent bug where toggling the selection checkbox left the row visually unchanged.

2. **`rowTone` prop.** New `(row) => "live" | "warn" | "scheduled" | "sold" | "draft" | "danger" | "info" | undefined` callback. Returns a tone key per data row; the table stamps `data-tone="<tone>"` on the `<tr>` and the CSS layer maps each tone to a Visor surface token (`--surface-success-subtle`, `--surface-warning-subtle`, `--surface-error-subtle`, `--surface-info-subtle`). `scheduled` and `draft` render on the default surface — no tint — to keep visual signal focused on actionable rows. Tone vocabulary mirrors `StatusBadge` / `StatusDot` so a row tagged `live` reads as one signal with a `live` badge inside it.

3. **`onRowClick` prop.** Opt-in clickable-row affordance. When supplied, data rows become keyboard-activatable: `role="button"`, `tabIndex={0}`, click + Enter/Space dispatch the handler, and `data-clickable="true"` drives a hover and focus-visible affordance. The injected selection-checkbox cell stops propagation so toggling the checkbox does not also trigger the row click. When `enableRowSelection` is also on, the row keeps its semantic `tr` role (and drops `role="button"`) to satisfy WCAG nested-interactive — click and keyboard handlers still fire.

No breaking changes. All new props are optional and inert by default. The newly-styled `data-state="selected"` rows will visually change for existing consumers using `enableRowSelection`, but the attribute was always emitted — the fix simply adds the style that was missing.
