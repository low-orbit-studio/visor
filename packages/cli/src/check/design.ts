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
 *     sub-44px-touch-target, line-length-over-75ch, gradient-text, excessive-card-nesting
 */

import { readFileSync, readdirSync, statSync, existsSync } from "fs"
import { resolve, extname, join, basename } from "path"

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

export interface DesignCheckResult {
  errors: DesignFinding[]
  warnings: DesignFinding[]
  summary: {
    errorCount: number
    warningCount: number
    filesScanned: number
  }
}

export interface RuleResult {
  findings: DesignFinding[]
}

export type RuleFn = (source: string, filePath: string) => DesignFinding[]

// ─── Visorrc helpers ──────────────────────────────────────────────────────────

export interface VisorRc {
  disabledRules?: string[]
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
 */
const PX_WHITELIST = new Set(["0px", "1px", "2px", "3px"])

function ruleHardcodedPx(source: string, filePath: string): DesignFinding[] {
  const found: DesignFinding[] = []
  // Match pixel values used in spacing/sizing contexts only
  const PX_RE = /\b(\d+(?:\.\d+)?)px\b/g
  const src = lines(source)
  for (let i = 0; i < src.length; i++) {
    const l = src[i]
    if (l.trim().startsWith("//") || l.trim().startsWith("*") || l.trim().startsWith("/*")) continue
    // Only flag spacing-related properties
    if (!/margin|padding|width|height|gap|top:|left:|right:|bottom:|font-size|line-height|min-width|max-width|min-height|max-height/.test(l)) continue
    let m: RegExpExecArray | null
    PX_RE.lastIndex = 0
    while ((m = PX_RE.exec(l)) !== null) {
      const full = m[0]
      if (PX_WHITELIST.has(full)) continue
      found.push(finding(
        filePath, i + 1,
        "hardcoded-px",
        "error",
        `Hardcoded pixel value "${full}" in spacing/sizing bypasses the Borealis spacing token system.`,
        "Replace with a semantic spacing token: var(--space-1), var(--space-2), var(--space-4), etc."
      ))
    }
  }
  return found
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
]

// ─── Main scan function ───────────────────────────────────────────────────────

export interface DesignCheckOptions {
  disabledRules?: string[]
  errorsOnly?: boolean
}

export function scanDesign(
  pathArg: string,
  options: DesignCheckOptions = {}
): DesignCheckResult {
  const files = collectFiles(pathArg)
  const { disabledRules = [], errorsOnly = false } = options

  // Determine active rules
  const activeRules = RULES.filter(r => {
    if (disabledRules.includes(r.name)) return false
    if (errorsOnly && r.severity !== "error") return false
    return true
  })

  const errors: DesignFinding[] = []
  const warnings: DesignFinding[] = []

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
        if (f.severity === "error") errors.push(f)
        else warnings.push(f)
      }
    }
  }

  return {
    errors,
    warnings,
    summary: {
      errorCount: errors.length,
      warningCount: warnings.length,
      filesScanned: files.length,
    },
  }
}
