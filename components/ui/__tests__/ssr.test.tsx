/**
 * SSR Smoke Tests
 *
 * Verifies that server-safe components can be rendered to HTML string without
 * errors (simulating Next.js App Router server rendering), and that all
 * components render without crashing in a standard React environment.
 *
 * Client-only components (Radix UI, hooks) are tested for client rendering
 * only — they require the browser environment that jsdom provides.
 */

import * as React from "react"
import { renderToString } from "react-dom/server"
import { render } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"

// ─── Server-safe components ───────────────────────────────────────────────────

import { Alert, AlertTitle, AlertDescription } from "../alert/alert"
import { Badge } from "../badge/badge"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../breadcrumb/breadcrumb"
import { Button } from "../button/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../card/card"
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "../field/field"
import { Input } from "../input/input"
import { Skeleton } from "../skeleton/skeleton"
import { Textarea } from "../textarea/textarea"

// ─── Client-only components ───────────────────────────────────────────────────

import { Avatar, AvatarFallback, AvatarImage } from "../avatar/avatar"
import { Checkbox } from "../checkbox/checkbox"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "../dialog/dialog"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../dropdown-menu/dropdown-menu"
import { Label } from "../label/label"
import { Progress } from "../progress/progress"
import { ScrollArea } from "../scroll-area/scroll-area"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../select/select"
import { Separator } from "../separator/separator"
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "../sheet/sheet"
import { Switch } from "../switch/switch"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../tabs/tabs"
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "../tooltip/tooltip"

// Mock recharts — it uses ResizeObserver and other browser APIs unavailable in jsdom
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Tooltip: () => null,
  Legend: () => null,
}))

// ─── Server rendering tests (server-safe components) ─────────────────────────

describe("SSR: server-safe components render to string without error", () => {
  it("Alert renders to string", () => {
    const html = renderToString(
      <Alert>
        <AlertTitle>Heads up</AlertTitle>
        <AlertDescription>Something happened.</AlertDescription>
      </Alert>
    )
    expect(html).toContain("Heads up")
    expect(html).toContain("Something happened.")
  })

  it("Badge renders to string", () => {
    const html = renderToString(<Badge>New</Badge>)
    expect(html).toContain("New")
  })

  it("Breadcrumb renders to string", () => {
    const html = renderToString(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Current</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )
    expect(html).toContain("Home")
    expect(html).toContain("Current")
  })

  it("Button renders to string", () => {
    const html = renderToString(<Button>Click me</Button>)
    expect(html).toContain("Click me")
  })

  it("Card renders to string", () => {
    const html = renderToString(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card description</CardDescription>
        </CardHeader>
        <CardContent>Content here</CardContent>
        <CardFooter>Footer here</CardFooter>
      </Card>
    )
    expect(html).toContain("Card Title")
    expect(html).toContain("Card description")
    expect(html).toContain("Content here")
    expect(html).toContain("Footer here")
  })

  it("Field renders to string", () => {
    const html = renderToString(
      <Field>
        <FieldLabel>Email</FieldLabel>
        <FieldDescription>Enter your email.</FieldDescription>
        <FieldError>Required</FieldError>
      </Field>
    )
    expect(html).toContain("Email")
    expect(html).toContain("Enter your email.")
    expect(html).toContain("Required")
  })

  it("Input renders to string", () => {
    const html = renderToString(<Input placeholder="Type here" />)
    expect(html).toContain("Type here")
  })

  it("Skeleton renders to string", () => {
    const html = renderToString(<Skeleton />)
    expect(html.length).toBeGreaterThan(0)
  })

  it("Textarea renders to string", () => {
    const html = renderToString(<Textarea placeholder="Write something" />)
    expect(html).toContain("Write something")
  })
})

// ─── Client rendering tests (all components) ─────────────────────────────────

