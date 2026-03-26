import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect } from "vitest"
import {
  FullscreenOverlay,
  FullscreenOverlayTrigger,
  FullscreenOverlayContent,
} from "../fullscreen-overlay"
import { checkA11y } from "../../../../test-utils/a11y"

describe("FullscreenOverlay", () => {
  it("renders trigger without crashing", () => {
    render(
      <FullscreenOverlay>
        <FullscreenOverlayTrigger>Open</FullscreenOverlayTrigger>
        <FullscreenOverlayContent>Content</FullscreenOverlayContent>
      </FullscreenOverlay>
    )
    expect(screen.getByText("Open")).toBeInTheDocument()
  })

  it("opens on trigger click", async () => {
    const user = userEvent.setup()
    render(
      <FullscreenOverlay>
        <FullscreenOverlayTrigger>Open</FullscreenOverlayTrigger>
        <FullscreenOverlayContent>
          <p>Overlay content</p>
        </FullscreenOverlayContent>
      </FullscreenOverlay>
    )

    expect(screen.queryByText("Overlay content")).not.toBeInTheDocument()
    await user.click(screen.getByText("Open"))
    expect(screen.getByText("Overlay content")).toBeInTheDocument()
  })

  it("closes on close button click", async () => {
    const user = userEvent.setup()
    render(
      <FullscreenOverlay>
        <FullscreenOverlayTrigger>Open</FullscreenOverlayTrigger>
        <FullscreenOverlayContent>
          <p>Overlay content</p>
        </FullscreenOverlayContent>
      </FullscreenOverlay>
    )

    await user.click(screen.getByText("Open"))
    expect(screen.getByText("Overlay content")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Close" }))
    expect(screen.queryByText("Overlay content")).not.toBeInTheDocument()
  })

  it("closes on Escape key", async () => {
    const user = userEvent.setup()
    render(
      <FullscreenOverlay>
        <FullscreenOverlayTrigger>Open</FullscreenOverlayTrigger>
        <FullscreenOverlayContent>
          <p>Overlay content</p>
        </FullscreenOverlayContent>
      </FullscreenOverlay>
    )

    await user.click(screen.getByText("Open"))
    expect(screen.getByText("Overlay content")).toBeInTheDocument()

    await user.keyboard("{Escape}")
    expect(screen.queryByText("Overlay content")).not.toBeInTheDocument()
  })

  it("renders children in the overlay", async () => {
    const user = userEvent.setup()
    render(
      <FullscreenOverlay>
        <FullscreenOverlayTrigger>Open</FullscreenOverlayTrigger>
        <FullscreenOverlayContent>
          <div>
            <h2>Title</h2>
            <p>Description</p>
          </div>
        </FullscreenOverlayContent>
      </FullscreenOverlay>
    )

    await user.click(screen.getByText("Open"))
    expect(screen.getByText("Title")).toBeInTheDocument()
    expect(screen.getByText("Description")).toBeInTheDocument()
  })

  it("supports controlled open state", () => {
    render(
      <FullscreenOverlay open>
        <FullscreenOverlayTrigger>Open</FullscreenOverlayTrigger>
        <FullscreenOverlayContent>
          <p>Controlled content</p>
        </FullscreenOverlayContent>
      </FullscreenOverlay>
    )

    expect(screen.getByText("Controlled content")).toBeInTheDocument()
  })

  it("passes accessibility checks", async () => {
    const user = userEvent.setup()
    const { container } = render(
      <FullscreenOverlay>
        <FullscreenOverlayTrigger>Open</FullscreenOverlayTrigger>
        <FullscreenOverlayContent>
          <p>Accessible content</p>
        </FullscreenOverlayContent>
      </FullscreenOverlay>
    )

    await user.click(screen.getByText("Open"))
    await checkA11y(container)
  })
})
