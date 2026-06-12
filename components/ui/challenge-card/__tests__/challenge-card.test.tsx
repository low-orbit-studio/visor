import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import {
  ChallengeCard,
  ChallengeCardHeader,
  ChallengeCardBody,
  ChallengeCardActions,
  ChallengeCardAction,
  ChallengeCardGate,
} from "../challenge-card"

describe("ChallengeCard", () => {
  it("renders the root with data-slot", () => {
    const { container } = render(<ChallengeCard />)
    expect(container.querySelector('[data-slot="challenge-card"]')).not.toBeNull()
  })

  it("renders with role=alert", () => {
    render(<ChallengeCard><p>Challenge</p></ChallengeCard>)
    expect(screen.getByRole("alert")).not.toBeNull()
  })

  it("forwards ref to the root div", () => {
    const ref = { current: null as HTMLDivElement | null }
    render(<ChallengeCard ref={ref} />)
    expect(ref.current).not.toBeNull()
    expect(ref.current?.tagName).toBe("DIV")
  })

  it("forwards className to the root", () => {
    const { container } = render(<ChallengeCard className="my-custom" />)
    const root = container.querySelector('[data-slot="challenge-card"]')
    expect(root).toHaveClass("my-custom")
  })
})

describe("ChallengeCardHeader", () => {
  it("renders children as the title", () => {
    render(<ChallengeCardHeader>Is it actually only?</ChallengeCardHeader>)
    expect(screen.getByText("Is it actually only?")).toBeInTheDocument()
  })

  it("renders with data-slot", () => {
    const { container } = render(<ChallengeCardHeader>Title</ChallengeCardHeader>)
    expect(container.querySelector('[data-slot="challenge-card-header"]')).not.toBeNull()
  })

  it("renders a default Flag icon", () => {
    const { container } = render(<ChallengeCardHeader>Title</ChallengeCardHeader>)
    // Default icon renders inside headerIcon span
    const iconSpan = container.querySelector('[aria-hidden="true"]')
    expect(iconSpan).not.toBeNull()
  })

  it("renders a custom icon when provided", () => {
    const { container } = render(
      <ChallengeCardHeader icon={<span data-testid="custom-icon" />}>Title</ChallengeCardHeader>
    )
    expect(screen.getByTestId("custom-icon")).toBeInTheDocument()
  })

  it("suppresses the icon when icon=null", () => {
    const { container } = render(
      <ChallengeCardHeader icon={null}>Title</ChallengeCardHeader>
    )
    const iconSpan = container.querySelector('[data-slot="challenge-card-header"] [aria-hidden="true"]')
    expect(iconSpan).toBeNull()
  })
})

describe("ChallengeCardBody", () => {
  it("renders children as the body text", () => {
    render(<ChallengeCardBody>The word "only" invites rebuttal.</ChallengeCardBody>)
    expect(screen.getByText('The word "only" invites rebuttal.')).toBeInTheDocument()
  })

  it("renders with data-slot", () => {
    const { container } = render(<ChallengeCardBody>Body</ChallengeCardBody>)
    expect(container.querySelector('[data-slot="challenge-card-body"]')).not.toBeNull()
  })
})

describe("ChallengeCardActions", () => {
  it("renders children", () => {
    render(
      <ChallengeCardActions>
        <ChallengeCardAction>Accept</ChallengeCardAction>
      </ChallengeCardActions>
    )
    expect(screen.getByText("Accept")).toBeInTheDocument()
  })

  it("renders with data-slot", () => {
    const { container } = render(<ChallengeCardActions />)
    expect(container.querySelector('[data-slot="challenge-card-actions"]')).not.toBeNull()
  })
})

