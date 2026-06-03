---
"@loworbitstudio/visor": minor
---

Remove the deprecated `blocks/avatar-stack/` re-export shim (VI-501, follow-up to VI-458). `AvatarStack` is now sourced solely from the `avatar` compound in `components/ui/avatar/`. The one-release migration window has elapsed; consumers should `npx visor add avatar` and import `AvatarStack` from the avatar family.
