---
"@loworbitstudio/visor": minor
---

Add an `AlertActions` sub-component to Alert (VI-465). `AlertActions` exposes a
right-aligned, gap-aware row for inline action buttons — ideal for inline error
placards with retry/dismiss controls. It follows the existing compound pattern
(`AlertTitle`, `AlertDescription`), renders with `data-slot="alert-actions"`, and
styles its children as a `flex` row (`justify-content: flex-end`, token `gap`) that
sits below the description within Alert's grid stack. Existing alerts without the
new slot render identically.
