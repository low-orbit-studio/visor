import * as React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { DocNav, type DocEntry } from "../doc-nav"
import { checkA11y } from "../../../../test-utils/a11y"

// A multi-product fixture: a Shared set (pinned), two product groups (Artist,
// Pro) run as an accordion, plus two slot-less/group-less docs that fall into
// the Appendix. One Shared entry is a static `.html` doc, one Artist entry is a
// clean route — exercising active-state for both.
const multiDocs: DocEntry[] = [
  { order: 1, label: "Charter", href: "/docs/charter.html", kind: "local-html", group: "Shared" },
  { order: 6, label: "Data", href: "/docs/data.html", kind: "local-html", group: "Shared" },
  { order: 2, label: "Journeys", href: "/docs/artist/journeys", kind: "route", scope: ["artist"], group: "Artist" },
  { order: 3, label: "Screens", href: "/docs/artist/screens", kind: "route", scope: ["artist"], group: "Artist" },
  { order: 2, label: "Pro Journeys", href: "/docs/pro/journeys", kind: "route", scope: ["pro"], group: "Pro" },
  { order: 5, label: "Pro States", href: "/docs/pro/states", kind: "route", scope: ["pro"], group: "Pro" },
  { order: 11, label: "Q3 Audit", href: "/docs/q3-audit.html", kind: "local-html" },
  { order: 12, label: "Runbook", href: "https://example.com/runbook", kind: "external" },
]

describe("DocNav — structure", () => {
  it("renders peer groups from the manifest slice", () => {
    render(<DocNav docs={multiDocs} currentPath="/docs/charter.html" activeProduct="artist" />)
    expect(screen.getByText("Shared")).toBeInTheDocument()
    expect(screen.getByText("Artist")).toBeInTheDocument()
    expect(screen.getByText("Pro")).toBeInTheDocument()
    expect(screen.getByText("Appendix")).toBeInTheDocument()
  })

  it("exposes a labelled nav landmark with data-slot", () => {
    render(
      <DocNav docs={multiDocs} currentPath="/docs/charter.html" data-testid="nav" />
    )
    const nav = screen.getByTestId("nav")
    expect(nav).toHaveAttribute("data-slot", "doc-nav")
    expect(nav).toHaveAttribute("aria-label", "Documentation")
  })

  it("auto-hides groups with no docs in the slice", () => {
    render(<DocNav docs={multiDocs} currentPath="/docs/charter.html" activeProduct="artist" />)
    // No entry is scoped to "marketing", so no such group renders.
    expect(screen.queryByText("Marketing")).not.toBeInTheDocument()
  })
})

describe("DocNav — active state", () => {
  it("resolves the active pill for a clean route href", () => {
    render(<DocNav docs={multiDocs} currentPath="/docs/artist/screens" activeProduct="artist" />)
    const active = screen.getByRole("link", { name: /Screens/ })
    expect(active).toHaveAttribute("aria-current", "page")
    expect(active).toHaveAttribute("data-active", "true")
  })

  it("resolves the active pill for a static .html href", () => {
    render(<DocNav docs={multiDocs} currentPath="/docs/charter.html" activeProduct="artist" />)
    const active = screen.getByRole("link", { name: /Charter/ })
    expect(active).toHaveAttribute("aria-current", "page")
  })

  it("auto-expands the group holding the active doc", () => {
    // currentPath is a Pro doc even though the open accordion product is Artist;
    // the active doc's group is opened regardless so the current pill is visible.
    render(<DocNav docs={multiDocs} currentPath="/docs/pro/states" activeProduct="artist" />)
    expect(screen.getByRole("link", { name: /Pro States/ })).toBeInTheDocument()
  })

  it("ignores query + hash when matching the active pill", () => {
    render(
      <DocNav docs={multiDocs} currentPath="/docs/artist/screens?ref=nav#top" activeProduct="artist" />
    )
    expect(screen.getByRole("link", { name: /Screens/ })).toHaveAttribute("aria-current", "page")
  })
})

