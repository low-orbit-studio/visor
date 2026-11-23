/**
 * Nested-corner scan (VI-838): finds every rounded box drawn inside another
 * rounded box and checks the pair is concentric, inner = outer - gap.
 *
 * Runs inside the page. Pass it straight to Playwright, which serializes the
 * function, so it must not reference anything outside its own body:
 *
 *   const pairs = await page.evaluate(scanConcentric, { root: "main" })
 *   expect(pairs.filter((p) => !p.ok)).toEqual([])
 *
 * It walks open shadow roots, so hand-built web components are covered. For
 * iframes, run it in each frame (`page.frames()`).
 *
 * A pair counts when the inner box draws something (fill, border, shadow or
 * backdrop), its nearest painted ancestor rounds that corner, and the inner
 * corner sits inside the outer curve on both axes (inset below the outer
 * radius and at most `maxGap`). It passes when inner = outer - inset, the
 * horizontal and vertical insets match (or the curves cannot run parallel),
 * and both corners carry the same `corner-shape` where the browser has it.
 * Radii are the drawn ones (clamped to half the box), so pill in pill reads
 * right. A corner flush with the padding edge of a rounded ancestor that
 * clips is skipped: the clip draws it. Where the browser has no
 * `corner-shape`, a box drawing the squircle fallback (VI-839) counts as its
 * squircle: its `--squircle-r` radius and a squircle corner.
 */

export type Corner = "top-left" | "top-right" | "bottom-right" | "bottom-left"

export interface ConcentricScanOptions {
  /** Scan under every element this selector matches; pairs stay inside it. Default: the whole document. */
  root?: string
  /** Largest inset, in px, that still counts as nested. Default 16. */
  maxGap?: number
  /** Allowed radius error in px. Default 0.5. */
  tolerance?: number
  /**
   * Selectors never treated as the inner box. Default skips icons, media,
   * avatars, badges, checkboxes and spinners, which are round by design.
   */
  skip?: string[]
  /**
   * Tag the boxes of each failing pair (`data-concentric-outer` and
   * `data-concentric-inner`), so a test can screenshot them.
   */
  mark?: boolean
}

export interface ConcentricPair {
  /** Short name of the outer box: tag plus data-slot or class. */
  outer: string
  /** Short name of the inner box. */
  inner: string
  /** `outer > inner`, the key an allowlist matches on. */
  key: string
  corner: Corner
  /** The smaller inset, which sets the expected radius. */
  gap: number
  /** Horizontal and vertical inset; they must match for the curves to run parallel. */
  gapX: number
  gapY: number
  outerRadius: number
  innerRadius: number
  expected: number
  outerShape: string
  innerShape: string
  ok: boolean
}

