import * as React from "react"
import { cn } from "../../../lib/utils"
import styles from "./section-intro.module.css"

type HeadingElement = "h1" | "h2" | "h3"

export interface SectionIntroProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
  /**
   * Short mono uppercase eyebrow rendered above the heading.
   * Reads its color from `--section-intro-eyebrow-color`, which defaults to
   * `--accent-default`. Consumers can override this at any ancestor level so
   * the color tracks a live-rewritten CSS var (e.g. a keyed brand accent).
   */
  eyebrow?: React.ReactNode
  /** Display-font heading — the main marketing statement. */
  heading: React.ReactNode
  /** Optional supporting paragraph rendered beneath the heading. */
  lede?: React.ReactNode
  /**
   * Text alignment for all three slots.
   * @default "left"
   */
  align?: "left" | "center"
  /**
   * Heading level for the `heading` slot.
   * @default "h2"
   */
  headingAs?: HeadingElement
  /** Root element tag. Defaults to `header`. */
  as?: "header" | "div" | "section"
}

const SectionIntro = React.forwardRef<HTMLElement, SectionIntroProps>(
  (
    {
      className,
      eyebrow,
      heading,
      lede,
      align = "left",
      headingAs = "h2",
      as = "header",
      ...props
    },
    ref
  ) => {
    const Root = as as React.ElementType
    const Heading = headingAs as React.ElementType

    return (
      <Root
        ref={ref}
        data-slot="section-intro"
        data-align={align}
        className={cn(styles.root, className)}
        {...props}
      >
        {eyebrow ? (
          <p data-slot="section-intro-eyebrow" className={styles.eyebrow}>
            {eyebrow}
          </p>
        ) : null}
        <Heading
          data-slot="section-intro-heading"
          className={styles.heading}
        >
          {heading}
        </Heading>
        {lede ? (
          <p data-slot="section-intro-lede" className={styles.lede}>
            {lede}
          </p>
        ) : null}
      </Root>
    )
  }
)
SectionIntro.displayName = "SectionIntro"

export { SectionIntro }
