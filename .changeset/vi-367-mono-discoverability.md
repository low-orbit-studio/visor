---
"@loworbitstudio/visor-theme-engine": minor
"@loworbitstudio/visor": patch
---

VI-367: make mono slot @font-face loading discoverable + non-trapping.

Closes the trap surfaced post-BO-35 where a downstream theme pinned to `@loworbitstudio/visor-theme-engine@^0.4.x` could only express `typography.mono: { family }` (the only thing 0.4 allowed), yet failed the 0.6.0 `validate-coverage` check because the mono family had no matching `@font-face`. The fix the error message pointed to — adding `source`/`org` to the mono slot — was not expressible on the consumer's pinned engine version.

**Mono slot inherits source/org from a matching slot.** When `typography.mono.family` matches `typography.heading.family`, `typography.display.family`, or `typography.body.family` (case-insensitive) AND `typography.mono.source` is unset AND the matching slot has `source` set, mono now inherits `source`/`org` from the covering slot. Match precedence: heading → display → body. Themes that explicitly set `typography.mono.source` keep full control — inheritance only kicks in when mono's `source` is absent.

This mirrors the existing weight-merging behavior in the font pipeline when body/display family matches heading and covers the common "mono uses the same font as body" case (e.g. Blacklight's `PP Model Mono` in both slots) without forcing every theme to repeat `source`/`org` on the mono slot.

**Coverage error message names the version requirement.** When `validate-coverage` fails on `--font-mono`, the error now explicitly names the engine and CLI version requirement: mono-slot `source`/`org` loading requires `@loworbitstudio/visor-theme-engine ≥ 0.5.0` AND `@loworbitstudio/visor ≥ 0.10.0`. Bumping just the engine is silently insufficient because the visor CLI transitively pins its own engine copy (CLI 0.10 → engine ^0.6.0), so consumers must bump both packages together. Non-mono slots keep the shorter message.

New export: `formatFontCoverageError(filename, declaredAt, family)` from `@loworbitstudio/visor-theme-engine`. The CLI and the docs `generate-private-themes.mjs` script use it so the version-requirement note surfaces consistently from both call sites.

**Consumer migration — themes pinned to engine 0.4.x with a custom mono font:**

1. Bump **both** `@loworbitstudio/visor` to `≥0.10` (CLI with engine ^0.6 pin) and `@loworbitstudio/visor-theme-engine` to `≥0.6` together.
2. If your mono slot's family already matches another slot (heading/display/body) that has `source`/`org` set, no `.visor.yaml` change is required — the engine will inherit.
3. Otherwise, add `source` (and `org` for `visor-fonts`) to the mono slot directly:

```yaml
typography:
  mono:
    family: PP Model Mono
    weight: 400
    source: visor-fonts        # or google-fonts, fontshare, local
    org: low-orbit-studio      # required for visor-fonts only
```

No `.visor.yaml` schema changes; no breaking behavior for themes that already pass `validate-coverage`.
