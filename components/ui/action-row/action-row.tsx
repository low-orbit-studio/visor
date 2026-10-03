import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "../../../lib/utils"
import styles from "./action-row.module.css"

/**
 * Selectors for anything a keyboard or pointer can act on. The trailing slot
 * sits inside the row's own button or link, so none of these may live there:
 * nesting interactive content is invalid HTML and breaks name, role and value
 * (WCAG 4.1.2).
 */
const INTERACTIVE_SELECTOR = [
  "a[href]",
  "button",
  "input",
  "select",
  "textarea",
  "summary",
  "audio[controls]",
  "video[controls]",
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable]:not([contenteditable="false"])',
  '[role="button"]',
  '[role="link"]',
  '[role="switch"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="menuitem"]',
  '[role="tab"]',
].join(",")

/** Roles whose selected state is `aria-selected`; `aria-current` is not allowed on them. */
const SELECTABLE_ROLES = new Set(["option", "tab", "row", "gridcell", "treeitem"])

export interface ActionRowProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** The row's title. With `asChild`, pass the one element to render as (an `<a>`) and put the title in it. */
  children: React.ReactNode
  /** Render as the single child element (an `<a href>`, a router Link) instead of a `<button>`. */
  asChild?: boolean
  /** Leading slot: an icon, an avatar. Decorative; the title carries the name. */
  leading?: React.ReactNode
  /** Optional second line under the title. */
  line?: React.ReactNode
  /**
   * Trailing slot: a value, a badge, a caret. Non-interactive: the row is
   * already one button or link, so a Switch or a second button here is invalid
   * and fires a development warning.
   */
  trailing?: React.ReactNode
  /** The row is the current choice. Sets `aria-current` (`aria-selected` on option, tab, row, gridcell and treeitem roles). */
  selected?: boolean
  /** The row has opened something (a picker, a popover). Sets `aria-expanded` and `data-state="open"`. */
  open?: boolean
  disabled?: boolean
}

/** Warns once per mount, in development only, when the trailing slot holds a focusable element. */
function useTrailingInteractiveWarning(
  ref: React.RefObject<HTMLElement | null>,
  trailing: React.ReactNode
) {
  const warned = React.useRef(false)
  React.useEffect(() => {
    if (process.env.NODE_ENV === "production" || warned.current || trailing == null) return
    const found = ref.current?.querySelector(INTERACTIVE_SELECTOR)
    if (found) {
      warned.current = true
      // eslint-disable-next-line no-console
      console.warn(
        `[ActionRow] the trailing slot holds an interactive <${found.tagName.toLowerCase()}>. ` +
          "The row is already one button or link, so nested interactive content is invalid HTML " +
          "(WCAG 4.1.2). Keep the trailing slot to a value, badge or caret; a row that needs a " +
          "Switch is a label row with the Switch as its own control."
      )
    }
  })
}

/**
 * ActionRow — one tappable list row: a leading icon, a title, an optional
 * second line and a trailing value or caret. The whole row is one `<button>`
 * (or an `<a>` through `asChild`), at least 44px tall.
 *
 * Rest, hover, focus-visible, selected, open and disabled each have a token.
 * Stack rows in an `ActionRowList` for a hairline between them. A row that
 * opens in place (an accordion) is the consumer's: this primitive is the
 * closed row, and `open` only styles a row that has opened something.
 */
const ActionRow = React.forwardRef<HTMLButtonElement, ActionRowProps>(
  (
    {
      className,
      asChild = false,
      leading,
      line,
      trailing,
      selected = false,
      open,
      disabled = false,
      type,
      role,
      onClick,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button"
    const trailingRef = React.useRef<HTMLSpanElement | null>(null)
    useTrailingInteractiveWarning(trailingRef, trailing)

    const selectedAttr = role && SELECTABLE_ROLES.has(role) ? "aria-selected" : "aria-current"
    const stateProps: Record<string, unknown> = {}
    if (selected) stateProps[selectedAttr] = props["aria-current"] ?? "true"
    if (open !== undefined) {
      stateProps["aria-expanded"] = open
      stateProps["data-state"] = open ? "open" : "closed"
    }
    if (disabled) {
      stateProps["data-disabled"] = ""
      if (asChild) {
        // A link has no `disabled`; keep it out of the tab order and inert.
        stateProps["aria-disabled"] = true
        stateProps.tabIndex = -1
      } else {
        stateProps.disabled = true
      }
    }

    const body = (title: React.ReactNode) => (
      <>
        {leading ? (
          <span data-slot="action-row-leading" className={styles.leading} aria-hidden="true">
            {leading}
          </span>
        ) : null}
        <span data-slot="action-row-body" className={styles.body}>
          <span data-slot="action-row-title" className={styles.title}>
            {title}
          </span>
          {line ? (
            <>
              {" "}
              <span data-slot="action-row-line" className={styles.line}>
                {line}
              </span>
            </>
          ) : null}
        </span>
        {trailing != null && trailing !== false ? " " : null}
        {trailing != null && trailing !== false ? (
          <span data-slot="action-row-trailing" className={styles.trailing} ref={trailingRef}>
            {trailing}
          </span>
        ) : null}
      </>
    )

    return (
      <Comp
        ref={ref}
        {...(asChild ? {} : { type: type ?? "button" })}
        role={role}
        data-slot="action-row"
        data-selected={selected ? "true" : undefined}
        className={cn(styles.root, className)}
        onClick={
          disabled && asChild
            ? (event: React.MouseEvent<HTMLButtonElement>) => event.preventDefault()
            : onClick
        }
        {...props}
        {...stateProps}
      >
        {asChild && React.isValidElement<{ children?: React.ReactNode }>(children)
          ? React.cloneElement(children, undefined, body(children.props.children))
          : body(children)}
      </Comp>
    )
  }
)
ActionRow.displayName = "ActionRow"

export interface ActionRowListProps extends React.HTMLAttributes<HTMLUListElement> {
  /** The rows. Each is wrapped in a list item, so a screen reader announces "list, N items". */
  children: React.ReactNode
}

/**
 * ActionRowList — stacks ActionRows with a hairline between them. The hairline
 * reads `--hairline-width`, so `hairlines: off` in a theme removes it with no
 * layout shift.
 */
const ActionRowList = React.forwardRef<HTMLUListElement, ActionRowListProps>(
  ({ className, children, ...props }, ref) => (
    <ul ref={ref} data-slot="action-row-list" className={cn(styles.list, className)} {...props}>
      {React.Children.toArray(children).map((child, index) => (
        <li key={React.isValidElement(child) && child.key != null ? child.key : index} className={styles.item}>
          {child}
        </li>
      ))}
    </ul>
  )
)
ActionRowList.displayName = "ActionRowList"

export { ActionRow, ActionRowList }
