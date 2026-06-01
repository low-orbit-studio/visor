---
"@loworbitstudio/visor-theme-engine": minor
---

Pass-through brand tokens (VI-493). Unrecognized `overrides` keys are no longer
silently dropped — they now emit as bare `--<key>` custom properties inside
`@layer visor-brand` in both the nextjs and docs adapters, with mode-specific
values (light keys under the light selector, dark keys under the dark toggle +
`prefers-color-scheme` media query). This ends the dual-source-of-truth between
`.visor.yaml` and hand-maintained `:root` blocks. New public API:
`collectBrandPassthrough`, `hasBrandPassthrough`, and the `BrandPassthrough`
type. Dev builds emit a fail-loud sentinel comment naming every pass-through
token and render any unresolved (empty) value as a bright `#ff00ff` sentinel
color. The `UNKNOWN_OVERRIDE_KEY` validation message now describes the
pass-through behavior.
