import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { DeckProvider, useDeck } from "../deck-context"

function TestConsumer() {
  const { goTo, navigateTo } = useDeck()
  return (
    <div>
      <button onClick={() => goTo(1)}>Go To</button>
      <button onClick={() => navigateTo("slide-2")}>Navigate</button>
    </div>
  )
}

describe("DeckContext", () => {
  it("throws when useDeck is called outside DeckProvider", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    expect(() => render(<TestConsumer />)).toThrow(
      "useDeck must be used within <DeckLayout />"
    )
    consoleSpy.mockRestore()
  })

  it("provides goTo and navigateTo through context", () => {
    const goTo = vi.fn()
    const navigateTo = vi.fn()

    render(
      <DeckProvider value={{ goTo, navigateTo }}>
        <TestConsumer />
      </DeckProvider>
    )

    screen.getByText("Go To").click()
    expect(goTo).toHaveBeenCalledWith(1)

    screen.getByText("Navigate").click()
    expect(navigateTo).toHaveBeenCalledWith("slide-2")
  })
})