export function scanConcentric(options: ConcentricScanOptions = {}): ConcentricPair[] {
  const maxGap = options.maxGap ?? 16
  const tolerance = options.tolerance ?? 0.5
  const skip = (options.skip ?? [
    "svg", "svg *", "img", "picture", "video", "canvas",
    "input[type=checkbox]", "input[type=radio]", "[role=checkbox]", "[role=switch]",
    "[data-slot*=avatar]", "[data-slot*=badge]", "[data-slot*=checkbox]",
    "[class*=avatar]", "[class*=badge]", "[class*=checkbox]", "[class*=spinner]",
  ]).join(",")
  const corners: Corner[] = ["top-left", "top-right", "bottom-right", "bottom-left"]

  const alpha = (color: string): number => {
    if (!color || color === "transparent") return 0
    const m = color.match(/\/\s*([\d.]+%?)\s*\)$|rgba?\([^)]*,\s*([\d.]+)\s*\)$/)
    if (!m) return 1
    const v = m[1] ?? m[2]
    return v.endsWith("%") ? parseFloat(v) / 100 : parseFloat(v)
  }
  const paints = (s: CSSStyleDeclaration): boolean =>
    alpha(s.backgroundColor) > 0 ||
    s.backgroundImage !== "none" ||
    s.boxShadow !== "none" ||
    (s.backdropFilter && s.backdropFilter !== "none") ||
    ["Top", "Right", "Bottom", "Left"].some(
      (side) =>
        parseFloat(s.getPropertyValue(`border-${side.toLowerCase()}-width`)) > 0 &&
        s.getPropertyValue(`border-${side.toLowerCase()}-style`) !== "none" &&
        alpha(s.getPropertyValue(`border-${side.toLowerCase()}-color`)) > 0,
    )
  // Where the browser has no corner-shape, a box drawing the squircle fallback (VI-839)
  // carries its squircle's radius in --squircle-r and draws a smaller circle under the clip.
  const fallback = (s: CSSStyleDeclaration): number =>
    s.clipPath.startsWith("shape(") ? parseFloat(s.getPropertyValue("--squircle-r")) || 0 : 0
  const radius = (s: CSSStyleDeclaration, c: Corner, r: DOMRect): number => {
    const squircle = fallback(s)
    if (squircle > 0) return Math.min(squircle, r.width / 2, r.height / 2)
    const raw = s.getPropertyValue(`border-${c}-radius`).split(" ")[0] ?? "0"
    const v = raw.endsWith("%") ? (parseFloat(raw) / 100) * r.width : parseFloat(raw) || 0
    return Math.min(v, r.width / 2, r.height / 2)
  }
  // Fallback first: a forced fallback (VI-841) also reports the native corner it turned off.
  const shape = (s: CSSStyleDeclaration, c: Corner): string =>
    fallback(s) > 0 ? "squircle" : s.getPropertyValue(`corner-${c}-shape`) || "round"
  const visible = (s: CSSStyleDeclaration, r: DOMRect): boolean =>
    r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none" && parseFloat(s.opacity) > 0
  const clips = (s: CSSStyleDeclaration): boolean => s.overflow !== "visible" || s.clipPath !== "none"
  const parentOf = (el: Element): Element | null => {
    if (el.parentElement) return el.parentElement
    const root = el.getRootNode()
    return root instanceof ShadowRoot ? root.host : null
  }
  const name = (el: Element): string => {
    const slot = el.getAttribute("data-slot")
    if (slot) return `${el.tagName.toLowerCase()}[data-slot=${slot}]`
    const cls = Array.from(el.classList)
      .slice(0, 2)
      // CSS-module names: `card-module__h4sh__root` (Next) or `card_root__h4sh`.
      .map((c) => c.replace(/^(.+?)-module__[\w-]+?__(.+)$/, "$1.$2").replace(/^(.+)_(\w+)__[\w-]{5}$/, "$1.$2"))
    return el.tagName.toLowerCase() + cls.map((c) => `.${c}`).join("")
  }
  const all = (root: ParentNode): Element[] => {
    const out: Element[] = []
    for (const el of Array.from(root.querySelectorAll("*"))) {
      out.push(el)
      if (el.shadowRoot) out.push(...all(el.shadowRoot))
    }
    return out
  }

  const roots: Element[] = options.root ? Array.from(document.querySelectorAll(options.root)) : [document.documentElement]
  const pairs: ConcentricPair[] = []
  for (const root of roots) for (const el of all(root)) {
    if (el.matches(skip)) continue
    const s = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    if (!visible(s, r) || !paints(s)) continue
    for (const c of corners) {
      const inner = radius(s, c, r)
      // The nearest painted ancestor inside the root is the edge this corner sits against.
      let p = parentOf(el)
      let ps: CSSStyleDeclaration | null = null
      // Flush with the padding edge of a rounded box that clips, the clip draws the corner.
      let clipped = false
      while (p && p !== root) {
        ps = getComputedStyle(p)
        const pr = p.getBoundingClientRect()
        if (clips(ps) && radius(ps, c, pr) > 0) {
          const cg = Math.min(
            c.endsWith("left") ? r.left - pr.left : pr.right - r.right,
            c.startsWith("top") ? r.top - pr.top : pr.bottom - r.bottom,
          )
          const border = Math.max(
            parseFloat(ps.getPropertyValue(`border-${c.split("-")[0]}-width`)) || 0,
            parseFloat(ps.getPropertyValue(`border-${c.split("-")[1]}-width`)) || 0,
          )
          if (cg <= border + tolerance) clipped = true
        }
        if (paints(ps)) break
        p = parentOf(p)
      }
      if (clipped) continue
      if (!p || p === root || !ps) continue
      const pr = p.getBoundingClientRect()
      const outer = radius(ps, c, pr)
      if (outer === 0) continue
      const gx = c.endsWith("left") ? r.left - pr.left : pr.right - r.right
      const gy = c.startsWith("top") ? r.top - pr.top : pr.bottom - r.bottom
      if (gx < -tolerance || gy < -tolerance || gx > maxGap || gy > maxGap) continue
      const gap = Math.max(0, Math.min(gx, gy))
      // Outside the outer curve on either axis the corner sits under a straight edge: nothing to nest.
      if (Math.max(gx, gy) >= outer) continue
      const expected = Math.max(0, outer - gap)
      const outerShape = shape(ps, c)
      const innerShape = shape(s, c)
      // A curve only runs parallel when the inset is the same on both axes.
      const even = Math.abs(gx - gy) <= tolerance
      const ok = Math.abs(inner - expected) <= tolerance && even && (expected === 0 || outerShape === innerShape)
      if (!ok && options.mark) {
        p.setAttribute("data-concentric-outer", "")
        el.setAttribute("data-concentric-inner", c)
      }
      const o = name(p)
      const i = name(el)
      pairs.push({
        outer: o, inner: i, key: `${o} > ${i}`, corner: c,
        gap: Math.round(gap * 100) / 100,
        gapX: Math.round(gx * 100) / 100,
        gapY: Math.round(gy * 100) / 100,
        outerRadius: Math.round(outer * 100) / 100,
        innerRadius: Math.round(inner * 100) / 100,
        expected: Math.round(expected * 100) / 100,
        outerShape, innerShape, ok,
      })
    }
  }
  return pairs
}
