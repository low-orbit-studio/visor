import { describe, expect, it } from "vitest"
import { render } from "@testing-library/react"
import { CalendarDots, Gear, Tray } from "@phosphor-icons/react"
import { axe } from "../../../../test-utils/axe"
import { BottomNav } from "../bottom-nav"

const items = [
  { label: "Edit", icon: CalendarDots, href: "/edit", active: true },
  { label: "Inbox", icon: Tray, href: "/inbox", mark: 3 },
  { label: "Settings", icon: Gear, group: "admin", onSelect: () => {} },
]

describe("BottomNav a11y", () => {
  it("has no axe violations with hidden labels", async () => {
    const { container } = render(<BottomNav aria-label="Workspace" items={items} fixed={false} />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it("has no axe violations with visible labels", async () => {
    const { container } = render(<BottomNav aria-label="Workspace" items={items} showLabels fixed={false} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
