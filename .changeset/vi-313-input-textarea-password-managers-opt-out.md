---
"@loworbitstudio/visor": minor
---

Add `passwordManagers="ignore" | "allow"` prop to `Input` and `Textarea`. Default is `"ignore"` — emits `data-1p-ignore`, `data-bwignore`, `data-lpignore`, and `data-form-type="other"` so 1Password / Bitwarden / LastPass don't render autofill icons on non-auth Visor forms. Login, signup, and credential fields opt back in with `passwordManagers="allow"`. Browsers ignore `autocomplete="off"` on individual inputs, so the four per-manager `data-*` attributes are the only reliable suppression mechanism.
