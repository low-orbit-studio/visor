---
"@loworbitstudio/visor": minor
---

VI-433 feat: `export-menu` Visor admin block — Export button + format-picker popover + scope toggles.

New admin block installable via `npx visor add export-menu --block` that standardizes the Export affordance across every admin list. Composes a `<Button>` trigger (with `aria-haspopup="dialog"`) into a `<Popover>` containing a header, a format-picker `<RadioGroup>` (CSV / JSON / PDF baseline via `defaultExportFormats()`, or any custom set), an optional scope checkbox section (Include archived, Include suspended, …), and a Cancel/Export footer. Async-aware: when `onExport` returns a `Promise`, the submit button shows a spinner with `aria-busy`, both buttons disable, and the popover stays open until the promise resolves; on rejection, state clears and the popover stays open so the user can retry. Disabled formats render a Radix tooltip with the `disabledReason` on hover/focus. Enter inside the popover (on any non-button element) submits the selected format. Trigger variant is mappable to the Button's default/secondary/ghost via `triggerVariant`.

Codifies the recurring "Export" pattern surfaced from the organization-management Phase 1.5 prototype audit (PL-1548) — previously every admin list (org list, members, invitations, roles, audit logs, …) reinvented this popover with subtly different formats and scope-toggle naming. Adjacent primitives consulted: `dropdown-menu`, `popover`, `quick-actions`, `command-dialog` — none cover format-picker + scope-toggle composition. Composes existing Visor primitives: `button`, `popover`, `radio-group`, `checkbox`, `label`, `tooltip`.
