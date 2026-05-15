import * as React from "react"
import { cn } from "../../../lib/utils"
import { Kbd } from "../kbd/kbd"
import styles from "./quick-actions.module.css"

export interface QuickAction {
  id: string
  label: React.ReactNode
  /** Shortcut keys, forwarded to `<Kbd keys={...} />`. */
  keys: string[]
}

export interface QuickActionsProps
  extends Omit<React.HTMLAttributes<HTMLUListElement>, "onClick"> {
  actions: QuickAction[]
  /**
   * When supplied, rows render as activatable buttons that fire this handler
   * on click, Enter, or Space. When omitted, rows render as plain list items
   * with no interactive affordance — the user reads the label and presses the
   * actual key on the keyboard.
   */
  onActivate?: (id: string) => void
}

/**
 * QuickActions — a vertical list of action rows pairing a left-aligned label
 * with a right-aligned `Kbd` shortcut. Sized for dashboard side-rail "quick"
 * panels and command-palette previews.
 *
 * Display-only by default: rows render as `<li>` and the keys are presented as
 * semantic `<kbd>` chrome. Supply `onActivate` to opt rows into interactive
 * mode — they become `role="button"` with `tabIndex={0}` and respond to click,
 * Enter, and Space.
 */
const QuickActions = React.forwardRef<HTMLUListElement, QuickActionsProps>(
  ({ className, actions, onActivate, ...props }, ref) => {
    const interactive = typeof onActivate === "function"

    return (
      <ul
        ref={ref}
        data-slot="quick-actions"
        role={interactive ? "group" : "list"}
        className={cn(styles.root, className)}
        {...props}
      >
        {actions.map((action) => {
          if (interactive) {
            const handleClick = () => onActivate(action.id)
            const handleKeyDown = (
              event: React.KeyboardEvent<HTMLLIElement>
            ) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault()
                onActivate(action.id)
              }
            }

            return (
              <li
                key={action.id}
                data-slot="quick-actions-row"
                data-interactive="true"
                role="button"
                tabIndex={0}
                className={styles.row}
                onClick={handleClick}
                onKeyDown={handleKeyDown}
              >
                <span
                  data-slot="quick-actions-label"
                  className={styles.label}
                >
                  {action.label}
                </span>
                <span data-slot="quick-actions-keys" className={styles.keys}>
                  <Kbd keys={action.keys} size="sm" />
                </span>
              </li>
            )
          }

          return (
            <li
              key={action.id}
              data-slot="quick-actions-row"
              className={styles.row}
            >
              <span data-slot="quick-actions-label" className={styles.label}>
                {action.label}
              </span>
              <span data-slot="quick-actions-keys" className={styles.keys}>
                <Kbd keys={action.keys} size="sm" />
              </span>
            </li>
          )
        })}
      </ul>
    )
  }
)
QuickActions.displayName = "QuickActions"

export { QuickActions }
