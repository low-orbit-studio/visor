import React from "react"

// `stat-card` and `card` are kit elements in taxonomy.json — this surface builds
// its own instead of composing the kit's.
export function StatCard({ label }: { label: string }) {
  return <div className="stat">{label}</div>
}

const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="card">{children}</div>
)

// Not a kit element — must not fire.
export function DashboardGrid() {
  return (
    <Card>
      <StatCard label="Revenue" />
    </Card>
  )
}

// PascalCase but not component-shaped — must not fire.
const Button = "button-ish"

export { Card, Button }
