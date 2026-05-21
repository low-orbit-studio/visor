/**
 * Strip Phase 1.5 documentary chrome from prototype HTML.
 *
 * Phase 1.5 HTML prototypes use documentary chrome — state callouts, section
 * headers, proto-nav, mint-styled chips — to label states for the design
 * reviewer. When the HTML prototype is the sandbox baseline, those labels end
 * up in every captured PNG and trip the Phase 7 scaffold-drift check.
 *
 * This helper runs a minimal regex-based stripper over the HTML before it's
 * written to `public/prototype/`. Supports two selector shapes:
 *
 *   - `.foo`                — class selector. Matches an opening tag whose
 *                              `class="..."` attribute contains the token
 *                              `foo`, then removes the element through its
 *                              matching closing tag.
 *   - `[attr*="val"]`       — attribute-substring selector. Matches an opening
 *                              tag whose given attribute's value contains the
 *                              given substring.
 *   - `[attr]`              — attribute-presence selector. Matches an opening
 *                              tag that has the given attribute at all.
 *
 * Other selector shapes are ignored (no-op). The regex approach trades a bit
 * of correctness for keeping the visor runtime dep tree minimal — prototype
 * HTML is hand-authored and predictable.
 */

export const DEFAULT_STRIP_SELECTORS = [
  ".state-callout",
  ".state-section__header",
  ".proto-nav",
  "[data-documentary-chrome]",
  '[style*="mint"]',
]

type ParsedSelector =
  | { kind: "class"; name: string }
  | { kind: "attr-substring"; attr: string; value: string }
  | { kind: "attr-presence"; attr: string }
  | { kind: "unknown" }

const CLASS_SELECTOR = /^\.([a-zA-Z_][\w-]*)$/
const ATTR_SUBSTRING_SELECTOR = /^\[([a-zA-Z_][\w-]*)\*=(?:"([^"]*)"|'([^']*)')\]$/
const ATTR_PRESENCE_SELECTOR = /^\[([a-zA-Z_][\w-]*)\]$/

function parseSelector(selector: string): ParsedSelector {
  const trimmed = selector.trim()
  let m: RegExpMatchArray | null
  if ((m = trimmed.match(CLASS_SELECTOR))) {
    return { kind: "class", name: m[1] }
  }
  if ((m = trimmed.match(ATTR_SUBSTRING_SELECTOR))) {
    return { kind: "attr-substring", attr: m[1], value: m[2] ?? m[3] ?? "" }
  }
  if ((m = trimmed.match(ATTR_PRESENCE_SELECTOR))) {
    return { kind: "attr-presence", attr: m[1] }
  }
  return { kind: "unknown" }
}

const VOID_ELEMENTS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
])

/**
 * Find the index just past the closing `>` of the opening tag that starts at
 * `openTagStart`. Handles quoted attribute values that may contain `>`. Returns
 * -1 if the opening tag is malformed.
 */
function findOpenTagEnd(html: string, openTagStart: number): number {
  let i = openTagStart
  let quote: '"' | "'" | null = null
  while (i < html.length) {
    const ch = html[i]
    if (quote) {
      if (ch === quote) quote = null
    } else {
      if (ch === '"' || ch === "'") quote = ch as '"' | "'"
      else if (ch === ">") return i + 1
    }
    i++
  }
  return -1
}

/**
 * Find the index of the closing tag `</tagName>` that matches an opening tag
 * starting at `openTagStart`. Tracks nested `<tagName>` opens. Returns the
 * index of the `<` of the closing tag, or -1 if not found.
 */
function findMatchingCloseTag(
  html: string,
  tagName: string,
  searchFrom: number
): number {
  const openRe = new RegExp(`<${tagName}(?=[\\s/>])`, "gi")
  const closeRe = new RegExp(`</${tagName}\\s*>`, "gi")
  let depth = 1
  let pos = searchFrom
  while (pos < html.length) {
    openRe.lastIndex = pos
    closeRe.lastIndex = pos
    const openMatch = openRe.exec(html)
    const closeMatch = closeRe.exec(html)
    if (!closeMatch) return -1
    if (openMatch && openMatch.index < closeMatch.index) {
      depth++
      const past = findOpenTagEnd(html, openMatch.index)
      pos = past === -1 ? openMatch.index + tagName.length + 1 : past
      continue
    }
    depth--
    if (depth === 0) return closeMatch.index
    pos = closeMatch.index + closeMatch[0].length
  }
  return -1
}

/**
 * Predicate: does the opening tag string match the parsed selector?
 */
