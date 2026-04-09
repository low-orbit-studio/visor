# W011 — Script insertion into theme CSS must target the first selector rule, not the first `{`

## Lesson

When writing a script that inserts CSS custom properties into a theme file, searching for the first `{` or `\n}` will land inside `@font-face` blocks if the file starts with font-face declarations — not the theme selector rule.

CSS custom properties inside `@font-face` are syntactically valid but have no effect (they're not inherited by any element). The inserted tokens are silently ignored.

## Fix

Search for the first selector rule (lines starting with `.` or `#`) rather than the first brace:

```ts
// ✗ Finds first { — may be inside @font-face
const firstClose = css.indexOf("\n}")

// ✓ Finds first selector rule block
const selectorMatch = css.match(/\n([.#][\w-]+\s*\{)/)
const selectorStart = selectorMatch.index
const closeIdx = css.indexOf("\n}", selectorStart)
```

## Context

Discovered during `scripts/compute-primary-scales.ts` development when theme files like `blackout-theme.css` and `space-theme.css` open with `@font-face` declarations. The `--color-primary-*` tokens were inserted into the font-face block and silently dropped.

## Tags

`scripts`, `css`, `themes`, `font-face`, `automation`
