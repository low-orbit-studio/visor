# Concentric Corners Audit

VI-838. Every place in the Visor docs examples where a rounded box is drawn inside another rounded box, and what was done about it. The gate that keeps it this way is `packages/docs/e2e/concentric-scan.spec.ts`, which runs in CI's visual-regression job.

## The Rule

Inner radius = outer radius − the gap between them, and the gap is the same on both axes. Derive the inner radius from the outer one in CSS; never type it twice.

## How the Scan Finds Pairs

`scanConcentric` (exported from `@loworbitstudio/visor-core/test-utils`) runs in the page:

- The inner box must draw something (fill, border, shadow or backdrop). Its outer box is its nearest ancestor that draws something.
- The pair counts only when the inner corner sits inside the outer curve on both axes (inset 0 to the outer radius, and at most 16px). Past that, the corner sits under a straight edge and nothing nests.
- Radii are the drawn ones, clamped to half the box, so pill in pill reads right.
- Skipped: a corner flush with the padding edge of a rounded ancestor that clips (the clip draws it), icons, media, avatars, badges, checkboxes, switches and spinners.
- A pair passes when inner = outer − gap within 0.5px, the horizontal and vertical insets match, and both corners have the same `corner-shape`.

The spec scans every component page's examples, every iframe on the page (the look frames) and the first overlay on each page, opened.

## Pairs Found

| Pair | Page(s) | Before | Outcome |
|------|---------|--------|---------|
| Tabs list > trigger | navigation/tabs | outer 18, inset 3 × 4, inner 14 | **Fixed.** The list's inline padding gets the same extra 1px the trigger's `calc(100% - 2px)` height leaves above and below. Now inset 4 × 4. |
| ThemeSwitcher root > segment | general/theme-switcher | outer 23, inset 8 × 4, inner 19 | **Fixed.** The end padding matches the top (4px); the start keeps 8px for the label. |
| SegmentedControl / ToggleGroup track > indicator | form/segmented-control, form/toggle-group | inset up to 4.13 × 5 at the right end | **Fixed.** The indicator was positioned from `offset*`, which round to whole pixels, and never re-measured after web fonts landed. It now measures fractional rects and follows item resizes. |
| Meter (contract) track > fill | data-display/meter | outer 10, inset 6 × 9, inner 6 (pill) | **Fixed.** One 9px inset on both axes; the fill radius is the track radius minus the inset (1px). The compact meter stays pill in pill (inset 2 × 2). |
| BillingSlider track > fill, past, gap, evidence, proposed layers | form/billing-slider | square corners flush with a 13 or 16px rail that does not clip | **Fixed.** The colour layers sit in one span that clips to the rail, like the ruler already did; marks and ticks stay outside the clip. |
| Select content > highlighted item | form/select, admin/filter-bar | outer 8, inset 4 × 4, inner 2 | **Fixed.** Item radius = menu radius − menu padding (4px). |
| TimePicker list > highlighted option | form/time-picker | outer 8, inset 4 × 4, inner 2 | **Fixed** the same way. |
| Menubar bar > trigger | navigation/menubar | outer 8, inset 5 × 2, inner 6 | **Fixed.** Triggers fill the bar's height (inset 5 × 5) and take the bar radius minus padding and its 1px border (3px). |
| DropdownMenu, ContextMenu, Menubar menus, Combobox list > items | overlay/dropdown-menu and others | passed on the default theme only because the typed values happened to agree | **Derived.** Item radius = menu radius − menu padding, so a theme that changes either keeps them nested. DropdownMenu's editorial density keeps its own `--radius-sm` items: their inset is as wide as the menu radius, so they do not nest. |
| Command docs wrapper > Command | navigation/command | 8px wrapper, 1px border, 8px Command | **Fixed** in the MDX: the demo wrapper clips. |
| DocNav group > pill | navigation/doc-nav, navigation/doc-frame | outer 12, inset 9 × 9, inner 12.5 (pill) | **Allowlisted.** Pill links in a ~12px cluster are the BO-67 design. Deriving gives 3px pills; deriving the cluster from the pill gives the ballooned radius BO-67 removed. |
| FidelityMirror specimen group > pill | data-display/fidelity-mirror | outer 12 / 22, inset 9, inner 20 | **Allowlisted.** The specimen mirrors the doc-nav pills. |
| LayerChart block > label chip | data-display/layer-chart | outer 16, inset 10 × 12, inner 8 | **Allowlisted.** A backing chip that hugs the label over the pattern; its size follows the text, not the block. |

Pairs that already passed: Switch track > thumb, ThemeSwitcher segment > option, SegmentedControl and ToggleGroup items and indicators at every size, Meter track > zone, Stepper trigger > pulse dot, Composer chip > status dot, FidelityMirror split control, LayerChart toolbar button.

## Candidates With No Nested Pair

Checked by the scan on their docs examples; none has a painted rounded box whose corner sits inside its parent's curve, or the parent clips it:

- Card with header, content, footer or inset media; StatCard; BulkActionBar strip and dismiss button (inset wider than the outer radius).
- Dialog, Sheet, AlertDialog and Popover content (the scan opens the first overlay on each page and hovers its first item).
- Input groups, search, OTP cells, chips and badges inside inputs.
- Avatar group rings (avatars are round by design and skipped).
- Command palette rows (inset vertically far from the corner).
- Sidebar nav items in the rail, Calendar day cells.
- Progress and SegmentedProgress fills (flush inside a track that clips).

## Allowlist

Lives in `packages/docs/e2e/concentric-scan.spec.ts`, keyed by page and pair, each with a one-line reason. The test caps it at 6 entries and fails on an entry that no longer matches a failing pair, so a fixed pair has to leave the list.
