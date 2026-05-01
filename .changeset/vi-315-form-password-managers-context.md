---
"@loworbitstudio/visor": minor
---

Add `<Form passwordManagers="ignore" | "allow">` context that propagates to all descendant `Input` and `Textarea` fields, so authors can flip the default once at the form level instead of repeating the prop on every credential field. Field-level `passwordManagers` still wins over the context value (explicit beats inherited), so honeypots and single-field overrides keep working. The context lives in `lib/password-managers-context.tsx` (registry:lib) and `Input`/`Textarea` import the resolver from `lib/`, so they keep installing without `Form` as a dependency. Resolver precedence: explicit field prop → context → `"ignore"` default.
