---
"@loworbitstudio/visor": patch
---

VI-628: Guard unchecked index reads in `doc-frame` and `doc-nav` so a consumer can type-check them under `noUncheckedIndexedAccess`.

The Golden Ticket docs-host scaffold enables `noUncheckedIndexedAccess`, and a scaffolded host type-checks the copy-in components it vendors from this registry — so three unguarded index reads surfaced as `next build` errors in code the consumer must not edit. `doc-frame`'s `cssUrl()` returned a regex capture-group read directly (`match[1]`, `string | undefined`) from a `string | null` signature, and `doc-nav`'s `groupKeyFor()` passed `scope[0]` into two `string` parameters. Both now bind the index read and guard it rather than asserting it — no `!`, no `@ts-expect-error`.

Behaviour is unchanged on every input either component already handled. `cssUrl()`'s guard collapses "matched but captured nothing" into the same `null` the no-match branch already returned, which the caller's `if (!url)` treats identically; the capture group cannot match empty, so the branch is unreachable in practice. `groupKeyFor()`'s guard is likewise unreachable — `hasScope` already proves a non-empty array — and falls through to the same Shared bucket an absent scope resolves to. A `tsconfig.strict-index.json` plus a colocated test now compile both components under the consumer's compiler so this class cannot silently return; the repo-wide flag is deliberately left off.
