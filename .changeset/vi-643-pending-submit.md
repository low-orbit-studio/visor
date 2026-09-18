---
"@loworbitstudio/visor": patch
---

VI-643 follow-up: `pending` and `gated` now stop a FORM SUBMIT, not only an `onClick`.

Suppressing the click handler leaves the browser's own **activation behaviour** intact. So a `<Button type="submit" pending>` inside a `<form>` still submitted, through `onSubmit` — a path the Button never sees. Most buttons either state exists for are submits in a dialog footer, which is exactly where this bites.

Found by measurement in a consumer rather than by reading: a second click on a pending submit mailed a second one-time code. A keyboard Enter on a focused submit button dispatches a click too, so the same fix covers that path.

`preventDefault()` now accompanies the swallowed handler on both states. A Button that is neither pending nor gated is unaffected.
