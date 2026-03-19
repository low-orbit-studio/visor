import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../tabs"

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
