/**
 * visor check design <path>
 *
 * Deterministic static analysis for Borealis design anti-patterns.
 * No LLM required — pure regex + light AST walking.
 *
 * Rules:
 *   Error (Borealis violations — non-negotiable):
 *     tier-1-token-direct-usage, hardcoded-hex, hardcoded-px, missing-dark-mode-block,
 *     missing-hover-transition, div-as-input, setstate-hover, missing-aria-pressed
 *
 *   Warn (general anti-patterns):
 *     banned-fonts, purple-gradient-on-white, pure-black-untinted, bounce-easing,
 *     sub-44px-touch-target, line-length-over-75ch, gradient-text, excessive-card-nesting,
 *     missing-visor-base-layer
 */

import { readFileSync, readdirSync, statSync, existsSync } from "fs"
import { resolve, extname, join, basename, dirname } from "path"

import { NATIVE_TO_VISOR, INPUT_TYPE_MAP } from "./native-map.js"
import { parseJsx } from "./jsx-ast.js"
import { walk } from "./jsx-scan.js"
import { resolveTaxonomy } from "./taxonomy.js"
import type { KitTaxonomy, TaxonomySource } from "./taxonomy.js"

// ─── Types ───────────────────────────────────────────────────────────────────

export type Severity = "error" | "warn"

export interface DesignFinding {
  file: string
  line: number
  rule: string
  severity: Severity
  message: string
  fix?: string
}

/**
 * The composition-only scope statement (VI-631 D2).
 *
 * A checker that overstates its scope is worse than no checker. Every report
 * this module produces carries this block so a green can never be read as a
 * claim about arrangement — the tool says its own limit, in its own output.
 */
export interface CompositionScope {
  scope: "composition-only"
  asserts: string
  doesNotAssert: string[]
  limit: string
  kitMembership: {
    asserted: boolean
    taxonomyPath: string | null
    source: TaxonomySource | null
    elementCount: number
    reason: string
  }
}

export interface DesignCheckResult {
  errors: DesignFinding[]
  warnings: DesignFinding[]
  summary: {
    errorCount: number
    warningCount: number
    filesScanned: number
  }
  composition: CompositionScope
}

export interface RuleResult {
  findings: DesignFinding[]
}

export type RuleFn = (source: string, filePath: string) => DesignFinding[]

// ─── Visorrc helpers ──────────────────────────────────────────────────────────

export interface VisorRc {
  disabledRules?: string[]
  /** Path to the project's `taxonomy.json` kit definition (VI-631 D7). */
  taxonomy?: string
}

export function loadVisorRc(dir: string): VisorRc {
  const rcPath = join(dir, ".visorrc.json")
  if (!existsSync(rcPath)) return {}
  try {
    const raw = readFileSync(rcPath, "utf-8")
    return JSON.parse(raw) as VisorRc
  } catch {
    return {}
  }
}

// ─── File collection ──────────────────────────────────────────────────────────

const CODE_EXTS = new Set([".tsx", ".jsx", ".ts", ".js"])
const STYLE_EXTS = new Set([".css", ".module.css"])
const ALL_EXTS = new Set([...CODE_EXTS, ...STYLE_EXTS])

export function collectFiles(pathArg: string): string[] {
  const abs = resolve(pathArg)
  try {
    const s = statSync(abs)
    if (s.isDirectory()) {
      const files: string[] = []
      function recurse(dir: string) {
        for (const entry of readdirSync(dir)) {
          if (entry.startsWith(".") || entry === "node_modules" || entry === "dist") continue
          const full = join(dir, entry)
          const es = statSync(full)
          if (es.isDirectory()) recurse(full)
          else if (ALL_EXTS.has(extname(full))) files.push(full)
        }
      }
      recurse(abs)
      return files
    }
    if (ALL_EXTS.has(extname(abs))) return [abs]
  } catch {
    // fall through
  }
  return []
}

// ─── Utility helpers ──────────────────────────────────────────────────────────

function lines(source: string): string[] {
  return source.split("\n")
}

function finding(
  file: string,
  line: number,
  rule: string,
  severity: Severity,
  message: string,
  fix?: string
): DesignFinding {
  return { file, line, rule, severity, message, ...(fix ? { fix } : {}) }
}

// ─── Tier-1 primitive token names ────────────────────────────────────────────
// These are the raw primitive CSS variable names that should NEVER be referenced
// directly from component code — only semantic tokens (--color-*, --space-*, etc.)
// should be used. We keep a static list of the known primitive prefixes.

const TIER1_PREFIXES = [
  "--primitive-",
  "--raw-",
  "--base-color-",
  "--palette-",
]

// ─── Rules ───────────────────────────────────────────────────────────────────

/**
 * error: tier-1-token-direct-usage
 * Catches direct usage of Tier-1 primitive CSS variables in component code.
 * Borealis rule: only Tier-2 semantic tokens should be referenced.
 */
function ruleTier1TokenDirectUsage(source: string, filePath: string): DesignFinding[] {
  const found: DesignFinding[] = []
  const ext = extname(filePath)
  // Only applies to component code (not CSS files where primitives are legitimately defined)
  if (STYLE_EXTS.has(ext)) return found

  const src = lines(source)
  for (let i = 0; i < src.length; i++) {
    const l = src[i]
    for (const prefix of TIER1_PREFIXES) {
      if (l.includes(prefix)) {
        found.push(finding(
          filePath, i + 1,
          "tier-1-token-direct-usage",
          "error",
          `Direct use of Tier-1 primitive token "${prefix}..." detected. Use a Tier-2 semantic token instead.`,
          "Replace with the equivalent semantic token from the Borealis token registry."
        ))
        break
      }
    }
  }
  return found
}

/**
 * error: hardcoded-hex
 * Catches raw hex color literals in TSX/JSX/CSS that bypass the token system.
 */
