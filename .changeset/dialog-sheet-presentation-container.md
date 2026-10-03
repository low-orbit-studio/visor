---
"@loworbitstudio/visor": minor
---

Dialog presents as a bottom sheet and both Dialog and Sheet open inside a container (VI-667). `Dialog` takes `presentation` (`dialog`, `sheet`, or `responsive`, which is a dialog from `breakpoint` up and a sheet below it), with the same content, focus trap and Escape handling in each; the sheet is sized with `dvh` and the visual viewport, keeps the focused field above the on-screen keyboard, appears without the slide under reduced motion, and takes an optional drag handle (`showHandle` on `DialogContent`). `Dialog` and `Sheet` take `container` to cover only that element: the scoped form is not Radix modal mode, so focus is trapped inside the content, only the container's other children go `inert`, and the page outside stays interactive. `DialogHeader` takes a `back` slot and `DialogBack` is exported for it. The render harness gains `dialog` `sheet` and `scoped` fixtures.
