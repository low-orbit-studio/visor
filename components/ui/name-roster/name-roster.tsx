import * as React from "react"
import { cn } from "../../../lib/utils"
import styles from "./name-roster.module.css"

// ------------------------------------------------------------------ Types

/** A single item in the items-shorthand prop */
export interface NameRosterItemData {
  name: string
  highlighted?: boolean
}

/**
 * Responsive column value — accepts a plain number or a breakpoint map.
 * Breakpoints: base, sm (640px), md (768px), lg (1024px), xl (1280px).
 */
export type ResponsiveValue<T> =
  | T
  | {
      base?: T
      sm?: T
      md?: T
      lg?: T
      xl?: T
    }

// ------------------------------------------------------------------ NameRosterItem

export interface NameRosterItemProps extends React.LiHTMLAttributes<HTMLLIElement> {
  /** Render this item with the highlighted dot color and type treatment. */
  highlighted?: boolean
}

const NameRosterItem = React.forwardRef<HTMLLIElement, NameRosterItemProps>(
  ({ className, highlighted = false, ...props }, ref) => {
    return (
      <li
        ref={ref}
        data-slot="name-roster-item"
        data-highlighted={highlighted ? "true" : undefined}
        className={cn(styles.item, highlighted && styles.itemHighlighted, className)}
        {...props}
      />
    )
  }
)
NameRosterItem.displayName = "NameRosterItem"

// ------------------------------------------------------------------ NameRoster

export interface NameRosterProps extends React.HTMLAttributes<HTMLUListElement | HTMLOListElement> {
  /**
   * Number of CSS columns to display.
   * Pass a number for a fixed column count, or a breakpoint map for responsive layout.
   * Defaults to 1.
   */
  columns?: ResponsiveValue<number>
  /**
   * Sort order of items.
   * - "alpha" — sort children / items array alphabetically via localeCompare
   * - "none" — render in insertion order (default)
   */
  sort?: "alpha" | "none"
  /**
   * Shorthand: provide an array of items instead of JSX children.
   * When both items and children are provided, items takes precedence.
   */
  items?: NameRosterItemData[]
  /**
   * Show the dot prefix indicator on each item. Defaults to true.
   */
  dot?: boolean
  /**
   * HTML list element to render. Defaults to "ul".
   */
  as?: "ul" | "ol"
}

/** Build an inline style object that sets CSS custom properties for each breakpoint. */
function buildColumnStyle(columns: ResponsiveValue<number>): React.CSSProperties {
  if (typeof columns === "number") {
    return { "--roster-columns": columns } as React.CSSProperties
  }

  const props: Record<string, number> = {}
  if (columns.base !== undefined) props["--roster-columns"] = columns.base
  if (columns.sm !== undefined) props["--roster-columns-sm"] = columns.sm
  if (columns.md !== undefined) props["--roster-columns-md"] = columns.md
  if (columns.lg !== undefined) props["--roster-columns-lg"] = columns.lg
  if (columns.xl !== undefined) props["--roster-columns-xl"] = columns.xl
  return props as React.CSSProperties
}

const NameRoster = React.forwardRef<
  HTMLUListElement | HTMLOListElement,
  NameRosterProps
>(
  (
    {
      className,
      style,
      columns = 1,
      sort = "none",
      items,
      dot = true,
      as: Tag = "ul",
      children,
      ...props
    },
    ref
  ) => {
    const columnStyle = buildColumnStyle(columns)

    let content: React.ReactNode

    if (items !== undefined) {
      // items-shorthand mode
      let sorted = [...items]
      if (sort === "alpha") {
        sorted = sorted.sort((a, b) => a.name.localeCompare(b.name))
      }
      content = sorted.map((item) => (
        <NameRosterItem key={item.name} highlighted={item.highlighted}>
          {item.name}
        </NameRosterItem>
      ))
    } else {
      // children mode — sort if requested
      if (sort === "alpha") {
        const childArray = React.Children.toArray(children)
        childArray.sort((a, b) => {
          const getLabel = (node: React.ReactNode): string => {
            if (!React.isValidElement(node)) return ""
            const p = node.props as Record<string, unknown>
            return typeof p.children === "string" ? p.children : ""
          }
          return getLabel(a).localeCompare(getLabel(b))
        })
        content = childArray
      } else {
        content = children
      }
    }

    return (
      <Tag
        ref={ref as React.Ref<HTMLUListElement & HTMLOListElement>}
        data-slot="name-roster"
        data-dot={dot ? "true" : "false"}
        className={cn(styles.roster, !dot && styles.rosterNoDot, className)}
        style={{ ...columnStyle, ...style }}
        {...props}
      >
        {content}
      </Tag>
    )
  }
)
NameRoster.displayName = "NameRoster"

export { NameRoster, NameRosterItem }