function ruleHardcodedHex(source: string, filePath: string): DesignFinding[] {
  const found: DesignFinding[] = []
  // Match 3, 4, 6, or 8-digit hex colors — #rgb, #rrggbb, #rrggbbaa
  const HEX_RE = /#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6,8})\b/g
  const src = lines(source)
  for (let i = 0; i < src.length; i++) {
    const l = src[i]
    // Skip comment lines
    if (l.trim().startsWith("//") || l.trim().startsWith("*") || l.trim().startsWith("/*")) continue
    // Skip visorrc/config files
    if (basename(filePath).startsWith(".")) continue
    let m: RegExpExecArray | null
    HEX_RE.lastIndex = 0
    while ((m = HEX_RE.exec(l)) !== null) {
      found.push(finding(
        filePath, i + 1,
        "hardcoded-hex",
        "error",
        `Hardcoded hex color "${m[0]}" bypasses the Borealis token system.`,
        "Replace with the appropriate semantic token: var(--color-surface), var(--color-text-primary), etc."
      ))
    }
  }
  return found
}

/**
 * error: hardcoded-px
 * Catches hardcoded pixel values for spacing/sizing that bypass spacing tokens.
 * Excludes 0px, 1px (borders), and common shadow blur values (2px, 3px).
 *
 * VI-631 D5 — the camelCase blind spot.
 * ------------------------------------
 * The original context gate was a case-sensitive substring pre-filter, so a JSX
 * style object's `fontSize: "13px"` matched *nothing* and was skipped, as were
 * `lineHeight`, `borderRadius`, `minWidth` and `maxHeight` (the capital W/H
 * defeat the `width`/`height` alternatives). `marginTop` and `paddingLeft` only
 * matched by substring accident. Coverage was arbitrarily partial.
 *
 * The fix matches on a **normalized property name** rather than widening the
 * alternation — widening would leave the rule accidentally partial and the next
 * camelCase property would reintroduce the hole.
 *
 * Severity is the adoption ramp (D3). The legacy filter is retained as the
 * "was this already covered?" oracle: a value the old rule reported still
 * reports as an **error** (byte-identical output on existing codebases), and a
 * value only the normalized matcher finds reports as a **warning**, so fixing
 * the blind spot cannot turn a first adoption into a wall of red.
 */
const PX_WHITELIST = new Set(["0px", "1px", "2px", "3px"])

/** The pre-VI-631 context gate. Kept only to decide severity, never coverage. */
const LEGACY_PX_CONTEXT_RE =
  /margin|padding|width|height|gap|top:|left:|right:|bottom:|font-size|line-height|min-width|max-width|min-height|max-height/

/**
 * Spacing/sizing property names in normalized form — lowercased with every
 * separator stripped, so `fontSize`, `font-size` and `"font-size"` all collapse
 * to `fontsize`. Adding a property here covers all three spellings at once.
 */
const SIZING_PROPS = new Set([
  // box model
  "margin", "margintop", "marginright", "marginbottom", "marginleft",
  "marginblock", "marginblockstart", "marginblockend",
  "margininline", "margininlinestart", "margininlineend",
  "padding", "paddingtop", "paddingright", "paddingbottom", "paddingleft",
  "paddingblock", "paddingblockstart", "paddingblockend",
  "paddinginline", "paddinginlinestart", "paddinginlineend",
  // intrinsic size
  "width", "minwidth", "maxwidth", "height", "minheight", "maxheight",
  "size", "blocksize", "minblocksize", "maxblocksize",
  "inlinesize", "mininlinesize", "maxinlinesize",
  // position
  "top", "right", "bottom", "left",
  "inset", "insetblock", "insetinline",
  // layout gaps
  "gap", "rowgap", "columngap", "gridgap", "gridrowgap", "gridcolumngap",
  // typographic metrics
  "fontsize", "lineheight", "letterspacing", "wordspacing", "textindent",
  // corner radius
  "borderradius",
  "bordertopleftradius", "bordertoprightradius",
  "borderbottomleftradius", "borderbottomrightradius",
  "borderstartstartradius", "borderstartendradius",
  "borderendstartradius", "borderendendradius",
  // flex + scroll boxes
  "flexbasis", "scrollmargin", "scrollpadding",
])

/** Property-name-followed-by-colon, in CSS, JS-object and quoted-key form. */
const PROP_NAME_RE = /(^|[^\w$])(-{0,2}[A-Za-z][\w-]*)\s*:/g

function normalizeProp(name: string): string {
  return name.replace(/[^A-Za-z0-9]/g, "").toLowerCase()
}

/** True when the line declares any property in `SIZING_PROPS`, any spelling. */
function hasSizingProp(line: string): boolean {
  PROP_NAME_RE.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = PROP_NAME_RE.exec(line)) !== null) {
    if (SIZING_PROPS.has(normalizeProp(m[2]))) return true
  }
  return false
}

function ruleHardcodedPx(source: string, filePath: string): DesignFinding[] {
  const found: DesignFinding[] = []
  // Match pixel values used in spacing/sizing contexts only
  const PX_RE = /\b(\d+(?:\.\d+)?)px\b/g
  const src = lines(source)
  for (let i = 0; i < src.length; i++) {
    const l = src[i]
    if (l.trim().startsWith("//") || l.trim().startsWith("*") || l.trim().startsWith("/*")) continue
    // Union gate: everything the legacy filter caught, plus every spelling the
    // normalized matcher now covers. A strict superset — nothing stops firing.
    const legacy = LEGACY_PX_CONTEXT_RE.test(l)
    if (!legacy && !hasSizingProp(l)) continue
    let m: RegExpExecArray | null
    PX_RE.lastIndex = 0
    while ((m = PX_RE.exec(l)) !== null) {
      const full = m[0]
      if (PX_WHITELIST.has(full)) continue
      found.push(legacy
        ? finding(
          filePath, i + 1,
          "hardcoded-px",
          "error",
          `Hardcoded pixel value "${full}" in spacing/sizing bypasses the Borealis spacing token system.`,
          "Replace with a semantic spacing token: var(--space-1), var(--space-2), var(--space-4), etc."
        )
        : finding(
          filePath, i + 1,
          "hardcoded-px",
          "warn",
          `Hardcoded pixel value "${full}" in spacing/sizing bypasses the Borealis spacing token system. Reported as a warning because this property spelling was previously skipped (VI-631) — it will graduate to an error in a future major.`,
          "Replace with a semantic spacing token: var(--space-1), var(--space-2), var(--space-4), etc."
        ))
    }
  }
  return found
}

