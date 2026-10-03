---
"@loworbitstudio/visor": minor
"@loworbitstudio/visor-theme-engine": minor
---

VI-680: one switch turns every hairline off.

Every hairline rule, divider and ring (the `--hairline` / `--hairline-strong` family) now reads its weight from `--hairline-width` instead of a literal `1px`. Set `--hairline-width: 0` on any ancestor, or `hairlines: off` in a `.visor.yaml`, and every hairline goes. With nothing set the fallback is the old width, so rendering is unchanged.

- Independent of VI-655's `edges` switch: neither touches the other's tokens. Focus and invalid states are untouched.
- Consumers: Table, Tabs (line), Dialog, DropdownMenu, MatrixTable, BulkActionBar, DocFrame, DocNav, SectionNav, InfographicBar, Popover, SpecimenCard, StructuredPrompt, CoherenceCheck, FidelityMirror, EditableBlock, BrowserFrame and the DialogForm block.
- Theme engine: new top-level `hairlines: on | off` field and a `hairline` family in the VI-625 component-token contract (`components.hairline.width`). An explicit `components.hairline.width` wins over `hairlines: off`.
- No layout shift: the box keeps its geometry and only the paint changes (inset outline for rings, border-image for single rules, inset shadow for dividers). Collapsed-border tables (Table cell hairline, MatrixTable) cannot take that treatment and stay real borders.
