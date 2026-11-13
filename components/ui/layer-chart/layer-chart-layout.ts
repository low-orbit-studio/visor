/*
 * The layer chart's geometry, kept apart from React so it can be tested alone.
 * Ported from the LO-343 Layers frames: partition, rowsFor, geom, foldThin.
 */

import type { CSSProperties, ReactNode } from "react"

export type LayerKind = "solid" | "covered" | "not-billable" | "unresolved"
export type LayerHue = number | "tide"
export type RowRole = "anc" | "focus" | "kids" | "gkids" | "ggkids"

export interface LayerNode {
  /** Unique across the whole tree. */
  id: string
  name: string
  /** A short reference drawn before the name ("LYD-140"). */
  ref?: string
  /** The layer this node belongs to ("Clients", "Packages"). Names its row in the gutter. */
  layer?: string
  /** The default measure. Leave it off a parent and the parent sums its children. */
  value?: number
  /** A Paper project-hue angle, or "tide" for the studio's own investment. Children inherit it. */
  hue?: LayerHue
  /** How the block is filled. Children inherit it. */
  kind?: LayerKind
  /** Today's block: drawn paler (it counts once the day is over). */
  today?: boolean
  /** The sub line under the big number. */
  sub?: ReactNode
  children?: LayerNode[]
}

export interface LaidNode {
  node: LayerNode
  id: string
  depth: number
  value: number
  hue?: LayerHue
  kind: LayerKind
  parent?: LaidNode
  children: LaidNode[]
  /** Position across the whole tree, 0 to 1. */
  x0: number
  x1: number
  /** Set on the "+n" block that stands in for folded children. */
  more?: LaidNode[]
}

export interface Row {
  d: number
  role: RowRole
  y: number
  h: number
  label: string
  band: boolean
  note: boolean
  noteY: number
}

export interface Geom {
  l: number
  w: number
  t: number
  h: number
  row: Row
}

/** Row heights from the frames, after the operator's first review (layers.md, "Layout"). */
export const ROW_HEIGHTS = {
  desk: { anc: 34, focus: 64, kids: 198, gkids: 96, ggkids: 40 },
  narrow: { anc: 28, focus: 40, kids: 108, gkids: 52, ggkids: 22 },
} as const

/** Under this canvas width the chart uses its narrow heights and drops the sub lines and slots one layer down. */
export const NARROW_WIDTH = 560
/** Ground between blocks in a row, and between rows. */
export const GAP_X = 3
export const GAP_Y = 4
/** Children thinner than this fold into one "+n" block. */
export const FOLD_UNDER = 6
/** The "+n" block stays at least this wide. */
export const MORE_MIN = 24
export const BAND_H = 18
const BAND_ROW = 22
const NOTE_ROW = 26

/** Lays the tree out across 0..1, each node's span shared by its children in proportion to the measure. */
export function layout(
  root: LayerNode,
  measure: (node: LayerNode) => number | undefined
): { root: LaidNode; byId: Map<string, LaidNode> } {
  const byId = new Map<string, LaidNode>()
  const build = (node: LayerNode, parent: LaidNode | undefined, depth: number): LaidNode => {
    const n: LaidNode = {
      node,
      id: node.id,
      depth,
      value: 0,
      hue: node.hue ?? parent?.hue,
      kind: node.kind ?? parent?.kind ?? "solid",
      parent,
      children: [],
      x0: 0,
      x1: 0,
    }
    byId.set(n.id, n)
    n.children = (node.children ?? []).map((c) => build(c, n, depth + 1))
    const own = measure(node)
    n.value = Math.max(0, own ?? n.children.reduce((a, c) => a + c.value, 0))
    return n
  }
  const r = build(root, undefined, 0)
  const partition = (n: LaidNode, x0: number, x1: number) => {
    n.x0 = x0
    n.x1 = x1
    const tot = n.children.reduce((a, c) => a + c.value, 0)
    let x = x0
    for (const c of n.children) {
      const w = tot ? ((x1 - x0) * c.value) / tot : 0
      partition(c, x, x + w)
      x += w
    }
  }
  partition(r, 0, 1)
  return { root: r, byId }
}

export const pathOf = (n: LaidNode): LaidNode[] => {
  const out: LaidNode[] = []
  for (let p: LaidNode | undefined = n; p; p = p.parent) out.unshift(p)
  return out
}

const maxDepth = (n: LaidNode): number =>
  n.children.length ? 1 + Math.max(...n.children.map(maxDepth)) : 0

export function atDepth(F: LaidNode, d: number): LaidNode[] {
  const out: LaidNode[] = []
  const walk = (n: LaidNode) => {
    if (n.depth === d) out.push(n)
    else n.children.forEach(walk)
  }
  walk(F)
  return out
}