// ─── Composition rules (VI-631) ───────────────────────────────────────────────

/** Kit taxonomy resolved for the current scan. Set by `scanDesign`, read by rules. */
let activeKit: KitTaxonomy | null = null

/**
 * warn: inline-style-object
 *
 * An inline `style={{ ... }}` object is styling the surface introduces itself —
 * outside the kit, outside the token system, unthemeable and unauditable.
 *
 * AST-based, never regex (D4). Regex cannot separate:
 *   - `style={styles.foo}`            — a CSS Module handle, legitimate
 *   - `style={{ padding: 8 }}`        — the violation
 *   - `style={{ "--x": token }}`      — a CSS-variable bridge, legitimate
 * Only the second is flagged: the value must be an object literal, and at least
 * one of its own (non-computed) keys must be a real CSS property rather than a
 * custom property. Spread properties are forwarding, not authoring, and pass.
 */
function ruleInlineStyleObject(source: string, filePath: string): DesignFinding[] {
  if (!CODE_EXTS.has(extname(filePath))) return []
  const ast = parseJsx(source)
  if (!ast) return []

  const found: DesignFinding[] = []

  walk(ast, (node) => {
    if (node.type !== "JSXAttribute") return
    const nameNode = node.name as Record<string, unknown> | undefined
    if (nameNode?.type !== "JSXIdentifier" || nameNode.name !== "style") return

    const valueNode = node.value as Record<string, unknown> | null
    if (!valueNode || valueNode.type !== "JSXExpressionContainer") return

    // `style={styles.foo}` / `style={cx(...)}` / `style={props.style}` — the
    // expression is not an object literal, so no styling is authored here.
    const expr = valueNode.expression as Record<string, unknown> | undefined
    if (expr?.type !== "ObjectExpression") return

    const declared: string[] = []
    for (const raw of (expr.properties as unknown[]) ?? []) {
      const prop = raw as Record<string, unknown>
      // SpreadElement — forwarding an existing style object, not authoring one.
      if (prop.type !== "ObjectProperty") continue
      // `style={{ [key]: v }}` — the key is an expression; cannot prove a violation.
      if (prop.computed === true) continue
      const key = prop.key as Record<string, unknown> | undefined
      let keyName: string | null = null
      if (key?.type === "Identifier") keyName = String(key.name ?? "")
      else if (key?.type === "StringLiteral") keyName = String(key.value ?? "")
      if (!keyName) continue
      // CSS-variable bridge — `style={{ "--x": token }}` hands a token *into*
      // the cascade rather than styling around it. Explicitly allowed.
      if (keyName.startsWith("--")) continue
      declared.push(keyName)
    }

    if (declared.length === 0) return

    const loc = node.loc as Record<string, Record<string, number>> | undefined
    found.push(finding(
      filePath, loc?.start?.line ?? 1,
      "inline-style-object",
      "warn",
      `Inline style object declares ${declared.map(d => `"${d}"`).join(", ")}. Inline styles introduce styling outside the kit — untokenized, unthemeable, and invisible to the design system.`,
      "Move these declarations into the component's CSS Module and reference tokens, or pass a CSS-variable bridge: style={{ \"--my-token\": value }}."
    ))
  })

  return found
}

/**
 * warn: kit-element-redeclared
 *
 * A surface that declares its own `Card`, `StatCard` or `AdminShell` has rebuilt
 * a kit element instead of composing the kit's. Nothing detected this before:
 * `native-map.ts` covers lowercase HTML tags only and the JSX scanner returns on
 * any uppercase tag.
 *
 * Kit membership resolves against `taxonomy.json` (D7) — read as data, never a
 * re-typed list here. With no taxonomy resolved the rule does not run and the
 * scan reports `kit-taxonomy-missing` instead of a green (fail closed).
 */
function ruleKitElementRedeclared(source: string, filePath: string): DesignFinding[] {
  const kit = activeKit
  if (!kit) return []
  if (!CODE_EXTS.has(extname(filePath))) return []
  // The kit's own copy-and-own source files legitimately declare kit elements.
  if (isOwnedKitSource(filePath, kit)) return []

  const ast = parseJsx(source)
  if (!ast) return []

  const program = (ast as Record<string, unknown>).program as Record<string, unknown> | undefined
  const body = (program?.body as unknown[]) ?? []

  const found: DesignFinding[] = []

  for (const raw of body) {
    for (const decl of moduleScopeDeclarations(raw)) {
      if (!kit.identifiers.has(decl.name)) continue
      found.push(finding(
        filePath, decl.line,
        "kit-element-redeclared",
        "warn",
        `Local re-declaration of the kit element "${decl.name}". This surface builds its own copy of a kit element instead of composing the kit's — the styling it introduces is outside the kit by construction.`,
        `Compose the kit element instead (\`npx visor add ${identifierToSlug(decl.name)}\`), or rename this local component so it does not shadow a kit element.`
      ))
    }
  }

  return found
}

interface LocalDeclaration {
  name: string
  line: number
}