describe("ChallengeCardAction", () => {
  it("renders as a button", () => {
    render(<ChallengeCardAction>Accept</ChallengeCardAction>)
    expect(screen.getByRole("button", { name: "Accept" })).toBeInTheDocument()
  })

  it("renders with data-slot", () => {
    const { container } = render(<ChallengeCardAction>Accept</ChallengeCardAction>)
    expect(container.querySelector('[data-slot="challenge-card-action"]')).not.toBeNull()
  })

  it("defaults to variant=primary", () => {
    const { container } = render(<ChallengeCardAction>Accept</ChallengeCardAction>)
    const btn = container.querySelector('[data-variant="primary"]')
    expect(btn).not.toBeNull()
  })

  it("renders ghost variant", () => {
    const { container } = render(
      <ChallengeCardAction variant="ghost">Dismiss</ChallengeCardAction>
    )
    const btn = container.querySelector('[data-variant="ghost"]')
    expect(btn).not.toBeNull()
  })

  it("fires onClick when clicked", () => {
    const handler = vi.fn()
    render(<ChallengeCardAction onClick={handler}>Accept</ChallengeCardAction>)
    fireEvent.click(screen.getByRole("button", { name: "Accept" }))
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it("renders a default Check icon for primary variant", () => {
    const { container } = render(
      <ChallengeCardAction variant="primary">Accept</ChallengeCardAction>
    )
    // Icon wrapper is present (aria-hidden span inside button)
    const iconSpan = container.querySelector('[data-slot="challenge-card-action"] [aria-hidden="true"]')
    expect(iconSpan).not.toBeNull()
  })

  it("renders no default icon for ghost variant", () => {
    const { container } = render(
      <ChallengeCardAction variant="ghost">Decline</ChallengeCardAction>
    )
    // Ghost has no default icon
    const iconSpan = container.querySelector('[data-slot="challenge-card-action"] [aria-hidden="true"]')
    expect(iconSpan).toBeNull()
  })

  it("renders a custom icon when provided", () => {
    render(
      <ChallengeCardAction icon={<span data-testid="custom-icon" />}>Accept</ChallengeCardAction>
    )
    expect(screen.getByTestId("custom-icon")).toBeInTheDocument()
  })

  it("suppresses the icon when icon=null", () => {
    const { container } = render(
      <ChallengeCardAction icon={null}>Accept</ChallengeCardAction>
    )
    const iconSpan = container.querySelector('[data-slot="challenge-card-action"] [aria-hidden="true"]')
    expect(iconSpan).toBeNull()
  })

  it("does not fire onClick when disabled", () => {
    const handler = vi.fn()
    render(<ChallengeCardAction disabled onClick={handler}>Accept</ChallengeCardAction>)
    fireEvent.click(screen.getByRole("button", { name: "Accept" }))
    expect(handler).not.toHaveBeenCalled()
  })
})

describe("ChallengeCardGate", () => {
  it("renders default gate text", () => {
    render(<ChallengeCardGate />)
    expect(screen.getByText("You hold the gate")).toBeInTheDocument()
  })

  it("renders with data-slot", () => {
    const { container } = render(<ChallengeCardGate />)
    expect(container.querySelector('[data-slot="challenge-card-gate"]')).not.toBeNull()
  })

  it("renders custom children when provided", () => {
    render(<ChallengeCardGate>Your call</ChallengeCardGate>)
    expect(screen.getByText("Your call")).toBeInTheDocument()
    expect(screen.queryByText("You hold the gate")).toBeNull()
  })

  it("renders a lock icon", () => {
    const { container } = render(<ChallengeCardGate />)
    const iconSpan = container.querySelector('[data-slot="challenge-card-gate"] [aria-hidden="true"]')
    expect(iconSpan).not.toBeNull()
  })

  it("forwards ref to the root span", () => {
    const ref = { current: null as HTMLSpanElement | null }
    render(<ChallengeCardGate ref={ref} />)
    expect(ref.current).not.toBeNull()
    expect(ref.current?.tagName).toBe("SPAN")
  })
})

describe("ChallengeCard full composition", () => {
  it("renders a complete challenge example", () => {
    render(
      <ChallengeCard>
        <ChallengeCardHeader>Is it actually only?</ChallengeCardHeader>
        <ChallengeCardBody>
          The word "only" in this claim is absolute — it invites factual rebuttal.
        </ChallengeCardBody>
        <ChallengeCardActions>
          <ChallengeCardAction variant="primary">Use the sharper version</ChallengeCardAction>
          <ChallengeCardAction variant="ghost">I'll rewrite it</ChallengeCardAction>
          <ChallengeCardGate />
        </ChallengeCardActions>
      </ChallengeCard>
    )

    expect(screen.getByText("Is it actually only?")).toBeInTheDocument()
    expect(screen.getByText(/invites factual rebuttal/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Use the sharper version/ })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /I'll rewrite it/ })).toBeInTheDocument()
    expect(screen.getByText("You hold the gate")).toBeInTheDocument()
  })
})