function openTagMatches(openTag: string, selector: ParsedSelector): boolean {
  if (selector.kind === "class") {
    const classAttr = /\sclass\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(openTag)
    if (!classAttr) return false
    const value = classAttr[1] ?? classAttr[2] ?? ""
    return value.split(/\s+/).some((token) => token === selector.name)
  }
  if (selector.kind === "attr-substring") {
    const attrRe = new RegExp(
      `\\s${escapeRegex(selector.attr)}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`,
      "i"
    )
    const m = openTag.match(attrRe)
    if (!m) return false
    const value = m[1] ?? m[2] ?? ""
    return value.includes(selector.value)
  }
  if (selector.kind === "attr-presence") {
    const attrRe = new RegExp(
      `\\s${escapeRegex(selector.attr)}(?:\\s*=|\\s|/?>)`,
      "i"
    )
    return attrRe.test(openTag)
  }
  return false
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

const TAG_NAME_RE = /^<([a-zA-Z][a-zA-Z0-9-]*)/

/**
 * Strip a single pass of the parsed selectors. Returns the new html and a
 * boolean indicating whether any change was made.
 */
function stripOnce(
  html: string,
  selectors: ParsedSelector[]
): { html: string; changed: boolean } {
  const tagRe = /<([a-zA-Z][a-zA-Z0-9-]*)\b/g
  let m: RegExpExecArray | null
  while ((m = tagRe.exec(html))) {
    const openTagStart = m.index
    const tagNameMatch = html.slice(openTagStart, openTagStart + 200).match(TAG_NAME_RE)
    if (!tagNameMatch) continue
    const tagName = tagNameMatch[1].toLowerCase()
    const openTagEnd = findOpenTagEnd(html, openTagStart)
    if (openTagEnd === -1) continue
    const openTag = html.slice(openTagStart, openTagEnd)
    const matched = selectors.some((sel) => openTagMatches(openTag, sel))
    if (!matched) continue

    let elementEnd: number
    if (VOID_ELEMENTS.has(tagName) || /\/\s*>$/.test(openTag)) {
      elementEnd = openTagEnd
    } else {
      const closeStart = findMatchingCloseTag(html, tagName, openTagEnd)
      if (closeStart === -1) continue
      const closeRe = new RegExp(`</${tagName}\\s*>`, "i")
      const closeMatch = html.slice(closeStart).match(closeRe)
      if (!closeMatch) continue
      elementEnd = closeStart + closeMatch[0].length
    }

    let cutEnd = elementEnd
    if (html[cutEnd] === "\n") cutEnd++

    let cutStart = openTagStart
    while (cutStart > 0 && (html[cutStart - 1] === " " || html[cutStart - 1] === "\t")) {
      cutStart--
    }
    if (
      cutStart > 0 &&
      html[cutStart - 1] === "\n" &&
      cutEnd <= html.length &&
      (html[cutEnd - 1] === "\n" || cutEnd === html.length)
    ) {
      cutStart--
    }

    return {
      html: html.slice(0, cutStart) + html.slice(cutEnd),
      changed: true,
    }
  }
  return { html, changed: false }
}

/**
 * Resolve the final selector list given the operator's flag choices.
 *
 *   - `stripChrome: false` (or absent) — no stripping unless `additional` set.
 *   - `stripChrome: true` — use the default selector list.
 *   - `stripChrome: "a,b"` — REPLACE defaults with the parsed comma list.
 *   - `additional: "c,d"` — MERGE the parsed comma list with the chosen base.
 *
 * Empty/whitespace-only items are dropped.
 */
export function resolveStripSelectors(
  stripChrome: boolean | string | undefined,
  additional?: string
): string[] {
  if (stripChrome === undefined || stripChrome === false) {
    if (additional && additional.trim() !== "") {
      return [...DEFAULT_STRIP_SELECTORS, ...parseList(additional)]
    }
    return []
  }
  const base =
    stripChrome === true || (typeof stripChrome === "string" && stripChrome.trim() === "")
      ? [...DEFAULT_STRIP_SELECTORS]
      : parseList(stripChrome)
  if (additional && additional.trim() !== "") {
    return [...base, ...parseList(additional)]
  }
  return base
}

function parseList(input: string): string[] {
  return input
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

/**
 * Strip elements matching `selectors` from `html`. Iterates until no further
 * matches are found. Returns the original string when `selectors` is empty.
 */
export function stripDocumentaryChrome(html: string, selectors: string[]): string {
  if (selectors.length === 0) return html
  const parsed = selectors.map(parseSelector).filter((s) => s.kind !== "unknown")
  if (parsed.length === 0) return html
  let current = html
  for (let i = 0; i < 1000; i++) {
    const { html: next, changed } = stripOnce(current, parsed)
    if (!changed) break
    current = next
  }
  return current
}
