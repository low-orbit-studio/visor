---
"@loworbitstudio/visor": patch
---

Add CI changeset gate: PRs that touch shipping-package source now require a `.changeset/*.md` entry or the merge is blocked. Includes `[skip-changeset]` title token and `skip-changeset` label opt-out for legitimate exemptions. Updates CONTRIBUTING.md with changeset workflow docs.
