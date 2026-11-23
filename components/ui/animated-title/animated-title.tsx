import * as React from "react"
import { cn } from "../../../lib/utils"
import styles from "./animated-title.module.css"

export type AnimatedTitleAnimation = "rise" | "blur" | "weight"

export type AnimatedTitleElement = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span"

export interface AnimatedTitleProps extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
  /** The title. Split into words on single spaces. */
  text: string
  /** The element to render. Default `h2`. */
  as?: AnimatedTitleElement
  /** How each word arrives: `rise` out of a mask, `blur` up and into focus, or `weight` from light to settled. Default `blur`. */
  animation?: AnimatedTitleAnimation
  /** Draws each word (for example, swapping hyphens for dashes). Default: the word as is. */
  format?: (word: string) => React.ReactNode
  /** `false` holds every word on its first frame. Default `true`. Replay by changing the component's `key`. */
  play?: boolean
  /** Milliseconds before the first word starts. Default 0. */
  delay?: number
}

/**
 * A title drawn word by word in CSS: word i starts at `delay + i × stagger`.
 * Screen readers read the plain `text` once; the animated words are aria-hidden.
 */
const AnimatedTitle = React.forwardRef<HTMLElement, AnimatedTitleProps>(
  ({ text, as: Tag = "h2", animation = "blur", format, play = true, delay, className, style, ...props }, ref) => {
    const words = text.split(" ")
    const rootStyle =
      delay === undefined ? style : ({ "--animated-title-delay": `${delay}ms`, ...style } as React.CSSProperties)

    return (
      <Tag
        ref={ref as React.Ref<HTMLHeadingElement>}
        data-slot="animated-title"
        data-animation={animation}
        data-play={play ? undefined : "false"}
        className={cn(styles.root, styles[animation], className)}
        style={rootStyle}
        {...props}
      >
        <span className={styles.srOnly}>{text}</span>
        <span aria-hidden="true" data-slot="animated-title-words">
          {words.map((word, i) => (
            <React.Fragment key={i}>
              {/* The space sits outside the inline-block, which would trim it. */}
              <span className={animation === "rise" ? styles.wordMask : styles.word}>
                <span
                  className={styles.wordInner}
                  data-slot="animated-title-word"
                  style={{ "--i": i } as React.CSSProperties}
                >
                  {format ? format(word) : word}
                </span>
              </span>
              {i < words.length - 1 ? " " : null}
            </React.Fragment>
          ))}
        </span>
      </Tag>
    )
  }
)
AnimatedTitle.displayName = "AnimatedTitle"

export { AnimatedTitle }
