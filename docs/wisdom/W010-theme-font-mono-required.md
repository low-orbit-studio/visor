# W010 — Every theme must explicitly define `--font-mono`

## Lesson

If a theme CSS file does not define `--font-mono`, `font-family: var(--font-mono)` resolves to nothing and the browser falls back to its default sans-serif. This is invisible at the component level — elements that should render as monospace silently render in the body font.

The `FontShowcase` specimen component uses `var(--font-mono)` directly, making this immediately visible in the Design Specimen when a theme is missing the token.

## Fix

Every theme must define `--font-mono`, even if the design has no custom monospace font. Use the system monospace stack as the fallback:

```css
--font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
```

Themes with a custom mono font (Monaspace Neon, JetBrains Mono, PP Model Mono) should list it first:

```css
--font-mono: "Monaspace Neon", ui-monospace, monospace;
```

## Affected themes

`neutral-theme.css` and `blackout-theme.css` were missing this and fixed in VI-137.

## Tags

`tokens`, `typography`, `themes`, `font-mono`, `specimen`
