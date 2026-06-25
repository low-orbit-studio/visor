---
"@loworbitstudio/visor": patch
---

feat(success-feedback): add SuccessFeedback pattern — useSuccessToast() hook + SuccessLiveRegion a11y component (VI-589)

App-wide success/transition feedback pattern built on the Toast primitive. Provides `useSuccessToast()` for imperative success toasts with Borealis-spec defaults (4s auto-dismiss, duration clamped to 3–8s, optional undo/view action, deduplication via id) and `SuccessLiveRegion` — a visually-hidden `role=status aria-live=polite` node for screen-reader announcements.

Also updates toast.module.css success variant to use the inverse-surface dark treatment (per Borealis state spec), giving success toasts a high-contrast dark bg that reads as affirmative vs. the neutral default.
