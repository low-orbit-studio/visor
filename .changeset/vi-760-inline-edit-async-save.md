---
"@loworbitstudio/visor": minor
---

InlineEdit (VI-760): `onCommit` may return a promise. While it runs the field stays open, read-only and `aria-busy`; if it rejects or resolves to `{ error: string }`, the message shows under the field like FieldError, the typed text stays, and Enter retries. Escape gives up and restores the value.
