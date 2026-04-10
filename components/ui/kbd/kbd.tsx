import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../../lib/utils"
import styles from "./kbd.module.css"

/**
 * CVA variants for the visual chrome of a single <kbd> element.
 * In the multi-key case we apply these classes to each inner <kbd> rather
 * than to the wrapper, so each key gets its own raised "key cap" rendering
 * and the wrapper stays a layout-only element.
 */
const kbdVariants = cva(styles.base, {
  variants: {
    size: {
      sm: styles.sizeSm,
      md: styles.sizeMd,
      lg: styles.sizeLg,
    },
    variant: {
      default: styles.variantDefault,
      outline: styles.variantOutline,
    },
  },
  defaultVariants: {
    size: "md",
    variant: "default",
  },
})

export interface KbdProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "children">,
    VariantProps<typeof kbdVariants> {
  /**
   * If provided, renders each key as a separate <kbd> element joined by
   * `separator`. Mutually exclusive with `children` — if both passed, `keys`
   * wins.
   */
  keys?: string[]
  /**
   * Separator rendered between keys (not wrapped in <kbd>). Defaults to "+".
   */
  separator?: React.ReactNode
  /** Single-key content. Ignored when `keys` is provided. */
  children?: React.ReactNode
}

/**
 * Kbd — tiny semantic primitive for rendering keyboard shortcuts.
 *
 * Renders the native <kbd> element so screen readers and user agents announce
 * the content as keyboard input. For multi-key sequences, each key is rendered
 * as its own <kbd> joined by an aria-hidden separator; the surrounding wrapper
 * is an unstyled <span> that only handles layout.
 */
const Kbd = React.forwardRef<HTMLElement, KbdProps>(
  (
    { className, size, variant, keys, separator = "+", children, ...props },
    ref
  ) => {
    if (keys && keys.length > 0) {
      // Multi-key: wrapper is layout-only; each <kbd> wears the variant chrome.
      return (
        <span
          ref={ref as React.Ref<HTMLSpanElement>}
          data-slot="kbd-group"
          data-variant={variant ?? "default"}
          data-size={size ?? "md"}
          className={cn(styles.group, className)}
          {...props}
        >
          {keys.map((key, index) => (
            <React.Fragment key={`${key}-${index}`}>
              {index > 0 ? (
                <span
                  data-slot="kbd-separator"
                  className={styles.separator}
                  aria-hidden="true"
                >
                  {separator}
                </span>
              ) : null}
              <kbd
                data-slot="kbd"
                className={cn(kbdVariants({ size, variant }))}
              >
                {key}
              </kbd>
            </React.Fragment>
          ))}
        </span>
      )
    }

    return (
      <kbd
        ref={ref}
        data-slot="kbd"
        data-variant={variant ?? "default"}
        data-size={size ?? "md"}
        className={cn(kbdVariants({ size, variant }), className)}
        {...props}
      >
        {children}
      </kbd>
    )
  }
)
Kbd.displayName = "Kbd"

export { Kbd, kbdVariants }
