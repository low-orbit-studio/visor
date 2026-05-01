---
"@loworbitstudio/visor": minor
---

Add `hideHeader` and `customHeader` props to `admin-detail-drawer` so consumers can replace the default `SheetHeader` without CSS hacks. `hideHeader` skips the default header render but mounts a visually-hidden `SheetTitle` for Radix a11y. `customHeader` slots arbitrary content in place of the default header (the block renders a visually-hidden `SheetTitle` wrapping `title`). `customHeader` wins over `hideHeader` when both are set; default behavior is preserved when neither prop is set.