/** Module-scope component-shaped declarations, unwrapping `export`. */
function moduleScopeDeclarations(raw: unknown): LocalDeclaration[] {
  let node = raw as Record<string, unknown> | undefined
  if (!node) return []
  if (node.type === "ExportNamedDeclaration" || node.type === "ExportDefaultDeclaration") {
    node = node.declaration as Record<string, unknown> | undefined
    if (!node) return []
  }

  const line = ((node.loc as Record<string, Record<string, number>> | undefined)?.start?.line) ?? 1

  if (node.type === "FunctionDeclaration" || node.type === "ClassDeclaration") {
    const id = node.id as Record<string, unknown> | undefined
    const name = id?.name
    return typeof name === "string" ? [{ name, line }] : []
  }

  if (node.type === "VariableDeclaration") {
    const out: LocalDeclaration[] = []
    for (const d of (node.declarations as unknown[]) ?? []) {
      const declarator = d as Record<string, unknown>
      const id = declarator.id as Record<string, unknown> | undefined
      if (id?.type !== "Identifier" || typeof id.name !== "string") continue
      // Only component-shaped initialisers: a function, an arrow, or a wrapper
      // call such as forwardRef/memo/styled. `const Card = "card"` is not a
      // re-declaration of the element.
      const init = declarator.init as Record<string, unknown> | undefined
      const initType = init?.type
      if (
        initType !== "ArrowFunctionExpression" &&
        initType !== "FunctionExpression" &&
        initType !== "CallExpression"
      ) continue
      const dLine = ((declarator.loc as Record<string, Record<string, number>> | undefined)?.start?.line) ?? line
      out.push({ name: id.name, line: dLine })
    }
    return out
  }

  return []
}

/** Reverse of `slugToIdentifier`, for the fix hint. `StatCard` → `stat-card`. */
function identifierToSlug(identifier: string): string {
  return identifier.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()
}

/**
 * True when this file *is* the project's owned copy of a kit element — what
 * `npx visor add card` writes to `components/ui/card/card.tsx`. Flagging those
 * would fail the kit's own source on every adopting project.
 */
function isOwnedKitSource(filePath: string, kit: KitTaxonomy): boolean {
  const base = basename(filePath)
    .replace(/\.(tsx|ts|jsx|js)$/, "")
    .replace(/\.module$/, "")
  if (kit.slugs.has(base)) return true
  return kit.slugs.has(basename(dirname(filePath)))
}

/**
 * error: missing-dark-mode-block
 * CSS files must contain a @media (prefers-color-scheme: dark) or [data-theme="dark"] block.
 * Borealis rule: dark + light from the start, no exceptions.
 */
