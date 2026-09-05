---
"@loworbitstudio/visor": minor
---

VI-631: The composition lint — `visor check design` and `visor check diff` gain the three assertions they were missing, so a surface can be **proven** to introduce no styling outside the project's kit.

**`inline-style-object` (new, warn).** Nothing detected an inline `style={{}}` object before. The rule is AST-based, built on the existing JSX walker, because regex cannot separate `style={styles.foo}` from `style={{ padding: 8 }}` from a CSS-variable bridge. A CSS Module handle, a `style={{ "--accent": token }}` bridge, a forwarded `{ ...rest }` spread and a computed key are all explicitly **not** flagged.

**`hardcoded-px` — the camelCase blind spot is fixed.** The rule gated on a case-sensitive substring pre-filter, so a JSX style object's `fontSize: "13px"` matched nothing and was skipped, as were `lineHeight`, `borderRadius`, `minWidth` and `maxHeight` (the capital W/H defeated the `width`/`height` alternatives); `marginTop` and `paddingLeft` only matched by substring accident. Coverage was arbitrarily partial. Matching now happens on a **normalized property name**, so `fontSize`, `font-size` and `"font-size"` are one rule and the next camelCase property cannot reintroduce the hole.

**`kit-element-redeclared` (new, warn).** Fires when a surface declares its own `Card`, `StatCard` or `AdminShell` instead of composing the kit's. `native-map.ts` covered lowercase HTML tags only and the JSX scanner returned on any uppercase tag, so this class was invisible. The project's own copy-and-own kit sources are excluded.

**Kit membership resolves against `taxonomy.json`, read as data** — no second kit list inside the CLI. Resolution order: `--taxonomy <path>` → `VISOR_TAXONOMY` → a `"taxonomy"` key in `.visorrc.json` → conventional discovery walking up to the repository root. **It fails closed:** a taxonomy that was asked for (or demanded with the new `--composition` flag) but cannot be loaded reports a `kit-taxonomy-missing` **error** rather than a green it did not earn. When nothing is configured or discovered the assertion does not engage, and the report says `Kit membership: NOT asserted` out loud.

**The new coverage is warning-only.** Both new rules register at `warn`, and the camelCase fix keeps every previously-reported value at `error` while reporting only the newly-covered spellings at `warn`. On a real 250-file application the change added 876 warnings and **zero** new errors, so a first adoption cannot go red on coverage it never had. The newly-covered `hardcoded-px` spellings graduate to errors in a future major.

**The checkers now state their own limit.** Green means *"this surface introduced no styling outside the kit"* — it does **not** mean the surface is on-design. Both commands print that, on the green path as well as the red one, naming arrangement (right elements, wrong order), content (wrong icon, dropped hint) and data/reachability as the uncovered residue. `--json` carries the same statement as a `composition` object.

Also fixed: `check design --json` and `check diff --json` truncated large payloads mid-string when piped, because `process.exit()` raced the stdout flush. Both now set `process.exitCode` and return.

Existing findings are unchanged — every pre-existing fixture reports the same rules, lines and severities as before.
