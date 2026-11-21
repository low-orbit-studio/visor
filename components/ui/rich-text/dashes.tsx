import { Fragment, type ReactNode } from "react"
import styles from "./rich-text.module.css"

/** Satoshi's en dash runs as long as an em dash; this draws each one at en-dash width. Text without one comes back as is. */
export function dashes(text: string): ReactNode {
  if (!text.includes("–")) return text
  return text.split("–").map((part, i) => (
    <Fragment key={i}>
      {i ? <span className={styles.nd}>–</span> : null}
      {part}
    </Fragment>
  ))
}