function ruleMissingDarkModeBlock(source: string, filePath: string): DesignFinding[] {
  const ext = extname(filePath)
  if (!STYLE_EXTS.has(ext)) return []
  // Skip trivial/empty files
  if (source.trim().length < 20) return []

  const hasDarkMediaQuery = /@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)/.test(source)
  const hasDarkAttribute = /\[data-theme\s*=\s*["']?dark["']?\]/.test(source)
  const hasDarkClass = /\.dark\b/.test(source)

  if (!hasDarkMediaQuery && !hasDarkAttribute && !hasDarkClass) {
    return [finding(
      filePath, 1,
      "missing-dark-mode-block",
      "error",
      "CSS file has no dark mode block. Borealis requires dark + light support from day one.",
      "Add @media (prefers-color-scheme: dark) { ... } or [data-theme=\"dark\"] { ... } with dark-mode token overrides."
    )]
  }
  return []
}

/**
 * error: missing-hover-transition
 * CSS files with :hover selectors must include a transition property somewhere in the file.
 */
function ruleMissingHoverTransition(source: string, filePath: string): DesignFinding[] {
  const ext = extname(filePath)
  if (!STYLE_EXTS.has(ext)) return []

  const hasHover = /:hover/.test(source)
  if (!hasHover) return []

  // Look for transition in the same file
  const hasTransition = /\btransition\b/.test(source)
  if (!hasTransition) {
    const hoverLine = source.split("\n").findIndex(l => /:hover/.test(l))
    return [finding(
      filePath, hoverLine + 1,
      "missing-hover-transition",
      "error",
      ":hover selector found but no transition property in this file. Borealis requires CSS transitions for hover states.",
      "Add a transition property to the element's base styles, e.g. transition: color 150ms ease, background 150ms ease."
    )]
  }
  return []
}

/**
 * error: div-as-input
 * Catches <div> elements with onClick but no role="button" or type attribute —
 * the classic div-pretending-to-be-an-interactive-element anti-pattern.
 */
function ruleDivAsInput(source: string, filePath: string): DesignFinding[] {
  const ext = extname(filePath)
  if (!CODE_EXTS.has(ext)) return []

  const found: DesignFinding[] = []
  const src = lines(source)

  for (let i = 0; i < src.length; i++) {
    const l = src[i]
    // div with onClick but no role/type/aria-role
    if (/<div\b[^>]*onClick/.test(l) && !/role=|type=/.test(l)) {
      found.push(finding(
        filePath, i + 1,
        "div-as-input",
        "error",
        "<div onClick> used without role= — this is a div masquerading as an interactive element.",
        "Use a <button> element or add role=\"button\" and tabIndex={0} with keyboard handlers."
      ))
    }
    // div with onChange
    if (/<div\b[^>]*onChange/.test(l)) {
      found.push(finding(
        filePath, i + 1,
        "div-as-input",
        "error",
        "<div onChange> detected. Real form elements only — no div-as-input.",
        "Use <input>, <select>, or <textarea> with appropriate Visor wrapper components."
      ))
    }
  }
  return found
}

/**
 * error: setstate-hover
 * Catches useState-driven hover state management — use CSS :hover instead.
 */
function ruleSetStateHover(source: string, filePath: string): DesignFinding[] {
  const ext = extname(filePath)
  if (!CODE_EXTS.has(ext)) return []

  const found: DesignFinding[] = []
  const src = lines(source)

  for (let i = 0; i < src.length; i++) {
    const l = src[i]
    // onMouseEnter/onMouseLeave with a setState call
    if (/onMouseEnter|onMouseLeave/.test(l) && /set[A-Z]/.test(l)) {
      found.push(finding(
        filePath, i + 1,
        "setstate-hover",
        "error",
        "onMouseEnter/onMouseLeave used to manage hover state via setState. Use CSS :hover instead.",
        "Remove the mouse event handlers and hover state variable. Apply hover styles via CSS :hover."
      ))
    }
    // Common pattern: const [isHovered, setIsHovered] = useState(false)
    if (/\buse[Ss]tate\b/.test(l) && /[Hh]overed|hover[Ss]tate|isHover/.test(l)) {
      found.push(finding(
        filePath, i + 1,
        "setstate-hover",
        "error",
        "useState used to track hover state. CSS :hover is zero-cost and more correct.",
        "Delete this state variable and replace with CSS :hover selector."
      ))
    }
  }
  return found
}

/**
 * error: missing-aria-pressed
 * Toggle buttons (buttons that control open/closed/active state via className or state)
 * must have aria-pressed.
 */
function ruleMissingAriaPressed(source: string, filePath: string): DesignFinding[] {
  const ext = extname(filePath)
  if (!CODE_EXTS.has(ext)) return []

  const found: DesignFinding[] = []
  const src = lines(source)

  for (let i = 0; i < src.length; i++) {
    const l = src[i]
    // <button> with isActive/isOpen/isSelected/isToggled prop but no aria-pressed
    if (/<button\b[^>]*(isActive|isOpen|isSelected|isToggled|active=|selected=|toggled=)/.test(l) && !/aria-pressed/.test(l)) {
      found.push(finding(
        filePath, i + 1,
        "missing-aria-pressed",
        "error",
        "Toggle button appears to be missing aria-pressed. Toggleable buttons must expose their state to assistive technology.",
        "Add aria-pressed={isActive} (or equivalent) to the button element."
      ))
    }
  }
  return found
}

// ─── Warn rules ───────────────────────────────────────────────────────────────

/**
 * warn: banned-fonts
 * Inter, Roboto, Arial, system-ui are not Borealis fonts.
 */
const BANNED_FONT_LIST = ["Inter", "Roboto", "Arial", "system-ui", "'Arial'", '"Arial"', "'Roboto'", '"Roboto"', "'Inter'", '"Inter"']

function ruleBannedFonts(source: string, filePath: string): DesignFinding[] {
  const found: DesignFinding[] = []
  const src = lines(source)
  for (let i = 0; i < src.length; i++) {
    const l = src[i]
    if (l.trim().startsWith("//") || l.trim().startsWith("*")) continue
    for (const font of BANNED_FONT_LIST) {
      if (l.includes(font)) {
        found.push(finding(
          filePath, i + 1,
          "banned-fonts",
          "warn",
          `Banned font "${font}" detected. Borealis projects use Satoshi (or the project's designated typeface).`,
          "Remove this font reference and use the Borealis font stack via var(--font-sans)."
        ))
        break
      }
    }
  }
  return found
}

/**
 * warn: purple-gradient-on-white
 * Purple-to-white or purple-to-light gradients are a common generic SaaS look.
 */
function rulePurpleGradientOnWhite(source: string, filePath: string): DesignFinding[] {
  const found: DesignFinding[] = []
  const src = lines(source)
  const PURPLE_RE = /gradient.*?(?:purple|violet|#[89abcde][0-9a-f]|#[6-9][0-9a-f]{5})/i
  for (let i = 0; i < src.length; i++) {
    const l = src[i]
    if (PURPLE_RE.test(l)) {
      found.push(finding(
        filePath, i + 1,
        "purple-gradient-on-white",
        "warn",
        "Purple gradient detected — this is a generic SaaS visual cliche.",
        "Replace with a gradient using your project's actual brand tokens."
      ))
    }
  }
  return found
}

/**
 * warn: pure-black-untinted
 * #000000 / rgb(0,0,0) / black keyword without opacity — use near-black tinted tokens.
 */
function rulePureBlackUntinted(source: string, filePath: string): DesignFinding[] {
  const found: DesignFinding[] = []
  const src = lines(source)
  for (let i = 0; i < src.length; i++) {
    const l = src[i]
    if (l.trim().startsWith("//") || l.trim().startsWith("*")) continue
    if (/#000000\b|#000\b|rgb\(\s*0\s*,\s*0\s*,\s*0\s*\)/.test(l) ||
        /:\s*black\b/.test(l) ||
        /color:\s*["']?black["']?/.test(l)) {
      found.push(finding(
        filePath, i + 1,
        "pure-black-untinted",
        "warn",
        "Pure black (#000) detected. Use a near-black tinted token for softer, more intentional contrast.",
        "Replace with var(--color-text-primary) or the project's near-black token."
      ))
    }
  }
  return found
}

/**
 * warn: bounce-easing
 * cubic-bezier bounce effects are almost always inappropriate for UI transitions.
 */
function ruleBounceEasing(source: string, filePath: string): DesignFinding[] {
  const found: DesignFinding[] = []
  const src = lines(source)
  // Bounce: overshoot in cubic-bezier (values > 1 or < 0 for y1/y2)
  const BOUNCE_RE = /cubic-bezier\s*\([^)]*(?:1\.[1-9]|[-]0\.\d+)[^)]*\)/
  const KEYWORD_RE = /\bease-in-back\b|\bease-out-back\b|\bease-in-out-back\b|\bbounce\b/
  for (let i = 0; i < src.length; i++) {
    const l = src[i]
    if (BOUNCE_RE.test(l) || KEYWORD_RE.test(l)) {
      found.push(finding(
        filePath, i + 1,
        "bounce-easing",
        "warn",
        "Bounce/overshoot easing detected. Bouncy transitions feel playful/cheap in most UI contexts.",
        "Use ease, ease-out, or a subtle cubic-bezier like cubic-bezier(0.4, 0, 0.2, 1)."
      ))
    }
  }
  return found
}

/**
 * warn: sub-44px-touch-target
 * Interactive elements should be at least 44x44px for accessibility.
 * Tracks the most recent CSS selector line so size properties can be correlated
 * with interactive-element selectors even when on separate lines.
 */
function ruleSub44pxTouchTarget(source: string, filePath: string): DesignFinding[] {
  const found: DesignFinding[] = []
  const src = lines(source)
  const SMALL_RE = /(?:width|height|min-width|min-height)\s*:\s*(?:[1-9]|[1-3][0-9]|4[0-3])px\b/
  const INTERACTIVE_SELECTOR_RE = /button|btn|icon|touch|tap/i
  // Track the selector that opened the current CSS block
  let currentSelector = ""
  for (let i = 0; i < src.length; i++) {
    const l = src[i]
    if (l.trim().startsWith("//") || l.trim().startsWith("*")) continue
    // Update current selector when we see a line ending in { (CSS block open)
    if (/\{/.test(l) && !l.trim().startsWith("@")) {
      currentSelector = l
    }
    // Check both the current line AND the remembered selector for interactive context
    const interactiveContext = INTERACTIVE_SELECTOR_RE.test(l) || INTERACTIVE_SELECTOR_RE.test(currentSelector)
    if (SMALL_RE.test(l) && interactiveContext) {
      found.push(finding(
        filePath, i + 1,
        "sub-44px-touch-target",
        "warn",
        "Potential sub-44px touch target detected on an interactive element.",
        "Ensure all interactive elements have a minimum 44x44px touch target (WCAG 2.5.5)."
      ))
    }
  }
  return found
}

/**
 * warn: line-length-over-75ch
 * Text containers wider than 75ch reduce readability.
 */
function ruleLineLengthOver75ch(source: string, filePath: string): DesignFinding[] {
  const found: DesignFinding[] = []
  const src = lines(source)
  const CH_RE = /max-width\s*:\s*(\d+)ch/
  for (let i = 0; i < src.length; i++) {
    const l = src[i]
    const m = CH_RE.exec(l)
    if (m && parseInt(m[1], 10) > 75) {
      found.push(finding(
        filePath, i + 1,
        "line-length-over-75ch",
        "warn",
        `Text container max-width of ${m[1]}ch exceeds the 75ch readability limit.`,
        "Cap text container max-width at 65-75ch for optimal reading comfort."
      ))
    }
  }
  return found
}

/**
 * warn: gradient-text
 * CSS text gradients (background-clip: text + transparent color) are visually noisy
 * and often illegible at small sizes.
 */
function ruleGradientText(source: string, filePath: string): DesignFinding[] {
  const found: DesignFinding[] = []
  const src = lines(source)
  for (let i = 0; i < src.length; i++) {
    const l = src[i]
    if (/background-clip\s*:\s*text/.test(l) && /(?:transparent|-webkit-text-fill-color)/.test(source)) {
      found.push(finding(
        filePath, i + 1,
        "gradient-text",
        "warn",
        "Gradient text (background-clip: text) detected. Often illegible at small sizes.",
        "Use a solid semantic text color token. Reserve gradient text for display/hero headings only."
      ))
    }
    if (/-webkit-text-fill-color\s*:\s*transparent/.test(l) && /gradient/.test(source)) {
      found.push(finding(
        filePath, i + 1,
        "gradient-text",
        "warn",
        "Gradient text via -webkit-text-fill-color: transparent detected.",
        "Use a solid semantic text color token. Reserve gradient text for display/hero headings only."
      ))
    }
  }
  // Deduplicate by line
  const seen = new Set<number>()
  return found.filter(f => {
    if (seen.has(f.line)) return false
    seen.add(f.line)
    return true
  })
}

/**
 * warn: excessive-card-nesting
 * Cards nested 3+ levels deep create visual noise and unclear information hierarchy.
 */
function ruleExcessiveCardNesting(source: string, filePath: string): DesignFinding[] {
  const ext = extname(filePath)
  if (!CODE_EXTS.has(ext)) return []

  const found: DesignFinding[] = []
  const src = lines(source)

  let depth = 0
  const CARD_OPEN_RE = /<(?:Card|Panel|Box|Surface|Tile|Widget)\b/
  const CARD_CLOSE_RE = /<\/(?:Card|Panel|Box|Surface|Tile|Widget)>/

  for (let i = 0; i < src.length; i++) {
    const l = src[i]
    if (CARD_OPEN_RE.test(l)) {
      depth++
      if (depth >= 3) {
        found.push(finding(
          filePath, i + 1,
          "excessive-card-nesting",
          "warn",
          `Card/Panel nested ${depth} levels deep. Deep nesting creates visual noise and unclear hierarchy.`,
          "Flatten the layout. Use spacing, dividers, or type scale to create hierarchy instead of nested containers."
        ))
      }
    }
    if (CARD_CLOSE_RE.test(l)) depth = Math.max(0, depth - 1)
  }
  return found
}

/**
 * warn: missing-visor-base-layer  (VI-616)
 *
 * Visor components assume an element baseline exists: they no longer carry
 * per-component `font-family: inherit` patches, because those are copy-and-own
 * and therefore can never propagate. The baseline ships instead as
 * `@loworbitstudio/visor-core/reset` — npm being the only auto-propagating
 * channel Visor has.
 *
 * This rule fires on BOTH failure modes (D10):
 *   1. the app renders Visor controls but imports neither the reset nor
 *      Tailwind preflight; and
 *   2. visor-core is installed but predates the `/reset` export.
 *
 * Case 2 is a plain file-existence test against the *installed* package —
 * `node_modules/@loworbitstudio/visor-core/dist/reset.css` — deliberately not
 * a version comparison. There is no semver dependency in the CLI and no
 * version constant to compare against; asking "does the installed package
 * expose the file" is exact and cannot drift.
 */
const NATIVE_CONTROL_COMPONENTS = new Set<string>([
  ...Object.values(NATIVE_TO_VISOR).map((m) => m.visorName),
  ...Object.values(INPUT_TYPE_MAP).map((m) => m.visorName),
])

const RESET_IMPORT_RE = /@loworbitstudio\/visor-core\/reset/
const PREFLIGHT_RE = /@tailwind\s+base|@import\s+["']tailwindcss["']/

interface BaseLayerState {
  hasReset: boolean
  hasPreflight: boolean
  visorCoreInstalled: boolean
  visorCoreExportsReset: boolean
}

const baseLayerStateCache = new Map<string, BaseLayerState>()
const baseLayerReported = new Set<string>()

/** Reset per-scan memoisation so repeated `scanDesign` calls stay independent. */
export function resetBaseLayerCache(): void {
  baseLayerStateCache.clear()
  baseLayerReported.clear()
}

/** Nearest ancestor directory containing a package.json. */
function findProjectRoot(filePath: string): string | null {
  let dir = dirname(resolve(filePath))
  for (;;) {
    if (existsSync(join(dir, "package.json"))) return dir
    const parent = dirname(dir)
    if (parent === dir) return null
    dir = parent
  }
}

function collectStylesheets(root: string): string[] {
  const out: string[] = []
  function recurse(dir: string, depth: number) {
    if (depth > 6) return
    let entries: string[]
    try {
      entries = readdirSync(dir)
    } catch {
      return
    }
    for (const entry of entries) {
      if (entry === "node_modules" || entry === "dist" || entry.startsWith(".")) continue
      const full = join(dir, entry)
      let s
      try {
        s = statSync(full)
      } catch {
        continue
      }
      if (s.isDirectory()) recurse(full, depth + 1)
      else if (extname(full) === ".css") out.push(full)
    }
  }
  recurse(root, 0)
  return out
}

function baseLayerState(root: string): BaseLayerState {
  const cached = baseLayerStateCache.get(root)
  if (cached) return cached

  let hasReset = false
  let hasPreflight = false
  for (const sheet of collectStylesheets(root)) {
    let css: string
    try {
      css = readFileSync(sheet, "utf-8")
    } catch {
      continue
    }
    if (RESET_IMPORT_RE.test(css)) hasReset = true
    if (PREFLIGHT_RE.test(css)) hasPreflight = true
    if (hasReset && hasPreflight) break
  }

  const corePath = join(root, "node_modules", "@loworbitstudio", "visor-core")
  const state: BaseLayerState = {
    hasReset,
    hasPreflight,
    visorCoreInstalled: existsSync(corePath),
    visorCoreExportsReset: existsSync(join(corePath, "dist", "reset.css")),
  }
  baseLayerStateCache.set(root, state)
  return state
}

function ruleMissingVisorBaseLayer(source: string, filePath: string): DesignFinding[] {
  if (!CODE_EXTS.has(extname(filePath))) return []

  // Does this file render a Visor component that stands in for a native
  // control? Target set derives from native-map, so adding an entry there
  // extends coverage without touching this rule.
  const src = lines(source)
  let usageLine = -1
  for (let i = 0; i < src.length; i++) {
    const spec = src[i].match(/from\s+["'][^"']*components\/ui\/([a-z0-9-]+)["']/)
    if (spec && NATIVE_CONTROL_COMPONENTS.has(spec[1])) {
      usageLine = i + 1
      break
    }
  }
  if (usageLine === -1) return []

  const root = findProjectRoot(filePath)
  if (!root || baseLayerReported.has(root)) return []

  const state = baseLayerState(root)

  if (state.visorCoreInstalled && !state.visorCoreExportsReset) {
    baseLayerReported.add(root)
    return [finding(
      filePath, usageLine,
      "missing-visor-base-layer",
      "warn",
      "The installed @loworbitstudio/visor-core predates the /reset export, so Visor's element baseline is unavailable. Form controls will render in the browser's default font rather than your theme font.",
      'Run `npm update @loworbitstudio/visor-core`, then add `@import "@loworbitstudio/visor-core/reset";` to your global stylesheet.'
    )]
  }

  if (!state.hasReset && !state.hasPreflight) {
    baseLayerReported.add(root)
    return [finding(
      filePath, usageLine,
      "missing-visor-base-layer",
      "warn",
      "This project renders Visor form controls but imports neither @loworbitstudio/visor-core/reset nor Tailwind preflight. Without an element baseline, inputs, selects and buttons fall back to the UA font instead of inheriting your theme font.",
      'Add `@import "@loworbitstudio/visor-core/reset";` to your global stylesheet — or keep your existing reset/preflight and disable this rule in .visorrc.json.'
    )]
  }

  return []
}

// ─── Rule registry ────────────────────────────────────────────────────────────

export interface RuleDefinition {
  name: string
  severity: Severity
  fn: RuleFn
}

export const RULES: RuleDefinition[] = [
  // Errors — Borealis non-negotiables
  { name: "tier-1-token-direct-usage", severity: "error", fn: ruleTier1TokenDirectUsage },
  { name: "hardcoded-hex", severity: "error", fn: ruleHardcodedHex },
  { name: "hardcoded-px", severity: "error", fn: ruleHardcodedPx },
  { name: "missing-dark-mode-block", severity: "error", fn: ruleMissingDarkModeBlock },
  { name: "missing-hover-transition", severity: "error", fn: ruleMissingHoverTransition },
  { name: "div-as-input", severity: "error", fn: ruleDivAsInput },
  { name: "setstate-hover", severity: "error", fn: ruleSetStateHover },
  { name: "missing-aria-pressed", severity: "error", fn: ruleMissingAriaPressed },
  // Warns — general anti-patterns
  { name: "banned-fonts", severity: "warn", fn: ruleBannedFonts },
  { name: "purple-gradient-on-white", severity: "warn", fn: rulePurpleGradientOnWhite },
  { name: "pure-black-untinted", severity: "warn", fn: rulePureBlackUntinted },
  { name: "bounce-easing", severity: "warn", fn: ruleBounceEasing },
  { name: "sub-44px-touch-target", severity: "warn", fn: ruleSub44pxTouchTarget },
  { name: "line-length-over-75ch", severity: "warn", fn: ruleLineLengthOver75ch },
  { name: "gradient-text", severity: "warn", fn: ruleGradientText },
  { name: "excessive-card-nesting", severity: "warn", fn: ruleExcessiveCardNesting },
  { name: "missing-visor-base-layer", severity: "warn", fn: ruleMissingVisorBaseLayer },
  // Composition (VI-631) — warning-only by default (D3) so the camelCase fix and
  // the two new assertions can be adopted without escalating an existing
  // project's exit code on first run.
  { name: "inline-style-object", severity: "warn", fn: ruleInlineStyleObject },
  { name: "kit-element-redeclared", severity: "warn", fn: ruleKitElementRedeclared },
]

// ─── Main scan function ───────────────────────────────────────────────────────

export interface DesignCheckOptions {
  disabledRules?: string[]
  errorsOnly?: boolean
  /** Explicit `taxonomy.json` path — `--taxonomy <path>` (VI-631 D7). */
  taxonomyPath?: string
  /** `taxonomy` key read from the scanned directory's `.visorrc.json`. */
  visorrcTaxonomyPath?: string
  /**
   * Force the kit-membership assertion on. Without it the assertion engages
   * only when a taxonomy is configured or discovered; with it, an unresolvable
   * taxonomy fails closed rather than reporting an unasserted green.
   */
  composition?: boolean
  /** Injected for tests; defaults to `process.env`. */
  env?: Record<string, string | undefined>
}

/**
 * The words the tool uses about its own scope (D2). Shared by `check design`
 * and `check diff` so both checkers make exactly the same claim, and neither
 * can be read as a claim about arrangement.
 */
export const COMPOSITION_SCOPE = {
  scope: "composition-only",
  asserts: "this surface introduced no styling outside the kit",
  doesNotAssert: [
    "arrangement (right elements, wrong order)",
    "content (wrong icon, dropped hint)",
    "data / reachability",
  ],
  limit:
    "Green means this surface introduced no styling outside the kit. It does NOT mean the surface is on-design. Arrangement (right elements, wrong order), content (wrong icon, dropped hint), and data/reachability are not checked here and still need a human.",
} as const

export function scanDesign(
  pathArg: string,
  options: DesignCheckOptions = {}
): DesignCheckResult {
  const files = collectFiles(pathArg)
  const { disabledRules = [], errorsOnly = false } = options

  // VI-616: project-level state is memoised across files within one scan.
  resetBaseLayerCache()

  // VI-631 D7: kit membership resolves against taxonomy.json, read as data.
  const resolution = resolveTaxonomy({
    explicitPath: options.taxonomyPath,
    visorrcPath: options.visorrcTaxonomyPath,
    scanPath: pathArg,
    env: options.env,
  })
  // The assertion engages when a taxonomy was asked for, one was found, or the
  // caller demanded it. Otherwise the report says "not asserted" out loud
  // rather than counting an unchecked surface as green.
  const engaged =
    options.composition === true || resolution.requested || resolution.path !== null
  activeKit = resolution.taxonomy

  // Determine active rules
  const activeRules = RULES.filter(r => {
    if (disabledRules.includes(r.name)) return false
    if (errorsOnly && r.severity !== "error") return false
    return true
  })

  const errors: DesignFinding[] = []
  const warnings: DesignFinding[] = []

  try {
    for (const file of files) {
      let source: string
      try {
        source = readFileSync(file, "utf-8")
      } catch {
        continue
      }

      for (const rule of activeRules) {
        const ruleFindings = rule.fn(source, file)
        for (const f of ruleFindings) {
          // A rule may emit mixed severities (hardcoded-px does, per D5), so
          // --errors-only filters findings as well as rules.
          if (errorsOnly && f.severity !== "error") continue
          if (f.severity === "error") errors.push(f)
          else warnings.push(f)
        }
      }
    }
  } finally {
    activeKit = null
  }

  // Fail closed (D7): a requested-but-unresolvable kit definition is an error,
  // not a silent pass. A green that skipped the assertion is a false green.
  if (engaged && !resolution.taxonomy && !disabledRules.includes("kit-taxonomy-missing")) {
    errors.push(finding(
      resolve(pathArg), 1,
      "kit-taxonomy-missing",
      "error",
      resolution.error
        ?? "Kit membership could not be asserted: no taxonomy.json resolved. The composition lint fails closed rather than reporting a green it did not earn.",
      "Point the lint at the kit definition: --taxonomy <path/to/taxonomy.json>, the VISOR_TAXONOMY environment variable, or a \"taxonomy\" key in .visorrc.json."
    ))
  }

  return {
    errors,
    warnings,
    summary: {
      errorCount: errors.length,
      warningCount: warnings.length,
      filesScanned: files.length,
    },
    composition: {
      scope: COMPOSITION_SCOPE.scope,
      asserts: COMPOSITION_SCOPE.asserts,
      doesNotAssert: [...COMPOSITION_SCOPE.doesNotAssert],
      limit: COMPOSITION_SCOPE.limit,
      kitMembership: {
        asserted: resolution.taxonomy !== null,
        taxonomyPath: resolution.path,
        source: resolution.source,
        elementCount: resolution.taxonomy?.slugs.size ?? 0,
        reason: resolution.taxonomy
          ? `resolved from ${resolution.source} (${resolution.taxonomy.slugs.size} kit elements)`
          : resolution.error
            ?? "no taxonomy.json resolved; pass --taxonomy <path> to assert kit membership",
      },
    },
  }
}

/** The composition-only limit as human output lines (D2). */
export function compositionScopeNotice(): string[] {
  return [
    "Composition scope — this check asserts one thing:",
    `  ${COMPOSITION_SCOPE.asserts}.`,
    "It does NOT assert the surface is on-design. Uncovered residue:",
    ...COMPOSITION_SCOPE.doesNotAssert.map(r => `  · ${r}`),
  ]
}
