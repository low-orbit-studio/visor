import { useState } from "react"

export function BadHover() {
  const [isHovered, setIsHovered] = useState(false)
  return (
    <button
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ background: isHovered ? "blue" : "gray" }}
    >
      Hover me
    </button>
  )
}
