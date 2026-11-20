import * as React from "react"
import { PencilSimpleIcon } from "@phosphor-icons/react"
import { cn } from "../../../lib/utils"
import styles from "./card.module.css"

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "default" | "sm"
  /**
   * `"glass"` draws the card on two sibling layers, a glass fill and a blended edge,
   * which read the glass layer: glass under `data-glass="on"`, the card surface and
   * a border everywhere else.
   */
  variant?: "default" | "glass"
  /** The whole card is a button, with a pen in the corner and a lift on hover. Set `data-flash` to play the save flash. */
  editable?: boolean
  /** The element to render. Defaults to `"button"` when `editable`, `"div"` otherwise. */
  as?: "div" | "section" | "main" | "button"
}

// The ref stays typed as HTMLDivElement so existing callers keep compiling; with `as`
// (or `editable`) it points at that element instead.
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, size = "default", variant, editable, as, children, ...props }, ref) => {
    const tag = as ?? (editable ? "button" : "div")
    const Tag = tag as "div"
    const glass = variant === "glass"
    return (
      <Tag
        ref={ref}
        data-slot="card"
        data-size={size}
        data-variant={glass ? "glass" : undefined}
        data-editable={editable ? "" : undefined}
        {...(tag === "button" ? { type: "button" } : null)}
        className={cn(
          styles.card,
          size === "sm" && styles.cardSm,
          glass && styles.glass,
          editable && styles.editable,
          className
        )}
        {...props}
      >
        {/* Siblings of the content, never its ancestors, so a blurred field inside still blurs the photo. */}
        {glass && <span data-slot="card-glass" className={styles.glassLayer} aria-hidden="true" />}
        {glass && <span data-slot="card-edge" className={styles.edgeLayer} aria-hidden="true" />}
        {children}
        {editable && (
          <span data-slot="card-pen" className={styles.pen} aria-hidden="true">
            <PencilSimpleIcon weight="bold" />
          </span>
        )}
      </Tag>
    )
  }
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="card-header"
        className={cn(styles.cardHeader, className)}
        {...props}
      />
    )
  }
)
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="card-title"
        className={cn(styles.cardTitle, className)}
        {...props}
      />
    )
  }
)
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="card-description"
        className={cn(styles.cardDescription, className)}
        {...props}
      />
    )
  }
)
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="card-content"
        className={cn(styles.cardContent, className)}
        {...props}
      />
    )
  }
)
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="card-footer"
        className={cn(styles.cardFooter, className)}
        {...props}
      />
    )
  }
)
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
