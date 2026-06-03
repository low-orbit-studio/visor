import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Tabs, TabsList, TabsTrigger, TabsContent, type TabsTriggerProps } from "../tabs"
import { checkA11y } from "../../../../test-utils/a11y"

describe("Tabs", () => {
  it("renders tabs with triggers and content", () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    )
    expect(screen.getByText("Tab 1")).toBeInTheDocument()
    expect(screen.getByText("Tab 2")).toBeInTheDocument()
    expect(screen.getByText("Content 1")).toBeInTheDocument()
  })

  it("Tabs root has data-slot attribute", () => {
    render(
      <Tabs defaultValue="tab1" data-testid="tabs-root">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
      </Tabs>
    )
    expect(screen.getByTestId("tabs-root")).toHaveAttribute("data-slot", "tabs")
  })

  it("TabsList has data-slot attribute", () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList data-testid="tabs-list">
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
      </Tabs>
    )
    expect(screen.getByTestId("tabs-list")).toHaveAttribute("data-slot", "tabs-list")
  })

  it("TabsTrigger has data-slot attribute", () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1" data-testid="trigger">Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
      </Tabs>
    )
    expect(screen.getByTestId("trigger")).toHaveAttribute("data-slot", "tabs-trigger")
  })

  it("TabsContent has data-slot attribute", () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1" data-testid="content">Content 1</TabsContent>
      </Tabs>
    )
    expect(screen.getByTestId("content")).toHaveAttribute("data-slot", "tabs-content")
  })

  it("TabsList supports line variant", () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList variant="line" data-testid="tabs-list">
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
      </Tabs>
    )
    const list = screen.getByTestId("tabs-list")
    expect(list).toHaveAttribute("data-variant", "line")
  })

  it("default active tab is shown", () => {
    render(
      <Tabs defaultValue="tab2">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    )
    // tab2 content should be visible
    expect(screen.getByText("Content 2")).toBeInTheDocument()
  })
})

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations", async () => {
    const { container } = render(
      <Tabs defaultValue="tab1">
        <TabsList aria-label="Account settings">
          <TabsTrigger value="tab1">Profile</TabsTrigger>
          <TabsTrigger value="tab2">Security</TabsTrigger>
          <TabsTrigger value="tab3">Notifications</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Profile settings content</TabsContent>
        <TabsContent value="tab2">Security settings content</TabsContent>
        <TabsContent value="tab3">Notification settings content</TabsContent>
      </Tabs>
    )
    await checkA11y(container)
  })
})