describe("DocNav — accordion + pinned Shared", () => {
  function ControlledNav() {
    const [product, setProduct] = React.useState("artist")
    return (
      <DocNav
        docs={multiDocs}
        // A Shared doc is current, so activeProduct alone drives which product opens.
        currentPath="/docs/charter.html"
        activeProduct={product}
        onProductToggle={setProduct}
      />
    )
  }

  it("opens the active product and collapses the sibling", () => {
    render(<DocNav docs={multiDocs} currentPath="/docs/charter.html" activeProduct="artist" onProductToggle={() => {}} />)
    // Artist is open → its pills render.
    expect(screen.getByRole("link", { name: /Journeys/ })).toBeInTheDocument()
    // Pro is collapsed → no Pro pills, only its header chip.
    expect(screen.queryByRole("link", { name: /Pro States/ })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Pro/ })).toBeInTheDocument()
  })

  it("keeps Shared pinned and open regardless of the accordion", () => {
    render(<DocNav docs={multiDocs} currentPath="/docs/charter.html" activeProduct="pro" onProductToggle={() => {}} />)
    // Even with Pro active, Shared pills stay visible.
    expect(screen.getByRole("link", { name: /Charter/ })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Data/ })).toBeInTheDocument()
  })

  it("swaps the open product on toggle while Shared stays pinned", async () => {
    const user = userEvent.setup()
    render(<ControlledNav />)

    // Initially Artist open, Pro collapsed.
    expect(screen.getByRole("link", { name: /Screens/ })).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /Pro States/ })).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /Pro/ }))

    // Now Pro open, Artist collapsed — the accordion swapped in place.
    expect(screen.getByRole("link", { name: /Pro States/ })).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /Screens/ })).not.toBeInTheDocument()
    // Shared never left view.
    expect(screen.getByRole("link", { name: /Charter/ })).toBeInTheDocument()
  })

  it("calls onProductToggle with the group id when a collapsed product is clicked", async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    render(
      <DocNav docs={multiDocs} currentPath="/docs/charter.html" activeProduct="artist" onProductToggle={onToggle} />
    )
    await user.click(screen.getByRole("button", { name: /Pro/ }))
    expect(onToggle).toHaveBeenCalledWith("pro")
  })
})

describe("DocNav — appendix", () => {
  it("buckets slot-less, group-less docs into a collapsed Appendix", () => {
    render(<DocNav docs={multiDocs} currentPath="/docs/charter.html" activeProduct="artist" />)
    const appendix = screen.getByRole("button", { name: /Appendix/ })
    expect(appendix).toHaveAttribute("aria-expanded", "false")
    // Collapsed → the ad-hoc docs are not yet rendered.
    expect(screen.queryByRole("link", { name: /Q3 Audit/ })).not.toBeInTheDocument()
  })

  it("reveals the ad-hoc docs when the Appendix is expanded", async () => {
    const user = userEvent.setup()
    render(<DocNav docs={multiDocs} currentPath="/docs/charter.html" activeProduct="artist" />)
    await user.click(screen.getByRole("button", { name: /Appendix/ }))
    expect(screen.getByRole("link", { name: /Q3 Audit/ })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Runbook/ })).toBeInTheDocument()
  })

  it("badges external entries and opens them in a new tab", async () => {
    const user = userEvent.setup()
    render(<DocNav docs={multiDocs} currentPath="/docs/charter.html" activeProduct="artist" />)
    await user.click(screen.getByRole("button", { name: /Appendix/ }))
    const external = screen.getByRole("link", { name: /Runbook/ })
    expect(external).toHaveAttribute("target", "_blank")
    expect(external).toHaveAttribute("rel", "noopener noreferrer")
  })

  it("renders a lone ad-hoc doc inline (open) rather than collapsed", () => {
    const single: DocEntry[] = [
      { order: 1, label: "Charter", href: "/docs/charter.html", group: "Shared" },
      { order: 11, label: "One-Off", href: "/docs/one-off.html" },
    ]
    render(<DocNav docs={single} currentPath="/docs/charter.html" />)
    expect(screen.getByRole("link", { name: /One-Off/ })).toBeInTheDocument()
  })
})

describe("DocNav — hub entry", () => {
  it("marks the lead pill of the pinned Shared set as the hub", () => {
    // Charter is order 1, not 0, but it is the first entry of the pinned group.
    render(<DocNav docs={multiDocs} currentPath="/docs/charter.html" activeProduct="artist" />)
    expect(screen.getByRole("link", { name: /Charter/ })).toHaveAttribute("data-hub", "true")
    // A later Shared entry is not the hub.
    expect(screen.getByRole("link", { name: /Data/ })).not.toHaveAttribute("data-hub")
  })

  it("marks an explicit order-0 entry as the hub", () => {
    const withIndex: DocEntry[] = [
      { order: 0, label: "Index", href: "/docs", group: "Planning" },
      { order: 2, label: "CUJs", href: "/docs/cujs", group: "Planning" },
    ]
    render(<DocNav docs={withIndex} currentPath="/docs/cujs" defaultCollapsed={false} />)
    expect(screen.getByRole("link", { name: /Index/ })).toHaveAttribute("data-hub", "true")
    expect(screen.getByRole("link", { name: /CUJs/ })).not.toHaveAttribute("data-hub")
  })

  it("does not mark the lead pill of a non-pinned product group as a hub", () => {
    // Journeys (order 2) leads the Artist group but Artist is not pinned.
    render(<DocNav docs={multiDocs} currentPath="/docs/artist/journeys" activeProduct="artist" />)
    expect(screen.getByRole("link", { name: /Journeys/ })).not.toHaveAttribute("data-hub")
  })
})

