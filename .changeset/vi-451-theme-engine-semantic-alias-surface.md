---
"@loworbitstudio/visor-theme-engine": minor
---

VI-451 feat: semantic alias surface (intent, hairline, discrete scales).

Adds an engine-wide alias layer on top of the existing primitive ramp so consumers can reference brand/feedback colors, alpha-based hairlines, and discrete pixel-named scales without redeclaring a parallel token surface. All new aliases emit into the `visor-semantic` cascade layer (declared but previously empty) so consumer overrides in app-globals still take precedence.

New tokens — 38 total — emitted by every theme:

* Bare-name intent (shadcn convention): `--primary`, `--primary-text`, `--accent`, `--success`, `--warning`, `--destructive`, `--info`
* Alpha hairlines: `--hairline`, `--hairline-strong`
* Surface extensions: `--surface-screen`, `--surface-elev`
* Text extension: `--text-muted`
* Discrete font-size aliases: `--text-{11,13,14,16,20,24,32,40,48}`
* Discrete 4px-grid space aliases: `--space-{1..16}`

Themes pin per-mode values via flat-key overrides (e.g. `primary: "#6BEBA5"`); bare `primary` resolves to the new `intent` group while prefixed `text-primary` continues to route to the text group — no collision with existing tokens. Discrete scale values are mode-agnostic; `--space-N` derives from `spacing.base` so a theme with a non-default base gets a proportional scale.

Engine ships with derived defaults so every theme picks up the alias surface automatically. Theme-specific values flow through the existing `overrides.{light,dark}` path. Surfaces the gap [VI-451](https://linear.app/low-orbit-studio/issue/VI-451) flagged from the admin-ui organization-management reference build — consumers can now `var(--surface-card)`, `var(--primary)`, `var(--hairline)`, `var(--text-14)`, etc. directly.

Drive-by: engine schema now accepts opt-in `motion.easing-overshoot` for themes that want bouncy entrances (emitted as `--motion-easing-overshoot` only when set, so the default token surface is unchanged for themes that don't opt in).
