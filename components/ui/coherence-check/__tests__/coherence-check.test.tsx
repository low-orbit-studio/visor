import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { CheckGroup, CheckRow } from "../coherence-check"
import { checkA11y } from "../../../../test-utils/a11y"

// ─── CheckGroup ──────────────────────────────────────────────────────────────

describe("CheckGroup", () => {
  it("renders the heading text", () => {
    render(<CheckGroup heading="Accessibility">Content</CheckGroup>)
    expect(screen.getByText("Accessibility")).toBeInTheDocument()
  })

  it("renders children", () => {
    render(
      <CheckGroup heading="Voice">
        <div>child content</div>
      </CheckGroup>
    )
    expect(screen.getByText("child content")).toBeInTheDocument()
  })

  it("applies data-slot attribute", () => {
    const { container } = render(
      <CheckGroup heading="Group">Content</CheckGroup>
    )
    expect(container.querySelector("[data-slot='check-group']")).toBeInTheDocument()
  })

  it("accepts a custom className", () => {
    const { container } = render(
      <CheckGroup heading="Group" className="custom-group">
        Content
      </CheckGroup>
    )
    expect(container.querySelector(".custom-group")).toBeInTheDocument()
  })

  it("forwards ref", () => {
    const ref = { current: null }
    render(<CheckGroup heading="Group" ref={ref}>Content</CheckGroup>)
    expect(ref.current).not.toBeNull()
  })
})

// ─── CheckRow states ─────────────────────────────────────────────────────────

describe("CheckRow — pass state", () => {
  it("renders with default pass state", () => {
    const { container } = render(
      <CheckRow title="Everything looks good" />
    )
    expect(container.querySelector("[data-state='pass']")).toBeInTheDocument()
  })

  it("renders explicit pass state", () => {
    const { container } = render(
      <CheckRow state="pass" title="Check passed" />
    )
    expect(container.querySelector("[data-state='pass']")).toBeInTheDocument()
  })

  it("renders title text", () => {
    render(<CheckRow state="pass" title="Primary colors clear AA" />)
    expect(screen.getByText("Primary colors clear AA")).toBeInTheDocument()
  })
})

describe("CheckRow — warn state", () => {
  it("renders warn state", () => {
    const { container } = render(
      <CheckRow state="warn" title="One string drifts from voice" />
    )
    expect(container.querySelector("[data-state='warn']")).toBeInTheDocument()
  })
})

describe("CheckRow — fail state", () => {
  it("renders fail state", () => {
    const { container } = render(
      <CheckRow state="fail" title="One pairing fails" />
    )
    expect(container.querySelector("[data-state='fail']")).toBeInTheDocument()
  })
})

// ─── CheckRow description ────────────────────────────────────────────────────

describe("CheckRow — description", () => {
  it("renders a string description", () => {
    render(
      <CheckRow
        state="pass"
        title="Check title"
        description="Body 7.1:1 — above target."
      />
    )
    expect(screen.getByText("Body 7.1:1 — above target.")).toBeInTheDocument()
  })

  it("renders a ReactNode description with inline code", () => {
    render(
      <CheckRow
        state="fail"
        title="Check title"
        description={
          <>
            <code>--text-tertiary</code> on <code>--surface-subtle</code> is 3.9:1
          </>
        }
      />
    )
    expect(screen.getByText("--text-tertiary")).toBeInTheDocument()
    expect(screen.getByText("--surface-subtle")).toBeInTheDocument()
  })

  it("omits description element when not provided", () => {
    const { container } = render(<CheckRow state="pass" title="Check title" />)
    expect(container.querySelector("[data-slot='check-row-body'] p")).not.toBeInTheDocument()
  })
})

// ─── CheckRow Fix action ─────────────────────────────────────────────────────

