import * as React from "react"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../sheet"
import { checkA11y } from "../../../../test-utils/a11y"

function Scoped({ side, onOpenChange, onOutside }: {
  side?: "top" | "right" | "bottom" | "left"
  onOpenChange?: (o: boolean) => void
  onOutside?: () => void
}) {
  const [pane, setPane] = React.useState<HTMLElement | null>(null)
  return (
    <div>
      <button type="button" onClick={onOutside}>Top bar</button>
      <section ref={setPane} data-testid="pane">
        <button type="button">Editor field</button>
      </section>
      <Sheet open container={pane} onOpenChange={onOpenChange}>
        <SheetContent side={side}>
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
            <SheetDescription>Narrow results.</SheetDescription>
          </SheetHeader>
          <input aria-label="Query" />
        </SheetContent>
      </Sheet>
    </div>
  )
}

describe("Sheet container (scoped)", () => {
  it("portals into the container and covers only it", async () => {
    render(<Scoped />)
    const pane = screen.getByTestId("pane")
    expect(await within(pane).findByRole("dialog")).toBeInTheDocument()
    expect(pane.querySelector('[data-slot="sheet-overlay"]')).not.toBeNull()
    expect(document.body.querySelector(':scope > [data-slot="sheet-overlay"]')).toBeNull()
  })

  it("leaves content outside the container interactive", async () => {
    const onOutside = vi.fn()
    const onOpenChange = vi.fn()
    render(<Scoped onOutside={onOutside} onOpenChange={onOpenChange} />)
    await screen.findByRole("dialog")
    const bar = screen.getByRole("button", { name: "Top bar" })
    expect(bar.closest("[aria-hidden]")).toBeNull()
    expect(bar.closest("[inert]")).toBeNull()
    expect(document.body.style.pointerEvents).not.toBe("none")
    await userEvent.click(bar)
    expect(onOutside).toHaveBeenCalledOnce()
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it("makes only the container's other children inert", async () => {
    render(<Scoped />)
    await screen.findByRole("dialog")
    expect(screen.getByRole("button", { name: "Editor field" }).closest("[inert]")).not.toBeNull()
    expect(screen.getByRole("button", { name: "Top bar" }).closest("[inert]")).toBeNull()
  })

  it("traps Tab focus inside the panel and closes on Escape", async () => {
    const onOpenChange = vi.fn()
    render(<Scoped side="bottom" onOpenChange={onOpenChange} />)
    const dialog = await screen.findByRole("dialog")
    for (let i = 0; i < 6; i++) {
      await userEvent.tab()
      expect(dialog.contains(document.activeElement)).toBe(true)
    }
    await userEvent.keyboard("{Escape}")
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("dismisses from the scrim only", async () => {
    const onOpenChange = vi.fn()
    render(<Scoped onOpenChange={onOpenChange} />)
    await screen.findByRole("dialog")
    await userEvent.click(screen.getByTestId("pane").querySelector('[data-slot="sheet-overlay"]') as HTMLElement)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("has no WCAG 2.1 AA violations", async () => {
    render(<Scoped side="bottom" />)
    await screen.findByRole("dialog")
    await checkA11y(screen.getByTestId("pane"))
  })
})
