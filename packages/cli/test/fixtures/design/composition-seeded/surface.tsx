import React from "react"

// Three seeded violations, one surface:
//   1. an inline style={{}} object          → inline-style-object
//   2. a raw hex literal                    → hardcoded-hex
//   3. a local re-declaration of `stat-card`→ kit-element-redeclared
export function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: "12px" }}>
      <span className="label">{label}</span>
      <strong className="value" data-accent="#ff0044">
        {value}
      </strong>
    </div>
  )
}