describe("DocNav — single-product mode", () => {
  const singleDocs: DocEntry[] = [
    { order: 0, label: "Index", href: "/docs", group: "Planning" },
    { order: 2, label: "CUJs", href: "/docs/cujs", group: "Planning" },
    { order: 3, label: "Screens", href: "/docs/screens", group: "Planning" },
    { order: 11, label: "Notes", href: "/docs/notes.html" },
    { order: 12, label: "Scratch", href: "/docs/scratch.html" },
  ]

  it("degrades to one grouped row with no accordion controls", () => {
    render(<DocNav docs={singleDocs} currentPath="/docs/cujs" defaultCollapsed={false} />)
    // The single section renders open as a grouped row.
    expect(screen.getByText("Planning")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /CUJs/ })).toHaveAttribute("aria-current", "page")
    expect(screen.getByRole("link", { name: /Index/ })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Screens/ })).toBeInTheDocument()
  })

  it("expands a collapsed section independently when uncontrolled (static-doc mode)", async () => {
    const user = userEvent.setup()
    // currentPath matches nothing, defaultCollapsed default true → Planning starts collapsed.
    render(<DocNav docs={singleDocs} currentPath="/other" />)
    expect(screen.queryByRole("link", { name: /CUJs/ })).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /Planning/ }))
    expect(screen.getByRole("link", { name: /CUJs/ })).toBeInTheDocument()
  })
})

describe("DocNav — accessibility", () => {
  it("has no WCAG 2.1 AA violations", async () => {
    const { container } = render(
      <DocNav docs={multiDocs} currentPath="/docs/artist/screens" activeProduct="artist" onProductToggle={() => {}} />
    )
    await checkA11y(container)
  })
})

// VI-628 — `groupKeyFor` reads `scope[0]`, which is only a `string` under a
// checked-index compiler. The read is now bound and guarded, so these pin the
// behaviour at the degenerate edges the guard has to leave untouched.
describe("DocNav — degenerate scope (VI-628)", () => {
  it("buckets an empty scope into Shared, exactly like an absent scope", () => {
    const docs: DocEntry[] = [
      { order: 1, label: "Charter", href: "/docs/charter.html", kind: "local-html", scope: [] },
      { order: 2, label: "Data", href: "/docs/data.html", kind: "local-html", scope: [] },
    ]
    render(<DocNav docs={docs} currentPath="/docs/charter.html" />)

    expect(screen.getByText("Shared")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Charter/ })).toHaveAttribute(
      "aria-current",
      "page"
    )
    expect(screen.getByRole("link", { name: /Data/ })).toBeInTheDocument()
  })

  it("still routes an empty-scope, group-less, high-order doc to the Appendix", () => {
    const docs: DocEntry[] = [
      { order: 11, label: "Q3 Audit", href: "/docs/q3-audit.html", kind: "local-html", scope: [] },
    ]
    render(<DocNav docs={docs} currentPath="/docs/q3-audit.html" />)

    expect(screen.getByText("Appendix")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Q3 Audit/ })).toBeInTheDocument()
  })

  it("still prefers an explicit group over an empty scope", () => {
    const docs: DocEntry[] = [
      { order: 1, label: "Journeys", href: "/docs/artist/journeys", kind: "route", scope: [], group: "Artist" },
    ]
    render(<DocNav docs={docs} currentPath="/docs/artist/journeys" />)

    expect(screen.getByText("Artist")).toBeInTheDocument()
    expect(screen.queryByText("Shared")).not.toBeInTheDocument()
  })

  it("still derives the group label from a populated scope", () => {
    const docs: DocEntry[] = [
      { order: 1, label: "Journeys", href: "/docs/artist/journeys", kind: "route", scope: ["artist"] },
    ]
    render(<DocNav docs={docs} currentPath="/docs/artist/journeys" />)

    expect(screen.getByText("Artist")).toBeInTheDocument()
  })
})