describe("Client: all components render without crashing", () => {
  // Server-safe
  it("Alert renders on client", () => {
    const { getByText } = render(
      <Alert>
        <AlertTitle>Alert Title</AlertTitle>
      </Alert>
    )
    expect(getByText("Alert Title")).toBeDefined()
  })

  it("Badge renders on client", () => {
    const { getByText } = render(<Badge>Label</Badge>)
    expect(getByText("Label")).toBeDefined()
  })

  it("Breadcrumb renders on client", () => {
    const { getByText } = render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Page</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )
    expect(getByText("Page")).toBeDefined()
  })

  it("Button renders on client", () => {
    const { getByRole } = render(<Button>Submit</Button>)
    expect(getByRole("button", { name: "Submit" })).toBeDefined()
  })

  it("Card renders on client", () => {
    const { getByText } = render(
      <Card>
        <CardContent>Card body</CardContent>
      </Card>
    )
    expect(getByText("Card body")).toBeDefined()
  })

  it("Field renders on client", () => {
    const { getByText } = render(
      <Field>
        <FieldLabel>Name</FieldLabel>
      </Field>
    )
    expect(getByText("Name")).toBeDefined()
  })

  it("Input renders on client", () => {
    const { getByRole } = render(<Input />)
    expect(getByRole("textbox")).toBeDefined()
  })

  it("Skeleton renders on client", () => {
    const { container } = render(<Skeleton />)
    expect(container.firstChild).toBeDefined()
  })

  it("Textarea renders on client", () => {
    const { getByRole } = render(<Textarea />)
    expect(getByRole("textbox")).toBeDefined()
  })

  // Client-only
  it("Avatar renders on client", () => {
    const { getByText } = render(
      <Avatar>
        <AvatarImage src="/photo.jpg" alt="User" />
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    )
    expect(getByText("JD")).toBeDefined()
  })

  it("Checkbox renders on client", () => {
    const { getByRole } = render(<Checkbox />)
    expect(getByRole("checkbox")).toBeDefined()
  })

  it("Dialog renders trigger on client", () => {
    const { getByText } = render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Dialog Title</DialogTitle>
          <DialogDescription>Dialog content</DialogDescription>
        </DialogContent>
      </Dialog>
    )
    expect(getByText("Open")).toBeDefined()
  })

  it("DropdownMenu renders trigger on client", () => {
    const { getByText } = render(
      <DropdownMenu>
        <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
    expect(getByText("Menu")).toBeDefined()
  })

  it("Label renders on client", () => {
    const { getByText } = render(<Label>Email address</Label>)
    expect(getByText("Email address")).toBeDefined()
  })

  it("Progress renders on client", () => {
    const { container } = render(<Progress value={50} />)
    expect(container.firstChild).toBeDefined()
  })

  it("ScrollArea renders on client", () => {
    const { getByText } = render(
      <ScrollArea>
        <p>Scrollable content</p>
      </ScrollArea>
    )
    expect(getByText("Scrollable content")).toBeDefined()
  })

  it("Select renders trigger on client", () => {
    const { getByText } = render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Pick one" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Option A</SelectItem>
        </SelectContent>
      </Select>
    )
    expect(getByText("Pick one")).toBeDefined()
  })

  it("Separator renders on client", () => {
    const { container } = render(<Separator />)
    expect(container.firstChild).toBeDefined()
  })

  it("Sheet renders trigger on client", () => {
    const { getByText } = render(
      <Sheet>
        <SheetTrigger>Open Sheet</SheetTrigger>
        <SheetContent>
          <SheetTitle>Sheet Title</SheetTitle>
          <SheetDescription>Sheet content</SheetDescription>
        </SheetContent>
      </Sheet>
    )
    expect(getByText("Open Sheet")).toBeDefined()
  })

  it("Switch renders on client", () => {
    const { getByRole } = render(<Switch />)
    expect(getByRole("switch")).toBeDefined()
  })

  it("Tabs renders on client", () => {
    const { getByText } = render(
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">Tab A</TabsTrigger>
          <TabsTrigger value="b">Tab B</TabsTrigger>
        </TabsList>
        <TabsContent value="a">Content A</TabsContent>
        <TabsContent value="b">Content B</TabsContent>
      </Tabs>
    )
    expect(getByText("Tab A")).toBeDefined()
    expect(getByText("Content A")).toBeDefined()
  })

  it("Tooltip renders trigger on client", () => {
    const { getByText } = render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip text</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
    expect(getByText("Hover me")).toBeDefined()
  })
})
