import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { AvatarStack } from "../avatar-stack"
import { checkA11y } from "../../../test-utils/a11y"

describe("AvatarStack", () => {
  it("renders N avatars when total === avatars.length and <= max", () => {
    render(
      <AvatarStack
        avatars={[undefined, undefined, undefined]}
        total={3}
      />,
    )
    const items = screen.getAllByText("·")
    expect(items).toHaveLength(3)
  })

  it("renders +N overflow when total exceeds max", () => {
    render(
      <AvatarStack
        avatars={[undefined, undefined, undefined, undefined, undefined, undefined]}
        total={12}
        max={6}
      />,
    )
    expect(screen.getAllByText("·")).toHaveLength(6)
    expect(screen.getByText("+6")).toBeInTheDocument()
  })

  it("renders +N overflow when total exceeds avatars.length (server-truncated)", () => {
    render(
      <AvatarStack
        avatars={[undefined, undefined, undefined]}
        total={12}
      />,
    )
    expect(screen.getAllByText("·")).toHaveLength(3)
    expect(screen.getByText("+9")).toBeInTheDocument()
  })

  it("renders only the overflow indicator when avatars is empty and total > 0", () => {
    render(<AvatarStack avatars={[]} total={4} />)
    expect(screen.queryByText("·")).not.toBeInTheDocument()
    expect(screen.getByText("+4")).toBeInTheDocument()
  })

  it("does not render the overflow indicator when total matches visible count", () => {
    render(
      <AvatarStack
        avatars={[undefined, undefined]}
        total={2}
      />,
    )
    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument()
  })

  it("respects the max prop override", () => {
    render(
      <AvatarStack
        avatars={[undefined, undefined, undefined, undefined, undefined]}
        total={5}
        max={2}
      />,
    )
    expect(screen.getAllByText("·")).toHaveLength(2)
    expect(screen.getByText("+3")).toBeInTheDocument()
  })

  it("uses role=img with the default aria-label", () => {
    render(<AvatarStack avatars={[undefined]} total={7} />)
    expect(screen.getByRole("img", { name: "7 members" })).toBeInTheDocument()
  })

  it("respects a custom label override", () => {
    render(
      <AvatarStack
        avatars={[undefined]}
        total={7}
        label="7 active collaborators"
      />,
    )
    expect(
      screen.getByRole("img", { name: "7 active collaborators" }),
    ).toBeInTheDocument()
  })

  it("applies data-size sm by default", () => {
    render(<AvatarStack avatars={[undefined]} total={1} />)
    expect(screen.getByRole("img")).toHaveAttribute("data-size", "sm")
  })

  it("propagates data-size to the root and avatars when overridden", () => {
    render(<AvatarStack avatars={[undefined]} total={1} size="lg" />)
    expect(screen.getByRole("img")).toHaveAttribute("data-size", "lg")
    const avatar = screen.getByText("·").closest("[data-slot='avatar']")
    expect(avatar).toHaveAttribute("data-size", "lg")
  })

  it("marks each rendered avatar with data-stack-item", () => {
    const { container } = render(
      <AvatarStack avatars={[undefined, undefined]} total={2} />,
    )
    expect(container.querySelectorAll("[data-stack-item]")).toHaveLength(2)
    expect(container.querySelector("[data-stack-overflow]")).toBeNull()
  })

  it("marks the overflow slot with data-stack-overflow", () => {
    const { container } = render(
      <AvatarStack avatars={[undefined, undefined]} total={5} />,
    )
    expect(container.querySelectorAll("[data-stack-item]")).toHaveLength(2)
    expect(container.querySelector("[data-stack-overflow]")).toBeInTheDocument()
  })

  it("forwards ref to the root element", () => {
    const ref = { current: null as HTMLDivElement | null }
    render(<AvatarStack ref={ref} avatars={[undefined]} total={1} />)
    expect(ref.current).not.toBeNull()
    expect(ref.current).toHaveAttribute("data-slot", "avatar-stack")
  })
})

describe("AvatarStack accessibility", () => {
  it("has no WCAG 2.1 AA violations (default size)", async () => {
    const { container } = render(
      <AvatarStack
        avatars={[undefined, undefined, undefined]}
        total={12}
        max={6}
      />,
    )
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (lg size, no overflow)", async () => {
    const { container } = render(
      <AvatarStack
        avatars={[undefined, undefined]}
        total={2}
        size="lg"
      />,
    )
    await checkA11y(container)
  })
})
