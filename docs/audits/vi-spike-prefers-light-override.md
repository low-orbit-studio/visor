# VI-723: OS-dark blocks that override an explicit light choice

VI-721 fixed the docs adapter, where the OS-dark selector was guarded on the themed element rather than `<html>`, so `.light` on `<html>` could not stop it and its specificity beat the light rule. This audit checks every other emitter for the same flaw. Spike only: no fixes.

## Verdicts

| Emitter | Verdict | Follow-up |
|---|---|---|
| `generate-css.ts:568` unscoped (`:root`), the default `tokens.css` / visor-core | Not affected for `.light` / `data-theme=light` on `<html>`. Latent only if the marker is on `<body>`. | none |
| `generate-css.ts:568` scoped (`scopePrefix`) | **Affected** | VI-724 |
| `adapters/nextjs.ts` unscoped (`:root`), incl. passthrough and component-tokens | Not affected on `<html>` (same latent body caveat) | none |
| `adapters/nextjs.ts:218,241,363` scoped (`body.x-theme`), incl. `brand-passthrough.ts` and `component-tokens-css.ts` | **Affected** | VI-725 |
| `adapters/deck.ts:142` | **Affected**, latent (no consumer sets a light marker today) | VI-726 |
| `brand/pipeline.ts` unscoped `:root:not(.light)` | Not affected on `<html>` (reasoned: same `:root` shape as above; VI-721 already guards the scoped path) | none |
| `fowt.ts:30` `matchMedia` fallback | Not affected (reasoned) | none |

## Why unscoped is safe and scoped is not

The unscoped OS-dark selector is `:root:not(.light):not(.theme-light):not([data-theme="light"])`. `:root` is `<html>`, so the guard sits on the element that carries the toggle. A light marker on `<html>` stops the selector matching at all. Specificity never comes into it.

The scoped selector is `body.x-theme:not(.light)...`. The guard checks `<body>`, but next-themes (`attribute="class"`) writes `.light` on `<html>`. The selector still matches, and at (0,4,1) it beats the light rule `html:not(.dark) body.x-theme` (0,2,2). That is the VI-721 shape.

## Where consumers put the mode marker

- Kaiah admin and Veronica admin use next-themes `attribute="class"`, so the marker is on `<html>`. Both consume unscoped `:root` output, so they are not affected.
- Blacklight website and pro use the scoped `body.blacklight-*-theme` output (affected pattern) but are dark-only today, with `class="dark"` / `data-theme="dark"` and no light toggle. The flaw is therefore latent there. Any scoped consumer that adds a next-themes light mode will hit it.
- low-orbit-decks' `DeckShell` applies `deck--{id}` and no light/dark marker. Latent.

## Repro

Static page with the generated CSS from a probe theme, Playwright `colorScheme: 'dark'` versus `'light'`, reading computed `--surface-page` / `--text-primary` on a descendant. A row is **AFFECTED** when OS-dark differs from OS-light despite an explicit light marker. Each case is a `setContent` of `<html {marker}><style>{css}</style><body {marker}>...`, one fresh context per colour scheme.

| CSS | Light marker | OS-light | OS-dark | Result |
|---|---|---|---|---|
| default bundle (`:root`) | `.light` on html | `#FFFFFF` / `#111827` | `#FFFFFF` / `#111827` | ok |
| default bundle (`:root`) | `data-theme=light` on html | same | same | ok |
| default bundle (`:root`) | `.light` on body only | `#FFFFFF` / `#111827` | `#030712` / `#f9fafb` | affected (latent) |
| nextjs `:root` | `.light` on html | `#FFFFFF` / `#111827` | `#FFFFFF` / `#111827` | ok |
| nextjs `:root` | `data-theme=light` on html | same | same | ok |
| nextjs scoped `body.probe-theme` | `.light` on html | `#FFFFFF` / `#111827` | `#030712` / `#f9fafb` | **affected** |
| nextjs scoped `body.probe-theme` | `data-theme=light` on html | `#FFFFFF` / `#111827` | `#030712` / `#f9fafb` | **affected** |
| nextjs scoped `body.probe-theme` | `.light` on body | `#FFFFFF` / `#111827` | `#FFFFFF` / `#111827` | ok |
| deck `.deck--probe` | `.light` on html | `#FFFFFF` / `#111827` | `#030712` / `#f9fafb` | **affected** |
| deck `.deck--probe` | `.light` on deck element | `#FFFFFF` / `#111827` | `#FFFFFF` / `#111827` | ok |

`generate-css.ts` scoped output is the source of the `nextjs` scoped rows, since `nextjsAdapter` composes `generateDarkCss` with `scopePrefix`. All 9 prefers selectors in the scoped nextjs output are the unguarded form, including the brand-passthrough and component-tokens ones, which take the same `prefers` string.

## Not tested

- `brand/pipeline.ts` unscoped and `fowt.ts` are verdicts by reading, not by Playwright. `fowt.ts` only adds `.dark` when `!stored && matchMedia`, so a stored choice always wins; `.light` is added otherwise.
- The `.light` marker on `<body>` with unscoped output is reported but no ticket is filed: no known consumer does it.

## Follow-ups

- VI-724: generate-css scoped prefersSelector
- VI-725: nextjs adapter scoped prefers selectors
- VI-726: deck adapter
