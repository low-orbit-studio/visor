# W023 — Design checker: regex over PostCSS, CSS selector context for multi-line rules

**Context:** PL-1376 — implementing `visor check design`, a deterministic anti-pattern scanner.

## Decisions made

### 1. Regex over PostCSS for CSS parsing

The ticket spec mentioned using PostCSS "where needed for token detection." After examining the actual rules, PostCSS was unnecessary for every rule in the initial set:

- Token detection (`--primitive-*`, `--palette-*`) = substring match on variable names
- Dark mode block detection = regex on `@media (prefers-color-scheme: dark)` / `[data-theme="dark"]`
- Hover transition = regex for `:hover` and `transition` in the same file

**PostCSS would add meaningful complexity** (full CSS AST, additional dependency, async parse) without improving rule accuracy for string-match rules. Reserve PostCSS for rules that need structural CSS navigation (e.g., "this property is inside a `:root` block") — none of the initial 16 rules needed that.

**Rule of thumb:** Reach for PostCSS only when you need to answer "where in the CSS structure is this value?" not "does this string appear somewhere in the file?"

### 2. CSS selector context tracking for multi-line rules

The `sub-44px-touch-target` rule needs to fire when a small `width`/`height` appears inside a selector that names an interactive element (`.icon-button`, `.btn`, etc.). The natural implementation checks the current line for both the size value AND the interactive keyword — but CSS properties are on separate lines from their selectors.

**Wrong:** Check `width: 32px` line for `/button/` — always misses since `.icon-button {` is 2 lines above.

**Correct:** Track `currentSelector` (updated on any line matching `/\{/`) and test `INTERACTIVE_SELECTOR_RE` against *both* the current property line and the remembered selector. This gives accurate context without PostCSS or full CSS parsing.

**Pattern to generalise:** Whenever a CSS checker rule needs "is this property inside a selector matching X?", maintain a `currentSelector` variable that updates on `{`-bearing lines, and include it in the match test.
