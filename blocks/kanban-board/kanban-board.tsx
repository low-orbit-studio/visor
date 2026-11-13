"use client"

import * as React from "react"

import { cn } from "../../lib/utils"
import { Card } from "../../components/ui/card/card"
import styles from "./kanban-board.module.css"

export interface KanbanBoardItem {
  /** Stable id. `onMove` receives it. */
  id: string
}

export interface KanbanBoardColumn<T extends KanbanBoardItem = KanbanBoardItem> {
  /** Stable id. `onMove` receives it as the target column. */
  id: string
  /** Column name, shown uppercase in the header and announced on moves. */
  label: string
  /** Right-aligned header figure (a sum, a value). Format it yourself. */
  total?: React.ReactNode
  /** The cards in this column, in display order. */
  items: T[]
  /** Shown when the column has no cards. */
  empty?: React.ReactNode
}

export interface KanbanBoardProps<T extends KanbanBoardItem>
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Columns in board order. Keyboard moves step through this order. */
  columns: KanbanBoardColumn<T>[]
  /** Column ids drawn as collapsed side rails until clicked open. */
  rails?: string[]
  /** The inside of a card. The block supplies the card surface, drag and keys. */
  renderCard: (item: T, column: KanbanBoardColumn<T>) => React.ReactNode
  /** Plain-text name of a card, used in screen reader announcements. */
  getItemLabel: (item: T) => string
  /** Called when a card is dropped on another column, by drag or by keyboard. */
  onMove: (itemId: string, toColumn: string) => void
  /** Called on Enter when no card is held (open the record). */
  onCardOpen?: (item: T) => void
  /** Content under an open column's cards (an Add button, a quick-add form). */
  renderColumnFooter?: (column: KanbanBoardColumn<T>) => React.ReactNode
}

/**
 * The card to focus for an arrow key: up and down within the column, left and
 * right to the nearest row of the next column that has cards. Null when none.
 */
export function neighborCard(columns: string[][], id: string, key: string): string | null {
  const col = columns.findIndex((c) => c.includes(id))
  if (col < 0) return null
  const row = columns[col].indexOf(id)
  if (key === "ArrowUp") return columns[col][row - 1] ?? null
  if (key === "ArrowDown") return columns[col][row + 1] ?? null
  const step = key === "ArrowLeft" ? -1 : key === "ArrowRight" ? 1 : 0
  if (!step) return null
  for (let i = col + step; i >= 0 && i < columns.length; i += step) {
    if (columns[i].length) return columns[i][Math.min(row, columns[i].length - 1)]
  }
  return null
}

