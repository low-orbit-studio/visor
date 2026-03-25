import { Children, cloneElement, isValidElement, type ReactNode, type ReactElement } from "react"
import { staggerDelay } from "../../../lib/deck-stagger"
import { cn } from "../../../lib/utils"
import styles from "./card-grid.module.css"

export interface CardGridProps {
  /** Number of columns (default: 3) */
  columns?: 2 | 3 | 4 | 5
  className?: string
  children: ReactNode
}

export function CardGrid({ columns = 3, className, children }: CardGridProps) {
  const style = columns !== 3
    ? { gridTemplateColumns: `repeat(${columns}, 1fr)` }
    : undefined

  return (
    <div
      data-slot="card-grid"
      className={cn(styles.grid, className)}
      style={style}
    >
      {Children.map(children, (child, i) => {
        if (!isValidElement(child)) return child
        return cloneElement(child as ReactElement<{ style?: React.CSSProperties; "data-deck-animate"?: boolean }>, {
          "data-deck-animate": true,
          style: {
            ...(child.props as { style?: React.CSSProperties }).style,
            ...staggerDelay(i + 1, "card"),
          },
        })
      })}
    </div>
  )
}
