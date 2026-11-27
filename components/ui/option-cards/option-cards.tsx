"use client"

import * as React from "react"
import { CheckIcon, MinusIcon, PlusIcon, StarIcon } from "@phosphor-icons/react"
import { cn } from "../../../lib/utils"
import styles from "./option-cards.module.css"

/* ─── Types ─────────────────────────────────────────────────────────── */

export interface OptionCardsOption {
  /** Card title. */
  label: React.ReactNode
  /** One-line detail under the label. */
  detail?: React.ReactNode
  /** What this option gets right, drawn with a plus. */
  pros?: React.ReactNode[]
  /** What it costs, drawn with a minus. */
  cons?: React.ReactNode[]
  /** Marks the recommended option. Only the first option that sets it is marked. */
  recommended?: boolean
  /** Optional quiet line at the foot of the card (e.g. what picking it sends). */
  footnote?: React.ReactNode
}

export interface OptionCardsProps
  extends Omit<React.ComponentPropsWithoutRef<"div">, "defaultValue" | "onChange"> {
  /** Two to four options, in order. They are lettered A, B, C, D. */
  options: OptionCardsOption[]
  /** Controlled selection: the picked option's index, or null for none. */
  value?: number | null
  /** Uncontrolled initial selection. */
  defaultValue?: number | null
  /** Fires with the picked option's index. */
  onValueChange?: (index: number) => void
}

/* ─── Helpers ───────────────────────────────────────────────────────── */

const letter = (i: number) => String.fromCharCode(65 + i)

type Box = { left: number; top: number; width: number; height: number }

/* ─── OptionCards ───────────────────────────────────────────────────── */

const OptionCards = React.forwardRef<HTMLDivElement, OptionCardsProps>(
  (
    {
      options,
      value: valueProp,
      defaultValue = null,
      onValueChange,
      className,
      style,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledby,
      ...props
    },
    ref,
  ) => {
    const [inner, setInner] = React.useState<number | null>(defaultValue)
    const controlled = valueProp !== undefined
    const value = controlled ? valueProp : inner

    const gridRef = React.useRef<HTMLDivElement>(null)
    const cardRefs = React.useRef<(HTMLButtonElement | null)[]>([])
    const recommendedIndex = options.findIndex((o) => o.recommended)
    const baseId = React.useId()

    const select = React.useCallback(
      (i: number) => {
        if (!controlled) setInner(i)
        onValueChange?.(i)
      },
      [controlled, onValueChange],
    )

    const pick = (i: number) => {
      select(i)
      cardRefs.current[i]?.focus()
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return
      const n = options.length
      const current = value ?? -1
      let next: number | null = null
      if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (current + 1) % n
      else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (current - 1 + n) % n
      else if (event.key.length === 1) {
        const i = event.key.toUpperCase().charCodeAt(0) - 65
        if (i >= 0 && i < n) next = i
      }
      if (next === null) return
      event.preventDefault()
      pick(next)
    }

    /* The ring is one element that slides to the picked card. The first
       placement jumps; later moves slide (and not at all under reduced motion). */
    const [ring, setRing] = React.useState<Box | null>(null)
    const [placed, setPlaced] = React.useState(false)

    const measure = React.useCallback(() => {
      const card = value === null ? null : cardRefs.current[value]
      if (!card) {
        setRing(null)
        return
      }
      const next = {
        left: card.offsetLeft,
        top: card.offsetTop,
        width: card.offsetWidth,
        height: card.offsetHeight,
      }
      setRing((prev) =>
        prev &&
        prev.left === next.left &&
        prev.top === next.top &&
        prev.width === next.width &&
        prev.height === next.height
          ? prev
          : next,
      )
    }, [value])

    React.useEffect(() => {
      measure()
      const grid = gridRef.current
      if (!grid || typeof ResizeObserver === "undefined") return
      const observer = new ResizeObserver(measure)
      observer.observe(grid)
      return () => observer.disconnect()
    }, [measure])

    React.useEffect(() => {
      if (!ring || placed) return
      const frame = requestAnimationFrame(() => setPlaced(true))
      return () => cancelAnimationFrame(frame)
    }, [ring, placed])

    const tabStop = value ?? 0

    return (
      <div
        ref={ref}
        data-slot="option-cards"
        className={cn(styles.root, className)}
        style={style}
        {...props}
      >
        <div
          ref={gridRef}
          role="radiogroup"
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledby}
          className={styles.grid}
          style={{ "--option-cards-count": options.length } as React.CSSProperties}
          onKeyDown={handleKeyDown}
        >
          {ring && (
            <span
              aria-hidden="true"
              data-slot="option-cards-ring"
              data-placed={placed ? "true" : undefined}
              className={styles.ring}
              style={{
                width: ring.width,
                height: ring.height,
                transform: `translate(${ring.left}px, ${ring.top}px)`,
              }}
            />
          )}
          {options.map((option, i) => {
            const on = value === i
            const id = `${baseId}-${i}`
            const described = [
              i === recommendedIndex && `${id}-rec`,
              option.detail && `${id}-detail`,
              (option.pros?.length || option.cons?.length) && `${id}-tradeoff`,
              option.footnote && `${id}-foot`,
            ]
              .filter(Boolean)
              .join(" ")
            return (
              <button
                key={i}
                ref={(node) => {
                  cardRefs.current[i] = node
                }}
                type="button"
                role="radio"
                aria-checked={on}
                aria-labelledby={`${id}-label`}
                aria-describedby={described || undefined}
                tabIndex={i === tabStop ? 0 : -1}
                data-slot="option-cards-card"
                data-state={on ? "checked" : "unchecked"}
                className={styles.card}
                onClick={() => select(i)}
              >
                {/* Spans only: a button may hold phrasing content, not lists. */}
                <span className={styles.top}>
                  <span className={styles.letter} aria-hidden="true">
                    {letter(i)}
                  </span>
                  {i === recommendedIndex && (
                    <span id={`${id}-rec`} className={styles.recommended} data-slot="option-cards-recommended">
                      <StarIcon size={13} weight="fill" aria-hidden="true" />
                      Recommended
                    </span>
                  )}
                  <span className={styles.check} aria-hidden="true">
                    <CheckIcon size={14} weight="bold" />
                  </span>
                </span>
                <span id={`${id}-label`} className={styles.label}>
                  {option.label}
                </span>
                {option.detail && (
                  <span id={`${id}-detail`} className={styles.detail}>
                    {option.detail}
                  </span>
                )}
                {option.pros?.length || option.cons?.length ? (
                  <span id={`${id}-tradeoff`} className={styles.tradeoff}>
                    {option.pros?.map((p, j) => (
                      <span key={`p${j}`} className={styles.item} data-kind="pro">
                        <PlusIcon size={13} weight="bold" aria-hidden="true" />
                        <span>
                          <span className={styles.srOnly}>Pro: </span>
                          {p}
                        </span>
                      </span>
                    ))}
                    {option.cons?.map((c, j) => (
                      <span key={`c${j}`} className={styles.item} data-kind="con">
                        <MinusIcon size={13} weight="bold" aria-hidden="true" />
                        <span>
                          <span className={styles.srOnly}>Con: </span>
                          {c}
                        </span>
                      </span>
                    ))}
                  </span>
                ) : null}
                {option.footnote && (
                  <span id={`${id}-foot`} className={styles.footnote}>
                    {option.footnote}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    )
  },
)
OptionCards.displayName = "OptionCards"

export { OptionCards }