describe("CheckRow — Fix action", () => {
  it("renders the fix button when fixLabel is provided", () => {
    render(
      <CheckRow
        state="warn"
        title="One string drifts"
        fixLabel="Rewrite to voice"
      />
    )
    expect(screen.getByRole("button", { name: "Rewrite to voice" })).toBeInTheDocument()
  })

  it("does not render a fix button when fixLabel is omitted", () => {
    render(<CheckRow state="pass" title="All clear" />)
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })

  it("calls onFix when the fix button is clicked", async () => {
    const user = userEvent.setup()
    const handleFix = vi.fn()
    render(
      <CheckRow
        state="fail"
        title="Pairing fails"
        fixLabel="Suggest a fix"
        onFix={handleFix}
      />
    )
    await user.click(screen.getByRole("button", { name: "Suggest a fix" }))
    expect(handleFix).toHaveBeenCalledTimes(1)
  })

  it("fix button has type='button' to avoid form submission", () => {
    render(
      <CheckRow
        state="warn"
        title="Warning"
        fixLabel="Fix it"
      />
    )
    expect(screen.getByRole("button", { name: "Fix it" })).toHaveAttribute("type", "button")
  })

  it("applies data-slot to fix button", () => {
    const { container } = render(
      <CheckRow state="warn" title="Warning" fixLabel="Fix" />
    )
    expect(container.querySelector("[data-slot='check-row-fix']")).toBeInTheDocument()
  })
})

// ─── CheckRow general ────────────────────────────────────────────────────────

describe("CheckRow — general", () => {
  it("applies data-slot='check-row'", () => {
    const { container } = render(<CheckRow state="pass" title="Title" />)
    expect(container.querySelector("[data-slot='check-row']")).toBeInTheDocument()
  })

  it("forwards ref", () => {
    const ref = { current: null }
    render(<CheckRow state="pass" title="Title" ref={ref} />)
    expect(ref.current).not.toBeNull()
  })

  it("accepts a custom className", () => {
    const { container } = render(
      <CheckRow state="pass" title="Title" className="my-row" />
    )
    expect(container.querySelector(".my-row")).toBeInTheDocument()
  })
})

// ─── Compound usage ───────────────────────────────────────────────────────────

describe("CoherenceCheck compound usage", () => {
  it("renders a full check group with multiple rows", () => {
    render(
      <CheckGroup heading="Accessibility — WCAG 2.1 AA">
        <CheckRow
          state="fail"
          title="One pairing fails on small text"
          description={<><code>--text-tertiary</code> on <code>--surface-subtle</code> is 3.9:1</>}
          fixLabel="Suggest a fix"
        />
        <CheckRow
          state="pass"
          title="Primary, text, and focus rings clear AA"
          description="All above target on both light and dark."
        />
      </CheckGroup>
    )
    expect(screen.getByText("Accessibility — WCAG 2.1 AA")).toBeInTheDocument()
    expect(screen.getByText("One pairing fails on small text")).toBeInTheDocument()
    expect(screen.getByText("Primary, text, and focus rings clear AA")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Suggest a fix" })).toBeInTheDocument()
  })
})

// ─── Accessibility ────────────────────────────────────────────────────────────

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations (pass row)", async () => {
    const { container } = render(
      <CheckGroup heading="Derivation">
        <CheckRow
          state="pass"
          title="Every pillar governs something real"
          description="No dead pillars."
        />
      </CheckGroup>
    )
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (warn row with fix)", async () => {
    const { container } = render(
      <CheckGroup heading="Voice">
        <CheckRow
          state="warn"
          title="One string drifts from voice"
          description="Try a plainspoken verb."
          fixLabel="Rewrite to voice"
          onFix={() => {}}
        />
      </CheckGroup>
    )
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (fail row with fix)", async () => {
    const { container } = render(
      <CheckGroup heading="Accessibility">
        <CheckRow
          state="fail"
          title="One pairing fails on small text"
          description={<><code>--text-tertiary</code> on <code>--surface-subtle</code> is below 4.5:1</>}
          fixLabel="Suggest a fix"
          onFix={() => {}}
        />
      </CheckGroup>
    )
    await checkA11y(container)
  })
})
