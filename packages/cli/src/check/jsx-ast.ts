/**
 * Synchronous JSX/TSX parse for the design rule engine (VI-631 D4).
 *
 * `scanDesign` is a synchronous rule pipeline, so the composition rules that
 * need real syntax — inline `style={{}}` objects and local re-declarations of a
 * kit element — get the parser through a static import rather than the lazy
 * dynamic import `jsx-scan.ts` uses for `visor check diff`.
 *
 * Regex cannot separate `style={styles.foo}` from `style={{ padding: 8 }}` from
 * a CSS-variable bridge, which is exactly why these rules are AST-based.
 */

import { parse as babelParse } from "@babel/parser"

/**
 * Parse a source file as JSX + TypeScript. Returns `null` when the file cannot
 * be parsed at all — a rule that cannot see the syntax reports nothing rather
 * than guessing.
 */
export function parseJsx(source: string): unknown | null {
  try {
    return babelParse(source, {
      sourceType: "module",
      plugins: ["jsx", "typescript"],
      errorRecovery: true,
    })
  } catch {
    return null
  }
}