/** The layer most of a row's (non-empty) blocks belong to. */
function majority(nodes: LaidNode[]): string {
  const c = new Map<string, number>()
  for (const n of nodes) if (n.value > 0 && n.node.layer) c.set(n.node.layer, (c.get(n.node.layer) ?? 0) + 1)
  return [...c.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? ""
}

/**
 * The rows for a focus: its ancestors as compressed path rows, the focus row,
 * then up to three layers below it. `hasBand(nodes)` says whether a row carries
 * the optional band; the first row below the focus without one carries the note.
 */
export function rowsFor(
  F: LaidNode,
  narrow: boolean,
  band?: (nodes: LaidNode[]) => boolean,
  note = false
): { rows: Row[]; height: number } {
  const H = narrow ? ROW_HEIGHTS.narrow : ROW_HEIGHTS.desk
  const path = pathOf(F)
  const last = F.depth + Math.min(3, maxDepth(F))
  const rows: Row[] = []
  let y = 0
  let noted = false
  for (let d = 0; d <= last; d++) {
    const role: RowRole =
      d < F.depth ? "anc" : d === F.depth ? "focus" : (["kids", "gkids", "ggkids"] as const)[d - F.depth - 1]
    const nodes = d <= F.depth ? [path[d]] : atDepth(F, d)
    const label = d <= F.depth ? (path[d].node.layer ?? "") : majority(nodes)
    const row: Row = { d, role, y, h: H[role], label, band: false, note: false, noteY: 0 }
    y += row.h + GAP_Y
    if (band?.(nodes)) {
      row.band = true
      y += BAND_ROW
    } else if (band && note && !noted && role !== "anc" && role !== "focus") {
      row.note = true
      noted = true
      row.noteY = y
      y += NOTE_ROW
    }
    rows.push(row)
  }
  return { rows, height: Math.max(0, y - GAP_Y) }
}

export interface Ctx {
  F: { x0: number; x1: number; depth: number }
  rows: Row[]
  W: number
}

/** A block's box: its span scaled so the focus fills the width. Ancestor rows clamp so their names stay in view. */
export function geom(x0: number, x1: number, depth: number, ctx: Ctx): Geom | null {
  const row = ctx.rows[depth]
  if (!row) return null
  const s = ctx.W / (ctx.F.x1 - ctx.F.x0 || 1)
  let a = (x0 - ctx.F.x0) * s
  let b = (x1 - ctx.F.x0) * s
  if (depth < ctx.F.depth) {
    a = Math.max(0, Math.min(ctx.W, a))
    b = Math.max(0, Math.min(ctx.W, b))
  }
  return { l: a + GAP_X / 2, w: Math.max(0, b - a - GAP_X), t: row.y, h: row.h, row }
}

/** Very thin children fold into one "+n" block at the end of their parent, so every block stays clickable. */
export function foldThin(F: LaidNode, ctx: Ctx): { more: LaidNode[]; folded: Set<string> } {
  const more: LaidNode[] = []
  const folded = new Set<string>()
  const s = ctx.W / (F.x1 - F.x0 || 1)
  for (const r of ctx.rows) {
    if (r.role !== "kids" && r.role !== "gkids") continue
    for (const p of atDepth(F, r.d - 1)) {
      const thin = p.children.filter((k) => k.value > 0 && (k.x1 - k.x0) * s < FOLD_UNDER)
      if (thin.length < 2) continue
      thin.forEach((k) => folded.add(k.id))
      more.push({
        node: { id: `${p.id}~more`, name: `${thin.length} more`, layer: thin[0].node.layer },
        id: `${p.id}~more`,
        depth: r.d,
        value: thin.reduce((a, k) => a + k.value, 0),
        hue: p.hue,
        kind: p.kind,
        parent: p,
        children: [],
        x0: Math.min(...thin.map((k) => k.x0)),
        x1: Math.max(...thin.map((k) => k.x1)),
        more: thin,
      })
    }
  }
  return { more, folded }
}

/** What to draw for a focus: the path, its siblings (they slide away), and the focus's subtree three layers down. */
export function drawSet(F: LaidNode): LaidNode[] {
  const set = new Set<LaidNode>()
  for (let p: LaidNode | undefined = F; p; p = p.parent) {
    set.add(p)
    p.parent?.children.forEach((s) => set.add(s))
  }
  const walk = (n: LaidNode) => {
    if (n.depth > F.depth + 3) return
    set.add(n)
    n.children.forEach(walk)
  }
  walk(F)
  return [...set]
}

/** The hue's four colours, as variables the block's CSS reads. */
export function hueVars(hue: LayerHue | undefined): CSSProperties | undefined {
  // "tide" is mapped in CSS from the theme's --layer-chart-investment-* tokens (data-hue).
  if (hue == null || hue === "tide") return undefined
  const v = (part: string) => `var(--paper-hue-${hue}-${part})`
  return {
    "--layer-hue-fill": v("fill"),
    "--layer-hue-fill-strong": v("fill-strong"),
    "--layer-hue-ink": v("ink"),
    "--layer-hue-solid": v("solid"),
  } as CSSProperties
}
