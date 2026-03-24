import { render, screen, waitFor } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Toaster, toast } from "../toast"
import { checkA11y } from "../../../../test-utils/a11y"

describe("Toast", () => {
  it("Toaster renders", () => {
    render(<Toaster />)
    // Sonner renders a section element as its toaster container
    const toasterEl = document.querySelector("section[aria-label]") ?? document.querySelector("ol")
    expect(toasterEl).toBeTruthy()
  })

  it("toast function is exported and callable", () => {
    expect(typeof toast).toBe("function")
    expect(typeof toast.success).toBe("function")
    expect(typeof toast.error).toBe("function")
    expect(typeof toast.warning).toBe("function")
  })

  it("displays toast message", async () => {
    render(<Toaster />)
    toast("Hello World")
    await waitFor(() => {
      expect(screen.getByText("Hello World")).toBeInTheDocument()
    })
  })

  it("displays success toast", async () => {
    render(<Toaster />)
    toast.success("Operation succeeded")
    await waitFor(() => {
      expect(screen.getByText("Operation succeeded")).toBeInTheDocument()
    })
  })
})

describe("accessibility", () => {
  it("Toaster container has no WCAG 2.1 AA violations", async () => {
    const { container } = render(<Toaster />)
    await checkA11y(container)
  })
})
