import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { checkA11y } from "../../../../test-utils/a11y"
import { TagInput } from "../tag-input"

describe("TagInput", () => {
  it("renders with placeholder", () => {
    render(<TagInput placeholder="Add tag..." />)
    expect(screen.getByPlaceholderText("Add tag...")).toBeInTheDocument()
  })

  it("adds tag on Enter", async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<TagInput onChange={handleChange} />)

    await user.type(screen.getByLabelText("Add tag"), "react")
    await user.keyboard("{Enter}")

    expect(handleChange).toHaveBeenCalledWith(["react"])
    expect(screen.getByText("react")).toBeInTheDocument()
  })

  it("adds tag on comma", async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<TagInput onChange={handleChange} />)

    await user.type(screen.getByLabelText("Add tag"), "react,")
    expect(handleChange).toHaveBeenCalledWith(["react"])
  })

  it("removes tag when X button is clicked", async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<TagInput defaultValue={["react", "vue"]} onChange={handleChange} />)

    expect(screen.getByText("react")).toBeInTheDocument()
    await user.click(screen.getByLabelText("Remove react"))

    expect(handleChange).toHaveBeenCalledWith(["vue"])
  })

  it("removes last tag on Backspace when input is empty", async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<TagInput defaultValue={["react", "vue"]} onChange={handleChange} />)

    await user.click(screen.getByLabelText("Add tag"))
    await user.keyboard("{Backspace}")

    expect(handleChange).toHaveBeenCalledWith(["react"])
  })

  it("prevents duplicate tags (case-insensitive)", async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<TagInput defaultValue={["React"]} onChange={handleChange} />)

    await user.type(screen.getByLabelText("Add tag"), "react")
    await user.keyboard("{Enter}")

    // Should not have been called since it's a duplicate
    expect(handleChange).not.toHaveBeenCalled()
  })

  it("respects max limit", async () => {
    const user = userEvent.setup()
    render(<TagInput defaultValue={["a", "b"]} max={2} />)

    // Input should not be rendered when at max
    expect(screen.queryByLabelText("Add tag")).not.toBeInTheDocument()
  })

  it("renders default values", () => {
    render(<TagInput defaultValue={["react", "vue", "svelte"]} />)
    expect(screen.getByText("react")).toBeInTheDocument()
    expect(screen.getByText("vue")).toBeInTheDocument()
    expect(screen.getByText("svelte")).toBeInTheDocument()
  })

  it("forwards ref correctly", () => {
    const ref = { current: null } as React.RefObject<HTMLDivElement | null>
    render(<TagInput ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })

  it("renders data-slot attribute", () => {
    render(<TagInput />)
    const wrapper = screen.getByLabelText("Add tag").closest("[data-slot='tag-input']")
    expect(wrapper).toBeInTheDocument()
  })

  it("adds tag on blur if input has value", async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<TagInput onChange={handleChange} />)

    await user.type(screen.getByLabelText("Add tag"), "react")
    await user.tab()

    expect(handleChange).toHaveBeenCalledWith(["react"])
  })
})

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations", async () => {
    const { container } = render(
      <TagInput defaultValue={["react", "vue"]} />
    )
    await checkA11y(container)
  })
})
