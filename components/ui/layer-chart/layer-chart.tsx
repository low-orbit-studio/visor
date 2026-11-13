import * as React from "react"
import { cn } from "../../../lib/utils"
import styles from "./layer-chart.module.css"
import {
  MORE_MIN,
  NARROW_WIDTH,
  BAND_H,
  drawSet,
  foldThin,
  geom,
  layout,
  hueVars,
  rowsFor,
  type Ctx,
  type Geom,
  type LaidNode,
  type LayerNode,
  type RowRole,
} from "./layer-chart-layout"

export type { LayerHue, LayerKind, LayerNode } from "./layer-chart-layout"
export { hueVars } from "./layer-chart-layout"

export type LayerFocusReason = "open" | "up" | "more"

export interface LayerChartBand {
  /** The band's value for a node, or undefined where it is not measured. A row draws the band when any of its blocks has one. */
  value: (node: LayerNode) => number | undefined
  /** The word before the figure on wide band segments. Defaults to `"Agent"`. */
  label?: string
  /** Formats the band's figure. Defaults to `"{n} h"`. */
  format?: (value: number) => string
  /** The one-line note under the first row below the focus that has no band ("Agent time · not measured per package yet"). */
  note?: (layer: string) => React.ReactNode
}

export interface LayerChartBlockInfo {
  role: RowRole
  /** The block's drawn width in px. */
  width: number
}

export interface LayerChartCardInfo {
  /** The node's value in the current measure. */
  value: number
  /** Its share of its parent, 0 to 100, when it has a parent. */
  share?: number
  /** The nodes a "+n" block stands for. */
  more?: LayerNode[]
}

export interface LayerChartProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children" | "onChange"> {
  /** The tree. Its root is the top row. */
  data: LayerNode
  /** Reads a node's value in the current measure. Undefined on a parent sums its children; zero leaves the chart. Defaults to `node.value`. */
  measure?: (node: LayerNode) => number | undefined
  /** The open block (controlled). */
  focusId?: string
  /** The block open at first (uncontrolled). Defaults to the root. */
  defaultFocusId?: string
  /** Called when a block opens: a click, `Enter`, `Esc` (up a layer) or a "+n" block (opens its parent). */
  onFocusChange?: (id: string, node: LayerNode, reason: LayerFocusReason) => void
  /** Formats a value. `short` is the number alone, for thin blocks. Defaults to the number, two decimals at most. */
  format?: (value: number, info: { node: LayerNode; short: boolean }) => string
  /** Content drawn at the foot of a wide block one or two layers down (an estimate meter in a package block). */
  renderBlock?: (node: LayerNode, info: LayerChartBlockInfo) => React.ReactNode
  /** The hover card's content. Defaults to the name, the layer, the value and the share of the parent. */
  renderCard?: (node: LayerNode, info: LayerChartCardInfo) => React.ReactNode
  /** An optional paler band under the rows where it is measured (agent time). */
  band?: LayerChartBand
}

const defaultMeasure = (n: LayerNode) => n.value
const defaultFormat = (v: number) => String(+v.toFixed(2))
const defaultBandFormat = (v: number) => `${+v.toFixed(2)} h`

const share = (n: LaidNode) =>
  n.parent && n.parent.value ? Math.round((n.value / n.parent.value) * 100) : undefined

interface Drawn {
  n: LaidNode
  g: Geom
  ghost: boolean
}