export function KanbanBoard<T extends KanbanBoardItem>({
  columns,
  rails = [],
  renderCard,
  getItemLabel,
  onMove,
  onCardOpen,
  renderColumnFooter,
  className,
  ...rest
}: KanbanBoardProps<T>) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const hintId = React.useId()
  const [openRails, setOpenRails] = React.useState<string[]>([])
  const [dragId, setDragId] = React.useState<string | null>(null)
  const [over, setOver] = React.useState<string | null>(null)
  const [grab, setGrab] = React.useState<{ id: string; to: string } | null>(null)
  const [focusId, setFocusId] = React.useState<string | null>(null)
  const [live, setLive] = React.useState("")

  const homeOf = new Map<string, KanbanBoardColumn<T>>()
  for (const column of columns) for (const item of column.items) homeOf.set(item.id, column)
  const labelOf = (columnId: string) => columns.find((c) => c.id === columnId)?.label ?? columnId
  const isCollapsed = (columnId: string) => rails.includes(columnId) && !openRails.includes(columnId)
  const cardEl = (id: string) =>
    Array.from(rootRef.current?.querySelectorAll<HTMLElement>("[data-card-id]") ?? []).find(
      (el) => el.dataset.cardId === id
    )

  // A moved card remounts in its new column; put focus back on it unless the
  // user has already moved focus somewhere outside the board.
  React.useEffect(() => {
    if (!focusId) return
    const active = document.activeElement
    if (active && active !== document.body && !rootRef.current?.contains(active)) return
    const el = cardEl(focusId)
    if (el && el !== active) el.focus()
  }, [focusId, columns, openRails])

  function move(itemId: string, to: string) {
    const from = homeOf.get(itemId)
    // Ignore drops that are not one of this board's cards (text dragged in from elsewhere).
    if (!from || from.id === to) return
    const item = from.items.find((i) => i.id === itemId)!
    setLive(`${getItemLabel(item)} moved to ${labelOf(to)}.`)
    onMove(itemId, to)
  }

  function onCardKey(e: React.KeyboardEvent<HTMLDivElement>, item: T, column: KanbanBoardColumn<T>) {
    const name = getItemLabel(item)
    if (grab?.id === item.id) {
      e.preventDefault()
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        const i = columns.findIndex((c) => c.id === grab.to) + (e.key === "ArrowLeft" ? -1 : 1)
        const to = columns[Math.max(0, Math.min(columns.length - 1, i))].id
        setGrab({ id: item.id, to })
        setLive(`Over ${labelOf(to)}.`)
      } else if (e.key === " " || e.key === "Enter") {
        setGrab(null)
        if (grab.to === column.id) setLive(`${name} stays in ${column.label}.`)
        else {
          if (isCollapsed(grab.to)) setOpenRails((r) => [...r, grab.to])
          setFocusId(item.id)
          move(item.id, grab.to)
        }
      } else if (e.key === "Escape") {
        setGrab(null)
        setLive(`Move cancelled. ${name} stays in ${column.label}.`)
      }
      return
    }
    if (e.key === " ") {
      e.preventDefault()
      setGrab({ id: item.id, to: column.id })
      setLive(`Picked up ${name}. Left and right arrows choose a column, Space drops, Escape cancels.`)
    } else if (e.key === "Enter" && onCardOpen) {
      e.preventDefault()
      onCardOpen(item)
    } else if (e.key.startsWith("Arrow")) {
      const visible = columns.filter((c) => !isCollapsed(c.id)).map((c) => c.items.map((i) => i.id))
      const next = neighborCard(visible, item.id, e.key)
      if (next) {
        e.preventDefault()
        setFocusId(null)
        cardEl(next)?.focus()
      }
    }
  }

  const dropProps = (columnId: string) => ({
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = "move"
      if (over !== columnId) setOver(columnId)
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault()
      const id = e.dataTransfer.getData("text/plain") || dragId
      setDragId(null)
      setOver(null)
      if (id) move(id, columnId)
    },
  })

  const heldFrom = homeOf.get(dragId ?? grab?.id ?? "")?.id
  const isTarget = (columnId: string) =>
    heldFrom !== columnId &&
    ((dragId !== null && over === columnId) || (grab !== null && grab.to === columnId))

  function renderColumn(column: KanbanBoardColumn<T>) {
    const target = isTarget(column.id)
    const isRail = rails.includes(column.id)
    if (isCollapsed(column.id)) {
      return (
        <button
          key={column.id}
          type="button"
          className={styles.rail}
          data-slot="kanban-board-rail"
          data-target={target || undefined}
          aria-expanded={false}
          aria-label={`${column.label}, ${column.items.length} cards. Show column`}
          onClick={() => setOpenRails((r) => [...r, column.id])}
          {...dropProps(column.id)}
        >
          {column.label} · {column.items.length}
        </button>
      )
    }
    return (
      <section
        key={column.id}
        className={styles.column}
        data-slot="kanban-board-column"
        data-column-id={column.id}
        data-target={target || undefined}
        aria-label={column.label}
        {...dropProps(column.id)}
      >
        <header className={styles.head}>
          {isRail ? (
            <button
              type="button"
              className={styles.label}
              aria-expanded
              aria-label={`${column.label}. Collapse column`}
              onClick={() => setOpenRails((r) => r.filter((id) => id !== column.id))}
            >
              {column.label}
            </button>
          ) : (
            <span className={styles.label}>{column.label}</span>
          )}
          <span className={styles.count}>{column.items.length}</span>
          {column.total != null ? <span className={styles.total}>{column.total}</span> : null}
        </header>
        {target ? (
          <div className={styles.drop} data-slot="kanban-board-drop">
            Drop in {column.label}
          </div>
        ) : null}
        <div role="list" className={styles.cards}>
          {column.items.map((item) => (
            <Card
              key={item.id}
              size="sm"
              role="listitem"
              tabIndex={0}
              draggable
              data-card-id={item.id}
              data-grabbed={grab?.id === item.id || dragId === item.id || undefined}
              aria-describedby={hintId}
              className={styles.card}
              onKeyDown={(e) => onCardKey(e, item, column)}
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", item.id)
                e.dataTransfer.effectAllowed = "move"
                setDragId(item.id)
              }}
              onDragEnd={() => {
                setDragId(null)
                setOver(null)
              }}
            >
              {renderCard(item, column)}
            </Card>
          ))}
        </div>
        {column.items.length === 0 && !target && column.empty ? (
          <p className={styles.empty}>{column.empty}</p>
        ) : null}
        {renderColumnFooter?.(column)}
      </section>
    )
  }

  return (
    <div ref={rootRef} className={cn(styles.board, className)} data-slot="kanban-board" {...rest}>
      {columns.map(renderColumn)}
      <p id={hintId} className={styles.srOnly}>
        Press Space to pick up a card, Left and Right arrows to choose a column, Space to drop, Escape to cancel.
      </p>
      <div aria-live="polite" className={styles.srOnly}>
        {live}
      </div>
    </div>
  )
}
