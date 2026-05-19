# @loworbitstudio/visor-tailwind-preset

> Tailwind CSS preset that wires every Visor design token into Tailwind theme keys. Use Visor utilities — `bg-surface-card`, `text-text-primary`, `gap-4`, `rounded-pill`, `shadow-md`, `duration-normal` — without re-declaring a single hex value, spacing scale, or motion token in your `tailwind.config.ts`.

## Why this exists

Across Low Orbit apps the recurring pattern has been to re-declare Visor's brand palette as hard-coded hex values in each app's Tailwind config (km-app re-declared Char/Bone/Ember/Rust/Bark; Blacklight does similar). That breaks two things:

1. **Token propagation.** A change to `--color-primary-500` in `@loworbitstudio/visor-core` doesn't reach any consumer's Tailwind class until each app's config is manually updated.
2. **The Borealis rule.** "Don't hand-roll tokens, colors, or spacing — wire through Visor."

This preset is the industry-standard fix (the shadcn/ui pattern, the Tailwind 4 `@theme` idiom). Tokens stay in one place; Tailwind utilities resolve to CSS variables at runtime; per-theme overrides flow through automatically.

## Install

```sh
npm install -D @loworbitstudio/visor-tailwind-preset
```

You also need `@loworbitstudio/visor-core` installed and its CSS imported in your global stylesheet — that's the package that actually declares the CSS custom properties this preset references:

```css
/* app/globals.css */
@import "@loworbitstudio/visor-core";
```

## Tailwind 3 — preset (default)

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss"
import visorPreset from "@loworbitstudio/visor-tailwind-preset"

const config: Config = {
  presets: [visorPreset],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
}
export default config
```

CommonJS form:

```js
// tailwind.config.js
module.exports = {
  presets: [require("@loworbitstudio/visor-tailwind-preset")],
  content: ["./app/**/*.{ts,tsx}"],
}
```

Now Visor tokens are reachable as ordinary Tailwind classes:

```tsx
<div className="bg-surface-card text-text-primary rounded-lg p-4 shadow-md">
  <h2 className="font-heading text-2xl text-text-primary">Hello</h2>
  <p className="text-text-secondary leading-normal">A Visor-themed card.</p>
  <button className="bg-interactive-primary-bg text-interactive-primary-text rounded-md px-4 py-2 duration-normal">
    Action
  </button>
</div>
```

## Tailwind 4 — `@theme` directive

Tailwind 4 dropped JavaScript presets for the new engine and replaced them with the CSS-first `@theme { ... }` directive. The preset ships a pre-built CSS file you `@import`:

```css
/* app/globals.css */
@import "tailwindcss";
@import "@loworbitstudio/visor-core";
@import "@loworbitstudio/visor-tailwind-preset/v4.css";
```

Or, if you'd rather generate the `@theme` block programmatically (e.g. inside a build step):

```ts
import { visorTailwindV4Theme } from "@loworbitstudio/visor-tailwind-preset/v4"

// visorTailwindV4Theme is a CSS string starting with `@theme { ... }`.
writeFileSync("app/visor-theme.css", visorTailwindV4Theme)
```

## What's exposed

| Tailwind key | Visor source | Example utility |
| --- | --- | --- |
| `colors.color.*` | Primitive color ramps (`--color-primary-500`, `--color-neutral-900`) | `bg-color-primary-500`, `text-color-neutral-900` |
| `colors.text.*` | Adaptive text tokens (`--text-primary`, `--text-link`) | `text-text-primary`, `text-text-link` |
| `colors.surface.*` | Adaptive surface tokens (`--surface-card`, `--surface-page`) | `bg-surface-card`, `bg-surface-page` |
| `colors.border.*` | Adaptive border tokens (`--border-default`, `--border-focus`) | `border-border-default` |
| `colors.interactive.*` | Button / action states (`--interactive-primary-bg`) | `bg-interactive-primary-bg` |
| `colors.chart.*` | Chart palette (`--chart-1`..`--chart-5`) | `text-chart-1` |
| `colors.sidebar.*` | Sidebar palette | `bg-sidebar-bg` |
| `spacing.*` | Visor spacing scale (4 px grid) | `p-4`, `gap-3.5`, `m-24` |
| `fontFamily.*` | `--font-sans`, `--font-mono`, `--font-display`, `--font-heading`, `--font-body` | `font-sans`, `font-display` |
| `fontSize.*` | Visor type scale | `text-xs`, `text-4xl` |
| `fontWeight.*` | Visor weights | `font-medium`, `font-bold` |
| `lineHeight.*` | Visor leading | `leading-snug` |
| `borderRadius.*` | Visor radii (+ `pill` alias) | `rounded-md`, `rounded-pill` |
| `borderWidth.*` | Visor border widths + stroke widths | `border-2`, `border-thick` |
| `boxShadow.*` | Visor elevation | `shadow-xs`..`shadow-xl` |
| `opacity.*` | Visor opacity steps | `opacity-50`, `opacity-12` |
| `zIndex.*` | Visor z-scale | `z-modal`, `z-toast` |
| `transitionDuration.*` | Semantic motion durations | `duration-fast`, `duration-normal`, `duration-slow` |
| `transitionTimingFunction.*` | Semantic easing | `ease`, `ease-enter`, `ease-exit`, `ease-spring` |
| `ringWidth.*` | Focus-ring widths | `ring`, `ring-offset` |

## Theming

The preset is theme-agnostic. Per-app and per-theme overrides — Knowmentum's Char/Bone/Ember, Veronica's warmth tokens, dark mode — live in the CSS variable layer published by `@loworbitstudio/visor-core` and per-app theme overrides. When `--surface-card` changes, every `bg-surface-card` utility picks it up automatically. No regeneration, no rebuilds.

## Programmatic introspection

If you need the raw token map (for documentation, a custom validator, or a Storybook addon):

```ts
import {
  visorTokenMaps,
  listExposedTokens,
} from "@loworbitstudio/visor-tailwind-preset/tokens"

console.log(visorTokenMaps.colors)
// { "color.primary.500": "color-primary-500", "text.primary": "text-primary", ... }

console.log(listExposedTokens())
// ["border-default", "color-primary-500", "color-primary-600", ...]
```

## Version pinning

This preset peer-depends on `@loworbitstudio/visor-core`. Pin both to the same minor when the team cuts a coordinated Visor release; mismatched minors can drift if Visor adds a new token that the preset doesn't yet expose. The validation test in this package (`src/__tests__/validate.test.ts`) catches drift in CI by comparing the preset's exposed surface against the tokens package's compiled CSS.

Recommended `package.json`:

```json
{
  "dependencies": {
    "@loworbitstudio/visor-core": "0.8.x",
    "@loworbitstudio/visor-tailwind-preset": "0.1.x"
  }
}
```

## Smoke-testing in a consumer (manual)

The first consumer is km-app. Until the consumer ships its own follow-up PR, manual reproduction looks like this:

1. In your consumer app, `npm install -D @loworbitstudio/visor-tailwind-preset`.
2. Rewire `tailwind.config.ts` to use `presets: [require("@loworbitstudio/visor-tailwind-preset")]`. Delete any hand-rolled hex values that the preset now covers.
3. Verify in a browser that classes like `bg-surface-card`, `text-text-primary`, `rounded-pill`, `shadow-md`, and `duration-normal` resolve to the same computed styles as before (visual diff should be zero).
4. Use the browser inspector to confirm a class like `bg-surface-card` produces `background-color: var(--surface-card)` in the compiled CSS — not a hard-coded hex.

## License

MIT — © Low Orbit Studio
