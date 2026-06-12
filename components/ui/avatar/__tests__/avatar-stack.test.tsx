import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { AvatarStack } from "../avatar"
import type { AvatarStackItem } from "../avatar"
import { checkA11y } from "../../../../test-utils/a11y"

describe("AvatarStack — string[] / undefined (existing API, zero-regression)", () => {
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

describe("AvatarStack — AvatarStackItem rich form", () => {
  it("renders initials for an object item without src", () => {
    render(
      <AvatarStack
        avatars={[{ initials: "AR", alt: "Alex Rivera" }]}
        total={1}
      />,
    )
    expect(screen.getByText("AR")).toBeInTheDocument()
  })

  it("renders an Avatar with data-stack-item when src is provided on an object item", () => {
    // Radix AvatarImage defers rendering until the image loads (never in jsdom);
    // verify the Avatar disc itself is present with the correct data attribute.
    const { container } = render(
      <AvatarStack
        avatars={[{ src: "https://example.com/a.jpg", alt: "Jane Doe" }]}
        total={1}
      />,
    )
    expect(container.querySelectorAll("[data-stack-item]")).toHaveLength(1)
  })

  it("applies per-item style to the Avatar root", () => {
    const gradientStyle: React.CSSProperties = {
      background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
      color: "#fff",
    }
    const { container } = render(
      <AvatarStack
        avatars={[{ initials: "AR", style: gradientStyle, alt: "Alex Rivera" }]}
        total={1}
      />,
    )
    const avatarRoot = container.querySelector("[data-stack-item]")
    expect(avatarRoot).toHaveStyle({
      background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
      color: "#fff",
    })
  })

  it("renders placeholder disc for object item with no initials and no src", () => {
    render(
      <AvatarStack
        avatars={[{ alt: "Unknown" }]}
        total={1}
      />,
    )
    expect(screen.getByText("·")).toBeInTheDocument()
  })

  it("mixes string and AvatarStackItem entries in the same array", () => {
    const items: (string | undefined | AvatarStackItem)[] = [
      "https://example.com/img.jpg",
      undefined,
      { initials: "MK", alt: "Morgan Kim" },
    ]
    render(<AvatarStack avatars={items} total={3} />)
    expect(screen.getByText("·")).toBeInTheDocument()
    expect(screen.getByText("MK")).toBeInTheDocument()
  })
})

describe("AvatarStack — overflowCount prop", () => {
  it("uses explicit overflowCount when provided", () => {
    render(
      <AvatarStack
        avatars={[undefined, undefined]}
        total={2}
        overflowCount={99}
      />,
    )
    expect(screen.getByText("+99")).toBeInTheDocument()
  })

  it("overrides the derived +N with explicit overflowCount=0 (no chip)", () => {
    render(
      <AvatarStack
        avatars={[undefined]}
        total={10}
        overflowCount={0}
      />,
    )
    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument()
  })

  it("falls back to derived overflow when overflowCount is omitted", () => {
    render(
      <AvatarStack
        avatars={[undefined, undefined, undefined]}
        total={10}
      />,
    )
    expect(screen.getByText("+7")).toBeInTheDocument()
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

  it("has no WCAG 2.1 AA violations (rich item form)", async () => {
    const { container } = render(
      <AvatarStack
        avatars={[
          { initials: "AR", style: { background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff" }, alt: "Alex Rivera" },
          { initials: "MK", alt: "Morgan Kim" },
        ]}
        total={5}
        max={2}
      />,
    )
    await checkA11y(container)
  })
})
