import React from "react"
import styles from "./component.module.css"

// The three shapes the AST rule must NOT flag:
//   1. a CSS Module handle           — style={styles.foo}
//   2. a CSS-variable bridge         — style={{ "--x": token }}
//   3. a forwarded style object      — style={{ ...rest }}
export function NotStyledOutsideTheKit({
  accent,
  rest,
}: {
  accent: string
  rest: React.CSSProperties
}) {
  return (
    <section style={styles.section}>
      <span style={{ "--accent": accent } as React.CSSProperties} />
      <div style={{ ...rest }} />
      <p style={{ [accent]: accent } as React.CSSProperties} />
    </section>
  )
}
