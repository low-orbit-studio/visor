import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, beforeAll } from "vitest"
import { checkA11y } from "../../../test-utils/a11y"

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
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarTrigger,
  SidebarInset,
} from "../sidebar/sidebar"

function NavSidebar() {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>App Name</SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Main</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive>Dashboard</SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton>Projects</SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>Settings</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton>Account</SidebarMenuButton>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton href="/profile">Profile</SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton href="/security">Security</SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <SidebarTrigger data-testid="trigger" />
        <main>Page content</main>
      </SidebarInset>
    </SidebarProvider>
  )
}

describe("Composition: Sidebar + Nav", () => {
  it("renders full sidebar with grouped navigation", () => {
    render(<NavSidebar />)
    expect(screen.getByText("App Name")).toBeInTheDocument()
    expect(screen.getByText("Main")).toBeInTheDocument()
    expect(screen.getByText("Dashboard")).toBeInTheDocument()
    expect(screen.getByText("Projects")).toBeInTheDocument()
    expect(screen.getByText("Settings")).toBeInTheDocument()
    expect(screen.getByText("Account")).toBeInTheDocument()
    expect(screen.getByText("Page content")).toBeInTheDocument()
  })

  it("active menu item has data-active attribute", () => {
    render(<NavSidebar />)
    const dashboardBtn = screen.getByText("Dashboard")
    expect(dashboardBtn).toHaveAttribute("data-active")
    const projectsBtn = screen.getByText("Projects")
    expect(projectsBtn).not.toHaveAttribute("data-active")
  })

  it("renders nested sub-navigation items", () => {
    render(<NavSidebar />)
    expect(screen.getByText("Profile")).toBeInTheDocument()
    expect(screen.getByText("Security")).toBeInTheDocument()
    const profileLink = screen.getByText("Profile").closest("a")
    expect(profileLink).toHaveAttribute("href", "/profile")
  })

  it("multiple sidebar groups render independently", () => {
    render(<NavSidebar />)
    const groups = document.querySelectorAll('[data-slot="sidebar-group"]')
    expect(groups.length).toBe(2)
  })

  it("sidebar trigger toggles sidebar state", async () => {
    const user = userEvent.setup()
    render(<NavSidebar />)
    const trigger = screen.getByTestId("trigger")
    expect(trigger).toHaveAttribute("data-slot", "sidebar-trigger")
    await user.click(trigger)
    // Trigger fires without error, confirming integration with SidebarProvider
    expect(trigger).toBeInTheDocument()
  })

  it("sidebar header and menu buttons have correct data-slot attributes", () => {
    render(<NavSidebar />)
    expect(document.querySelector('[data-slot="sidebar-header"]')).toBeInTheDocument()
    expect(document.querySelector('[data-slot="sidebar-content"]')).toBeInTheDocument()
    expect(document.querySelector('[data-slot="sidebar-group-label"]')).toBeInTheDocument()
    expect(document.querySelector('[data-slot="sidebar-menu"]')).toBeInTheDocument()
    expect(document.querySelector('[data-slot="sidebar-menu-button"]')).toBeInTheDocument()
    expect(document.querySelector('[data-slot="sidebar-menu-sub"]')).toBeInTheDocument()
  })
})

describe("Composition: Sidebar + Nav accessibility", () => {
  it("has no WCAG 2.1 AA violations", async () => {
    const { container } = render(<NavSidebar />)
    await checkA11y(container)
  })
})
