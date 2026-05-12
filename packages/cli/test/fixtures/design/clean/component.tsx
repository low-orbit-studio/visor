import React from "react"

export function CleanCard({ isActive }: { isActive: boolean }) {
  return (
    <button
      aria-pressed={isActive}
      className="card"
    >
      <span>Content</span>
    </button>
  )
}
