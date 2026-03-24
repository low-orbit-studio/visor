import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect } from "vitest"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "../accordion"
import { checkA11y } from "../../../../test-utils/a11y"

function BasicAccordion() {
  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="item-1">
        <AccordionTrigger>Section 1</AccordionTrigger>
        <AccordionContent>Content for section 1</AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Section 2</AccordionTrigger>
        <AccordionContent>Content for section 2</AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

describe("Accordion", () => {
  it("renders accordion with triggers", () => {
    render(<BasicAccordion />)
    expect(screen.getByText("Section 1")).toBeInTheDocument()
    expect(screen.getByText("Section 2")).toBeInTheDocument()
  })

  it("Accordion root has data-slot attribute", () => {
    render(
      <Accordion type="single" collapsible data-testid="acc-root">
        <AccordionItem value="item-1">
          <AccordionTrigger>Section</AccordionTrigger>
          <AccordionContent>Content</AccordionContent>
        </AccordionItem>
      </Accordion>
    )
    expect(screen.getByTestId("acc-root")).toHaveAttribute("data-slot", "accordion")
  })

  it("AccordionItem has data-slot attribute", () => {
    render(
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1" data-testid="acc-item">
          <AccordionTrigger>Section</AccordionTrigger>
          <AccordionContent>Content</AccordionContent>
        </AccordionItem>
      </Accordion>
    )
    expect(screen.getByTestId("acc-item")).toHaveAttribute("data-slot", "accordion-item")
  })

  it("AccordionTrigger has data-slot attribute", () => {
    render(<BasicAccordion />)
    const triggers = screen.getAllByRole("button")
    expect(triggers[0]).toHaveAttribute("data-slot", "accordion-trigger")
  })

  it("AccordionContent has data-slot attribute", () => {
    render(
      <Accordion type="single" defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger>Section</AccordionTrigger>
          <AccordionContent data-testid="acc-content">Content</AccordionContent>
        </AccordionItem>
      </Accordion>
    )
    expect(screen.getByTestId("acc-content")).toHaveAttribute("data-slot", "accordion-content")
  })

  it("expands content when trigger is clicked", async () => {
    const user = userEvent.setup()
    render(<BasicAccordion />)

    // Content initially not in the DOM (Radix removes it when closed)
    expect(screen.queryByText("Content for section 1")).not.toBeInTheDocument()

    await user.click(screen.getByText("Section 1"))
    expect(screen.getByText("Content for section 1")).toBeInTheDocument()
  })

  it("supports single expansion mode", async () => {
    const user = userEvent.setup()
    render(
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>Section 1</AccordionTrigger>
          <AccordionContent>Content 1</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Section 2</AccordionTrigger>
          <AccordionContent>Content 2</AccordionContent>
        </AccordionItem>
      </Accordion>
    )

    await user.click(screen.getByText("Section 1"))
    expect(screen.getByText("Content 1")).toBeVisible()

    await user.click(screen.getByText("Section 2"))
    expect(screen.getByText("Content 2")).toBeInTheDocument()
    // Section 1 should now be closed (Radix removes it from DOM)
    expect(screen.queryByText("Content 1")).not.toBeInTheDocument()
  })

  it("supports multiple expansion mode", async () => {
    const user = userEvent.setup()
    render(
      <Accordion type="multiple">
        <AccordionItem value="item-1">
          <AccordionTrigger>Section 1</AccordionTrigger>
          <AccordionContent>Content 1</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Section 2</AccordionTrigger>
          <AccordionContent>Content 2</AccordionContent>
        </AccordionItem>
      </Accordion>
    )

    await user.click(screen.getByText("Section 1"))
    await user.click(screen.getByText("Section 2"))

    expect(screen.getByText("Content 1")).toBeInTheDocument()
    expect(screen.getByText("Content 2")).toBeInTheDocument()
  })

  it("accepts custom className", () => {
    render(
      <Accordion type="single" collapsible className="custom-class" data-testid="acc">
        <AccordionItem value="item-1">
          <AccordionTrigger>Section</AccordionTrigger>
          <AccordionContent>Content</AccordionContent>
        </AccordionItem>
      </Accordion>
    )
    expect(screen.getByTestId("acc")).toHaveClass("custom-class")
  })

  it("trigger indicates expanded state with aria-expanded", async () => {
    const user = userEvent.setup()
    render(<BasicAccordion />)

    const trigger = screen.getAllByRole("button")[0]
    expect(trigger).toHaveAttribute("aria-expanded", "false")

    await user.click(trigger)
    expect(trigger).toHaveAttribute("aria-expanded", "true")
  })
})

describe("Accordion accessibility", () => {
  it("has no WCAG 2.1 AA violations (collapsed)", async () => {
    const { container } = render(
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>What is Visor?</AccordionTrigger>
          <AccordionContent>
            Visor is Low Orbit Studio's shared design system.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>How do I install it?</AccordionTrigger>
          <AccordionContent>
            Run npx visor add button to get started.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    )
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (expanded)", async () => {
    const { container } = render(
      <Accordion type="single" defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger>What is Visor?</AccordionTrigger>
          <AccordionContent>
            Visor is Low Orbit Studio's shared design system.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>How do I install it?</AccordionTrigger>
          <AccordionContent>
            Run npx visor add button to get started.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    )
    await checkA11y(container)
  })
})
