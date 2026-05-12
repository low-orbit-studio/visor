# W024 — fumadocs `.prose` stomps component styles inside MDX docs pages

**Tags:** docs, mdx, fumadocs, css, prose, tailwind-typography, debugging

## The Lesson

Every component MDX page in `packages/docs/` is wrapped by fumadocs' `DocsBody`, which applies the `.prose` Tailwind Typography class. That class injects `:where(...)` rules onto every common HTML element — including elements you render *inside* your own component:

```css
/* From packages/docs/node_modules/fumadocs-ui/dist/style.css */
:where(img):not(.not-prose, .not-prose *) {
  margin-top: 2em;
  margin-bottom: 2em;
}
:where(p):not(.not-prose, .not-prose *) {
  margin-top: 1.25em;
  margin-bottom: 1.25em;
}
:where(h3):not(.not-prose, .not-prose *) {
  margin-top: 1.6em;
  margin-bottom: 0.6em;
  font-size: 1.25em;
  font-weight: 600;
  line-height: 1.6;
}
```

Symptom: spacing inside a component rendered in a docs MDX page looks WAY larger than the component's own CSS module specifies — extra ~32px above and below images, ~20px above and below paragraphs, etc. The component CSS appears to be silently ignored.

It is not. `:where()` has 0 specificity, so any explicit `margin` on the component's class beats it. But if the component doesn't *explicitly* zero out margins on every child element it renders, the `:where()` rules win by virtue of being the only rule that matches that element.

## What Was Surprising

The component CSS module's selectors target the *outer* class (e.g. `.bentoTileMedia` on an `<img>`). The author assumes `<img>` has no default margin, but prose adds one. The default-tag rules apply to *children* of the component too — if you write `<BentoTileDescription>multi-line text</BentoTileDescription>`, MDX auto-wraps the text in a `<p>` (because MDX treats children of JSX components as markdown content), and that inner `<p>` inherits prose's paragraph margins.

This is doubly invisible because:

1. The CSS is loaded via `@import 'fumadocs-ui/style.css'` in `globals.css`. You don't see those rules in the project's own source.
2. Devtools shows the `:where()` rule as applied, but you have to look closely to recognize it as the source of margin.

## The Fix

Component CSS modules used inside fumadocs MDX pages need a defensive prose reset. Add this near the top of the component's stylesheet:

```css
.<component-root> :where(img),
.<component-root> :where(p),
.<component-root> :where(h2),
.<component-root> :where(h3),
.<component-root> :where(h4),
.<component-root> :where(ul),
.<component-root> :where(ol) {
  margin: 0;
}
```

Specificity (0,1,1) beats prose's (0,0,1). The component's own padding + gap tokens then become the sole source of vertical rhythm.

Cover every HTML element the component might render OR contain (via MDX-wrapped children). At minimum: `img`, `p`, `h2`–`h4`, `ul`, `ol`. If the component embeds `blockquote`, `pre`, or `code`, add those too.

## Adjacent Trap: MDX Wraps JSX Children In `<p>`

When MDX encounters multi-line text content inside a JSX component, it wraps that text in a `<p>` element via the MDX-to-JSX compiler:

```mdx
<BentoTileDescription>
  Multi-line description text that lives on its own line.
</BentoTileDescription>
```

Compiles roughly to:

```jsx
<BentoTileDescription>
  <p>Multi-line description text that lives on its own line.</p>
</BentoTileDescription>
```

If the component itself renders as `<p>` (e.g. `<p className="bentoTileDescription">{children}</p>`), you get `<p><p>...</p></p>` — a `validateDOMNesting` error in React. This is not just a warning: it triggers a hydration mismatch and React rerenders the entire subtree client-side, which can re-order DOM and re-apply margins differently than SSR, making the page appear to "ignore" your component's CSS even though the rules are technically applied.

**Fix:** Components that accept arbitrary MDX children should render as `<div>` (or another non-`<p>` element), not `<p>`. The semantic loss is minor — readability prose inside a styled container is still readable prose.

## How To Catch This Earlier

1. **Open devtools in the live preview.** Don't trust that your CSS-module styles "should" apply — inspect a child element and look at the computed margin. If `2em` shows up under `:where(img)` in the cascade, that's the prose plugin.
2. **Watch the dev server output for `validateDOMNesting`.** A `<p>` inside a `<p>` (or `<div>` inside a `<p>`, or any block inside `<p>`) is a hydration-killing class of bug. The browser tolerates it visually but React re-renders the subtree client-side after SSR mismatch.
3. **Render the component standalone** (outside MDX) to confirm the CSS module works as intended. If the standalone version looks right and the MDX version doesn't, suspect prose interference.

## Canonical Example

VI-349's BentoTile retrofit. Three rounds of "tighter padding" CSS edits produced no visible improvement because every `<img>` in the tile carried a 32px top/bottom margin from prose's `:where(img)` rule, and the description's MDX-wrapped inner `<p>` carried a 20px top/bottom margin from prose's `:where(p)`. The fourth round added the reset above and switched `BentoTileDescription` from `<p>` to `<div>`. The previously authored 12px body padding immediately became visible.

See [`components/ui/bento-grid/bento-grid.module.css`](../../components/ui/bento-grid/bento-grid.module.css) for the in-tree reset.

## Adjacent Wisdom

- [W012](./W012-docs-component-shims.md) — Docs proxy component re-exports.
- [W022](./W022-rsc-boundary-mdx-function-props.md) — RSC boundary handling for function props.
