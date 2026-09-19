---
"@loworbitstudio/visor-theme-engine": minor
---

VI-648: a `scopePrefix` theme's semantic aliases now resolve against the theme, not visor-core's `:root` default.

visor-core emits its semantic layer as indirections — `--chart-1: var(--color-primary-500)`, `--weight-heading: var(--font-weight-heading)` — declared on `:root`. Custom-property substitution resolves **where the property is declared**, so on a `scopePrefix` theme (the VI-368 body-class repaint pattern every Blacklight theme uses) those aliases never saw the theme's primitives on the scope selector. `body` inherited the already-substituted visor-core default and the theme was silently ignored.

Measured on `blackout` + `--scope-prefix 'body.x'` before this change:

```
--weight-heading  600        theme declares 700
--weight-label    500        theme declares 400
--chart-1         #3b82f6    stock blue on a monochrome theme
--sidebar-bg      #f9fafb    theme declares #f5f5f5
--skeleton-from   #f3f4f6    light gray on a dark theme
```

VI-648 was filed on `--weight-heading` alone. An audit of every `--X: var(--Y)` alias in the emitted `tokens.css` found **48 of 114** with the same defect; the engine independently resolves the other 66 to concrete values and already emits those on the scope. `--skeleton-*` and `--chart-*` are consumed by shipped components, so the original "no visible effect" assessment did not hold.

The nextjs adapter now re-declares the affected aliases on the scope selector inside `@layer visor-semantic`, which moves the substitution to the scope. The list is filtered on both sides, so it can never make output worse: an alias the theme declares itself is skipped (the theme's value is authoritative), and an alias whose referent the theme does not declare is skipped (inheriting visor-core's default is then correct).

**`:root`-scoped output is byte-identical** — verified across all five stock themes. A `:root` theme declares its primitives on the same element visor-core aliases from, so substitution already sees them.

**Consumers on a `scopePrefix` theme must re-run `visor theme apply` to pick this up**, since the fix is in generated CSS. No `.visor.yaml` changes are needed.

New exports: `VISOR_CORE_SEMANTIC_ALIASES`, `collectDeclaredProperties`, `generateSemanticAliasDecls`.
