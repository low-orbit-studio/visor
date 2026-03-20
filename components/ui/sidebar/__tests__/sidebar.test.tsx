import { render, screen } from "@testing-library/react"
import { describe, it, expect, beforeAll } from "vitest"

// jsdom doesn't implement window.matchMedia; provide a stub
beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
})
import {
  Sidebar,
  SidebarProvider,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarTrigger,
  SidebarInset,
  useSidebar,
} from "../sidebar"
import { checkA11y } from "../../../../test-utils/a11y"

function TestSidebar() {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>Header</SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton>Dashboard</SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive>Settings</SidebarMenuButton>
                  <SidebarMenuBadge>3</SidebarMenuBadge>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>Footer</SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <SidebarTrigger />
        <main>Main content</main>
      </SidebarInset>
    </SidebarProvider>
  )
}

describe("Sidebar", () => {
  it("renders sidebar structure", () => {
    render(<TestSidebar />)
    expect(screen.getByText("Header")).toBeInTheDocument()
    expect(screen.getByText("Footer")).toBeInTheDocument()
    expect(screen.getByText("Navigation")).toBeInTheDocument()
    expect(screen.getByText("Dashboard")).toBeInTheDocument()
    expect(screen.getByText("Settings")).toBeInTheDocument()
    expect(screen.getByText("Main content")).toBeInTheDocument()
  })

  it("SidebarProvider renders wrapper with data-slot", () => {
    render(
      <SidebarProvider data-testid="wrapper">
        <Sidebar>
          <SidebarContent />
        </Sidebar>
      </SidebarProvider>
    )
    expect(screen.getByTestId("wrapper")).toHaveAttribute("data-slot", "sidebar-wrapper")
  })

  it("Sidebar has data-slot attribute", () => {
    render(
      <SidebarProvider>
        <Sidebar data-testid="sidebar">
          <SidebarContent />
        </Sidebar>
      </SidebarProvider>
    )
    expect(screen.getByTestId("sidebar")).toHaveAttribute("data-slot", "sidebar")
  })

  it("SidebarMenuButton has data-slot attribute", () => {
    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton data-testid="btn">Click me</SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    )
    expect(screen.getByTestId("btn")).toHaveAttribute("data-slot", "sidebar-menu-button")
  })

  it("SidebarMenuButton marks active state", () => {
    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive data-testid="active-btn">Active</SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    )
    expect(screen.getByTestId("active-btn")).toHaveAttribute("data-active")
  })

  it("Sidebar collapsible=none renders static version", () => {
    render(
      <SidebarProvider>
        <Sidebar collapsible="none" data-testid="static-sidebar">
          <SidebarContent>
            <div>Static content</div>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    )
    expect(screen.getByText("Static content")).toBeInTheDocument()
  })

  it("SidebarMenuSub renders sub items", () => {
    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>Parent</SidebarMenuButton>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton href="/sub">Sub Item</SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    )
    expect(screen.getByText("Sub Item")).toBeInTheDocument()
  })

  it("useSidebar throws outside provider", () => {
    const TestComponent = () => {
      useSidebar()
      return null
    }
    expect(() => render(<TestComponent />)).toThrow(
      "useSidebar must be used within a SidebarProvider."
    )
  })

  it("SidebarTrigger renders toggle button", () => {
    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarContent />
        </Sidebar>
        <SidebarTrigger data-testid="trigger" />
      </SidebarProvider>
    )
    const trigger = screen.getByTestId("trigger")
    expect(trigger).toHaveAttribute("data-slot", "sidebar-trigger")
  })
})

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations", async () => {
    const { container } = render(<TestSidebar />)
    await checkA11y(container)
  })
})
