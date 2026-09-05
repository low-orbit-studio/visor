import React from "react"

export function InlineStyled({ pct }: { pct: number }) {
  return (
    <section style={{ padding: "12px" }}>
      <span style={{ color: "red" }}>Styled outside the kit</span>
      <div style={{ width: `${pct}%` }} />
    </section>
  )
}
