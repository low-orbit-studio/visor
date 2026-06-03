---
"@loworbitstudio/visor": minor
---

Add optional OAuth support to the `login-form` block (VI-491). New optional props
— `oauthProviders`, `onOAuthSignIn`, `dividerLabel`, `error`, and `hideCredentials`
— render caller-supplied provider buttons (`Button variant="outline"`) above the
credentials form, separated by a labeled `Separator` divider, with errors shown in
a destructive `Alert`. A per-provider loading state toggles `disabled` + `aria-busy`
while an async handler is pending. The block stays auth-agnostic: the consumer owns
the sign-in call. `<LoginForm />` with no new props renders identically, so existing
callers are unaffected. The block now also depends on the `separator` and `alert`
primitives.