const LayerChart = React.forwardRef<HTMLDivElement, LayerChartProps>(
  (
    {
      className,
      data,
      measure = defaultMeasure,
      focusId,
      defaultFocusId,
      onFocusChange,
      format = defaultFormat,
      renderBlock,
      renderCard,
      band,
      "aria-label": ariaLabel = "Layers",
      ...props
    },
    ref
  ) => {
    const [innerFocus, setInnerFocus] = React.useState(defaultFocusId ?? data.id)
    const canvasRef = React.useRef<HTMLDivElement>(null)
    const iceRef = React.useRef<HTMLDivElement>(null)
    const [W, setW] = React.useState(0)
    const [card, setCard] = React.useState<{ id: string; left: number; top: number } | null>(null)
    const [, tick] = React.useReducer((x: number) => x + 1, 0)

    React.useLayoutEffect(() => {
      const el = canvasRef.current
      if (!el) return
      setW(el.clientWidth)
      if (typeof ResizeObserver === "undefined") return
      const ro = new ResizeObserver(() => setW(el.clientWidth))
      ro.observe(el)
      return () => ro.disconnect()
    }, [])

    const { root, byId } = React.useMemo(() => layout(data, measure), [data, measure])
    const F = byId.get(focusId ?? innerFocus) ?? root
    const narrow = W > 0 && W < NARROW_WIDTH
    const bandRow = band ? (nodes: LaidNode[]) => nodes.some((n) => band.value(n.node) != null) : undefined
    const { rows, height } = rowsFor(F, narrow, bandRow, !!band?.note)
    const ctx: Ctx = { F, rows, W }
    const { more, folded } = foldThin(F, ctx)
    const fmt = (n: LaidNode, short = false) => format(n.value, { node: n.node, short })

    // Animation memory: where every block was last drawn, and the blocks leaving.
    const last = React.useRef<{ ctx: Ctx; xs: Map<string, [number, number]>; geoms: Map<string, Geom>; nodes: Map<string, LaidNode> } | null>(null)
    const leaving = React.useRef(new Map<string, number>())
    const els = React.useRef(new Map<string, HTMLElement>())
    const pendingFocus = React.useRef<string | null>(null)
    // Blocks keep the DOM order they were created in: moving a node would cut its transition short.
    const order = React.useRef(new Map<string, number>())

    const drawn: Drawn[] = []
    const ids = new Set<string>()
    if (W > 0) {
      for (const n of [...drawSet(F).filter((n) => !folded.has(n.id)), ...more]) {
        const g = geom(n.x0, n.x1, n.depth, ctx)
        if (!g) continue
        // The fold stays a 24px target.
        if (n.more && g.w < MORE_MIN) {
          g.l -= MORE_MIN - g.w
          g.w = MORE_MIN
        }
        ids.add(n.id)
        drawn.push({ n, g, ghost: false })
      }
      // Blocks that left the draw set slide to where they would sit now, fade, then go.
      const now = Date.now()
      for (const [id, n] of last.current?.nodes ?? []) {
        if (ids.has(id)) continue
        const until = leaving.current.get(id)
        if (until != null && until < now) continue
        const cur = byId.get(id) ?? n
        const g = geom(cur.x0, cur.x1, cur.depth, ctx) ?? last.current!.geoms.get(id)
        if (g) drawn.push({ n: cur, g, ghost: true })
      }
      for (const d of drawn) if (!order.current.has(d.n.id)) order.current.set(d.n.id, order.current.size)
      drawn.sort((x, y) => order.current.get(x.n.id)! - order.current.get(y.n.id)!)
    }

    React.useLayoutEffect(() => {
      const prev = last.current
      const rootEl = iceRef.current
      const instant = !prev || prev.ctx.W !== W
      const now = Date.now()
      for (const d of drawn) {
        if (d.ghost) {
          if (!leaving.current.has(d.n.id)) leaving.current.set(d.n.id, now + 520)
          continue
        }
        leaving.current.delete(d.n.id)
        const el = els.current.get(d.n.id)
        if (!el || instant || prev.nodes.has(d.n.id)) continue
        // A block that is new to the view grows out of where it was in the last view.
        const px = prev.xs.get(d.n.id)
        const pg = px ? geom(px[0], px[1], d.n.depth, prev.ctx) : null
        const final = el.style.cssText
        el.style.transition = "none"
        if (pg) Object.assign(el.style, { left: `${pg.l}px`, top: `${pg.t}px`, width: `${pg.w}px`, height: `${pg.h}px` })
        else el.style.opacity = "0"
        void el.offsetWidth
        el.style.cssText = final
      }
      if (instant && rootEl) {
        rootEl.setAttribute("data-instant", "")
        void rootEl.offsetWidth
        rootEl.removeAttribute("data-instant")
      }
      const xs = new Map<string, [number, number]>()
      byId.forEach((n) => xs.set(n.id, [n.x0, n.x1]))
      more.forEach((n) => xs.set(n.id, [n.x0, n.x1]))
      last.current = {
        ctx,
        xs,
        geoms: new Map(drawn.map((d) => [d.n.id, d.g])),
        nodes: new Map(drawn.map((d) => [d.n.id, d.n])),
      }
      if (pendingFocus.current) {
        els.current.get(pendingFocus.current)?.focus({ preventScroll: true })
        pendingFocus.current = null
      }
      if (drawn.some((d) => d.ghost)) {
        const t = setTimeout(tick, 540)
        return () => clearTimeout(t)
      }
    })

    const go = (n: LaidNode, reason: LayerFocusReason) => {
      if (focusId === undefined) setInnerFocus(n.id)
      setCard(null)
      pendingFocus.current = n.id
      onFocusChange?.(n.id, n.node, reason)
    }

    const click = (n: LaidNode) => {
      if (n.more && n.parent) return go(n.parent, "more")
      if (n.id === F.id && n.parent) return go(n.parent, "up")
      if (n.id !== F.id) go(n, "open")
    }

    const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape" && F.parent) {
        e.preventDefault()
        go(F.parent, "up")
      } else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        const list = drawn
          .filter((d) => !d.ghost && d.g.row.role === "kids" && d.g.w > 0.5)
          .sort((a, b) => a.g.l - b.g.l)
          .map((d) => els.current.get(d.n.id))
          .filter((el): el is HTMLElement => !!el)
        if (!list.length) return
        const i = list.indexOf(document.activeElement as HTMLElement)
        const next = i < 0 ? 0 : Math.max(0, Math.min(list.length - 1, i + (e.key === "ArrowRight" ? 1 : -1)))
        list[next].focus({ preventScroll: true })
        e.preventDefault()
      }
      props.onKeyDown?.(e)
    }

    const hover = (n: LaidNode, el: HTMLElement, clientX: number) => {
      if (narrow || card?.id === n.id) return
      const c = canvasRef.current?.getBoundingClientRect()
      if (!c) return
      const r = el.getBoundingClientRect()
      const left = Math.max(0, Math.min(clientX - c.left + 12, c.width - 300))
      setCard({ id: n.id, left, top: r.top - c.top + Math.min(r.height, 60) })
    }

    const label = (n: LaidNode, role: RowRole, w: number): React.ReactNode => {
      if (n.more) return w >= 22 ? <span className={styles.value}>+{n.more.length}</span> : null
      const name = n.node.ref ? `${n.node.ref} ${n.node.name}` : n.node.name
      const v = fmt(n)
      if (role === "anc" || role === "focus") {
        if (w > 150)
          return (
            <>
              <span className={styles.name}>
                {name}
                {role === "focus" && !n.parent && n.node.sub != null && <span className={styles.sub}> · {n.node.sub}</span>}
              </span>
              <span className={styles.value}>{v}</span>
            </>
          )
        return w > 64 ? <span className={styles.value}>{v}</span> : null
      }
      if (role === "kids") {
        if (w < 40) return null
        if (w < 64) return <span className={styles.text}><span className={styles.value}>{fmt(n, true)}</span></span>
        if (w < 104)
          return (
            <span className={styles.text}>
              <span className={styles.name}>{name}</span>
              <span className={styles.value}>{v}</span>
            </span>
          )
        const pct = share(n) ?? 100
        const slot = w > 120 ? renderBlock?.(n.node, { role, width: w }) : null
        return (
          <>
            <span className={styles.text}>
              <span className={styles.name}>{name}</span>
              <span className={styles.big}>
                {v}
                {w > 150 && pct < 100 && <small className={styles.pct}>{pct}%</small>}
              </span>
              {n.node.sub != null && <span className={styles.sub}>{n.node.sub}</span>}
            </span>
            {slot != null && <span className={styles.slot}>{slot}</span>}
          </>
        )
      }
      if (role === "gkids") {
        if (w < 40) return null
        if (w < 112) return <span className={styles.text}><span className={styles.value}>{fmt(n, true)}</span></span>
        const slot = !narrow && w > 120 ? renderBlock?.(n.node, { role, width: w }) : null
        return (
          <>
            <span className={styles.text}>
              <span className={styles.name}>{name}</span>
              <span className={styles.value}>{v}</span>
              {!narrow && w >= 170 && n.node.sub != null && <span className={styles.sub}>{n.node.sub}</span>}
            </span>
            {slot != null && <span className={styles.slot}>{slot}</span>}
          </>
        )
      }
      return w > 130 ? <span className={styles.text}><span className={styles.name}>{name}</span></span> : null
    }

    const cardNode = card ? (drawn.find((d) => d.n.id === card.id && !d.ghost)?.n ?? null) : null
    const bandNodes =
      band && W > 0
        ? drawn.filter((d) => !d.ghost && d.g.row.band && d.g.w >= 1 && band.value(d.n.node) != null)
        : []
    const noteRow = band?.note ? rows.find((r) => r.note) : undefined

    return (
      <div
        ref={ref}
        data-slot="layer-chart"
        data-narrow={narrow ? "" : undefined}
        className={cn(styles.root, className)}
        {...props}
        onKeyDown={onKeyDown}
      >
        <div data-slot="layer-chart-gutter" className={styles.gutter} aria-hidden="true" style={{ height }}>
          {rows.map((r) => (
            <span key={r.d} className={styles.gutterLabel} style={{ top: r.y, height: r.h }}>
              {r.label}
            </span>
          ))}
        </div>
        <div ref={canvasRef} className={styles.canvas} onPointerLeave={() => setCard(null)}>
          <div
            ref={iceRef}
            role="group"
            aria-label={ariaLabel}
            data-slot="layer-chart-rows"
            className={styles.ice}
            style={{ height }}
          >
            {drawn.map(({ n, g, ghost }) => {
              const visible = !ghost && g.w > 0.5 && g.l < W && g.l + g.w > 0
              return (
                <button
                  key={n.id}
                  ref={(el) => {
                    if (el) els.current.set(n.id, el)
                    else els.current.delete(n.id)
                  }}
                  type="button"
                  data-slot="layer-chart-block"
                  data-id={n.id}
                  data-role={g.row.role}
                  data-kind={n.kind}
                  data-tone={Math.min(Math.max(0, n.depth - 1), 4)}
                  data-hue={n.hue === "tide" ? "tide" : undefined}
                  data-root={n.parent ? undefined : ""}
                  data-today={n.node.today ? "" : undefined}
                  data-more={n.more ? "" : undefined}
                  data-ghost={ghost ? "" : undefined}
                  className={styles.block}
                  tabIndex={visible ? 0 : -1}
                  aria-hidden={visible ? undefined : true}
                  aria-current={n.id === F.id ? "true" : undefined}
                  aria-label={`${n.node.ref ? `${n.node.ref} ` : ""}${n.node.name}, ${fmt(n)}`}
                  style={{
                    ...hueVars(n.hue),
                    left: g.l,
                    top: g.t,
                    width: g.w,
                    height: g.h,
                    opacity: ghost || g.w <= 0.5 ? 0 : 1,
                  }}
                  onClick={() => click(n)}
                  onPointerMove={(e) => hover(n, e.currentTarget, e.clientX)}
                >
                  {!ghost && label(n, g.row.role, g.w)}
                </button>
              )
            })}
            {bandNodes.map(({ n, g }) => {
              const v = band!.value(n.node)!
              const f = (band!.format ?? defaultBandFormat)(v)
              return (
                <div
                  key={`band:${n.id}`}
                  data-slot="layer-chart-band"
                  data-hue={n.hue === "tide" ? "tide" : undefined}
                  className={styles.band}
                  style={{ ...hueVars(n.hue), left: g.l, top: g.t + g.h + 3, width: g.w, height: BAND_H }}
                >
                  {g.w > 96 ? `${band!.label ?? "Agent"} ${f}` : g.w > 40 ? f : ""}
                </div>
              )
            })}
            {noteRow && (
              <div data-slot="layer-chart-note" className={styles.note} style={{ top: noteRow.noteY }}>
                {band!.note!(noteRow.label)}
              </div>
            )}
          </div>
          {cardNode && card && (
            <div data-slot="layer-chart-card" className={styles.card} style={{ left: card.left, top: card.top }} aria-hidden="true">
              {renderCard
                ? renderCard(cardNode.node, { value: cardNode.value, share: share(cardNode), more: cardNode.more?.map((m) => m.node) })
                : defaultCard(cardNode, fmt(cardNode))}
            </div>
          )}
        </div>
      </div>
    )
  }
)
LayerChart.displayName = "LayerChart"

function defaultCard(n: LaidNode, value: string): React.ReactNode {
  const p = n.parent
  const pct = share(n)
  if (n.more)
    return (
      <>
        <p className={styles.cardTitle}>{n.more.length} more</p>
        <p className={styles.cardSub}>{value} together. Open {p?.node.name} to see each one.</p>
      </>
    )
  return (
    <>
      <p className={styles.cardTitle}>{n.node.ref ? `${n.node.ref} ${n.node.name}` : n.node.name}</p>
      <p className={styles.cardSub}>
        {n.node.layer}
        {p && p.parent ? ` · ${p.node.ref ?? p.node.name}` : ""}
      </p>
      <dl className={styles.cardList}>
        <dt>Value</dt>
        <dd>{value}</dd>
        {p && pct != null && (
          <>
            <dt>Share of {p.node.ref ?? p.node.name}</dt>
            <dd>{pct}%</dd>
          </>
        )}
      </dl>
    </>
  )
}

export { LayerChart }
export { SpanStrip } from "./span-strip"
export type { SpanStripProps, Span, SpanKind, SpanLane } from "./span-strip"