describe("TabsTrigger count slot", () => {
  // Helper to assert count pill attributes
  function getCountPill(container: HTMLElement) {
    return container.querySelector('[data-slot="tabs-trigger-count"]')
  }

  it("does not render count pill when count prop is omitted", () => {
    const { container } = render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Members</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content</TabsContent>
      </Tabs>
    )
    expect(getCountPill(container)).toBeNull()
  })

  it("renders count pill when count prop is provided", () => {
    const { container } = render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1" count={12}>Members</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content</TabsContent>
      </Tabs>
    )
    const pill = getCountPill(container)
    expect(pill).toBeInTheDocument()
    expect(pill).toHaveTextContent("12")
  })

  it("count pill has data-slot and data-tone attributes", () => {
    const { container } = render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1" count={5} countTone="primary">Members</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content</TabsContent>
      </Tabs>
    )
    const pill = getCountPill(container)
    expect(pill).toHaveAttribute("data-slot", "tabs-trigger-count")
    expect(pill).toHaveAttribute("data-tone", "primary")
  })

  it("defaults countTone to neutral", () => {
    const { container } = render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1" count={3}>Members</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content</TabsContent>
      </Tabs>
    )
    const pill = getCountPill(container)
    expect(pill).toHaveAttribute("data-tone", "neutral")
  })

  // 8 combinations: active × tone × variant (default + line)
  // active=false, neutral, default variant
  it("[inactive × neutral × default] renders count pill with neutral tone", () => {
    const { container } = render(
      <Tabs defaultValue="tab2">
        <TabsList>
          <TabsTrigger value="tab1" count={12}>Members</TabsTrigger>
          <TabsTrigger value="tab2">Other</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    )
    const pill = getCountPill(container)
    expect(pill).toBeInTheDocument()
    expect(pill).toHaveAttribute("data-tone", "neutral")
    const trigger = container.querySelector('[data-slot="tabs-trigger"]')
    expect(trigger).toHaveAttribute("data-state", "inactive")
  })

  // active=false, primary, default variant
  it("[inactive × primary × default] renders count pill with primary tone", () => {
    const { container } = render(
      <Tabs defaultValue="tab2">
        <TabsList>
          <TabsTrigger value="tab1" count={12} countTone="primary">Members</TabsTrigger>
          <TabsTrigger value="tab2">Other</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    )
    const pill = getCountPill(container)
    expect(pill).toHaveAttribute("data-tone", "primary")
    const trigger = container.querySelector('[data-slot="tabs-trigger"]')
    expect(trigger).toHaveAttribute("data-state", "inactive")
  })

  // active=true, neutral, default variant
  it("[active × neutral × default] trigger has active state and count pill is present", () => {
    const { container } = render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1" count={12}>Members</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
      </Tabs>
    )
    const pill = getCountPill(container)
    expect(pill).toBeInTheDocument()
    const trigger = container.querySelector('[data-slot="tabs-trigger"]')
    expect(trigger).toHaveAttribute("data-state", "active")
  })

  // active=true, primary, default variant
  it("[active × primary × default] trigger has active state and count pill with primary tone", () => {
    const { container } = render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1" count={12} countTone="primary">Members</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
      </Tabs>
    )
    const pill = getCountPill(container)
    expect(pill).toBeInTheDocument()
    expect(pill).toHaveAttribute("data-tone", "primary")
    const trigger = container.querySelector('[data-slot="tabs-trigger"]')
    expect(trigger).toHaveAttribute("data-state", "active")
  })

  // active=false, neutral, line variant
  it("[inactive × neutral × line] renders count pill in line variant", () => {
    const { container } = render(
      <Tabs defaultValue="tab2">
        <TabsList variant="line">
          <TabsTrigger value="tab1" count={3}>Members</TabsTrigger>
          <TabsTrigger value="tab2">Other</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    )
    const pill = getCountPill(container)
    expect(pill).toBeInTheDocument()
    expect(pill).toHaveAttribute("data-tone", "neutral")
  })

  // active=false, primary, line variant
  it("[inactive × primary × line] renders count pill with primary tone in line variant", () => {
    const { container } = render(
      <Tabs defaultValue="tab2">
        <TabsList variant="line">
          <TabsTrigger value="tab1" count={3} countTone="primary">Members</TabsTrigger>
          <TabsTrigger value="tab2">Other</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    )
    const pill = getCountPill(container)
    expect(pill).toBeInTheDocument()
    expect(pill).toHaveAttribute("data-tone", "primary")
  })

  // active=true, neutral, line variant
  it("[active × neutral × line] trigger is active with count pill in line variant", () => {
    const { container } = render(
      <Tabs defaultValue="tab1">
        <TabsList variant="line">
          <TabsTrigger value="tab1" count={3}>Members</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
      </Tabs>
    )
    const pill = getCountPill(container)
    expect(pill).toBeInTheDocument()
    const trigger = container.querySelector('[data-slot="tabs-trigger"]')
    expect(trigger).toHaveAttribute("data-state", "active")
  })

  // active=true, primary, line variant
  it("[active × primary × line] trigger is active with primary count pill in line variant", () => {
    const { container } = render(
      <Tabs defaultValue="tab1">
        <TabsList variant="line">
          <TabsTrigger value="tab1" count={3} countTone="primary">Members</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
      </Tabs>
    )
    const pill = getCountPill(container)
    expect(pill).toBeInTheDocument()
    expect(pill).toHaveAttribute("data-tone", "primary")
    const trigger = container.querySelector('[data-slot="tabs-trigger"]')
    expect(trigger).toHaveAttribute("data-state", "active")
  })

  it("accessible name includes label and count — screen readers announce both", () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList aria-label="Organization">
          <TabsTrigger value="tab1" count={12}>Members</TabsTrigger>
          <TabsTrigger value="tab2" count={3}>Pending</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Members content</TabsContent>
        <TabsContent value="tab2">Pending content</TabsContent>
      </Tabs>
    )
    // getByRole("tab") matches accessible name including count text in button content
    const membersTab = screen.getByRole("tab", { name: /Members.*12/ })
    expect(membersTab).toBeInTheDocument()
    const pendingTab = screen.getByRole("tab", { name: /Pending.*3/ })
    expect(pendingTab).toBeInTheDocument()
  })

  it("TabsTriggerProps type is exported", () => {
    // Compile-time check: assign a props object to TabsTriggerProps
    const _props: TabsTriggerProps = { value: "tab1", count: 5, countTone: "primary" }
    expect(_props.countTone).toBe("primary")
  })

  it("triggers without count prop render identically (no breaking change)", () => {
    const { container } = render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">No count</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content</TabsContent>
      </Tabs>
    )
    // No count pill
    expect(getCountPill(container)).toBeNull()
    // Label text still accessible
    expect(screen.getByText("No count")).toBeInTheDocument()
  })

  it("count pill has no a11y violations when present", async () => {
    const { container } = render(
      <Tabs defaultValue="tab1">
        <TabsList aria-label="Members">
          <TabsTrigger value="tab1" count={12}>Members</TabsTrigger>
          <TabsTrigger value="tab2" count={3}>Pending</TabsTrigger>
          <TabsTrigger value="tab3" count={4}>Roles</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Members content</TabsContent>
        <TabsContent value="tab2">Pending content</TabsContent>
        <TabsContent value="tab3">Roles content</TabsContent>
      </Tabs>
    )
    await checkA11y(container)
  })
})
