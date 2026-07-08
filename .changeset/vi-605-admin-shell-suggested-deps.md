---
"@loworbitstudio/visor": minor
---

VI-605: split block registry deps into hard vs. suggested slot-fill deps.

Registry items gain an optional `suggestedDependencies` field for slot-fill
components a block can compose with but does not import to render itself. The
`admin-shell` block now declares only `utils` as a hard `registryDependency`,
with `breadcrumb`, `dropdown-menu`, and `sidebar` moved to `suggestedDependencies`.

`visor add <block> --block` now installs only hard deps by default, so a
slot-only compose no longer pulls unused component files or their npm trees
(e.g. Radix `@radix-ui/react-dropdown-menu`). A new `--with-suggested` flag opts
into installing the suggested slot-fill components. When suggested deps are
skipped, they are surfaced in the CLI output (and under a `suggested` key in
`--json` output). The block's `.visor.yaml` `components_used` list is unchanged
and continues to document the slots for humans and agents.
