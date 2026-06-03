---
"@loworbitstudio/visor": minor
---

Re-home `AvatarStack` as a compound primitive in the `avatar` family (VI-458). It is
now exported from `components/ui/avatar/avatar.tsx` alongside `Avatar`, `AvatarImage`,
and `AvatarFallback` (mirroring the `Tabs` / `RadioGroup` compound-export pattern),
with its CSS module and tests relocated into the avatar family. The VI-424
`blocks/avatar-stack/` entry is reduced to a one-line re-export and flagged
`deprecated: true` / `superseded_by: avatar`, so `npx visor add avatar-stack` keeps
working. Public API and DOM output are unchanged — purely additive consolidation.
