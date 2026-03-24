import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import {
  Stepper,
  StepperItem,
  StepperTrigger,
  StepperTitle,
  StepperDescription,
  StepperSeparator,
} from "../stepper"
import { checkA11y } from "../../../../test-utils/a11y"

function renderBasicStepper(activeStep = 0) {
  return render(
    <Stepper activeStep={activeStep}>
      <StepperItem step={0}>
        <StepperTrigger step={0} />
        <StepperTitle>Step 1</StepperTitle>
      </StepperItem>
      <StepperSeparator complete={activeStep > 0} />
      <StepperItem step={1}>
        <StepperTrigger step={1} />
        <StepperTitle>Step 2</StepperTitle>
      </StepperItem>
      <StepperSeparator complete={activeStep > 1} />
      <StepperItem step={2}>
        <StepperTrigger step={2} />
        <StepperTitle>Step 3</StepperTitle>
      </StepperItem>
    </Stepper>
  )
}

describe("Stepper", () => {
  it("renders all steps", () => {
    const { container } = renderBasicStepper()
    const titles = container.querySelectorAll("[data-slot='stepper-title']")
    expect(titles).toHaveLength(3)
    expect(titles[0]).toHaveTextContent("Step 1")
    expect(titles[1]).toHaveTextContent("Step 2")
    expect(titles[2]).toHaveTextContent("Step 3")
  })

  it("sets data-slot on stepper", () => {
    const { container } = renderBasicStepper()
    expect(container.querySelector("[data-slot='stepper']")).toBeTruthy()
  })

  it("sets role='group' on stepper with accessible label", () => {
    renderBasicStepper()
    expect(screen.getByRole("group", { name: /progress/i })).toBeInTheDocument()
  })

  it("auto-derives active status from activeStep", () => {
    const { container } = renderBasicStepper(1)
    const items = container.querySelectorAll("[data-slot='stepper-item']")
    expect(items[0]).toHaveAttribute("data-status", "complete")
    expect(items[1]).toHaveAttribute("data-status", "active")
    expect(items[2]).toHaveAttribute("data-status", "upcoming")
  })

  it("sets aria-current='step' on active item", () => {
    const { container } = renderBasicStepper(1)
    const items = container.querySelectorAll("[data-slot='stepper-item']")
    expect(items[0]).not.toHaveAttribute("aria-current")
    expect(items[1]).toHaveAttribute("aria-current", "step")
    expect(items[2]).not.toHaveAttribute("aria-current")
  })

  it("shows check icon for completed trigger", () => {
    const { container } = renderBasicStepper(2)
    const triggers = container.querySelectorAll("[data-slot='stepper-trigger']")
    expect(triggers[0]).toHaveAttribute("data-status", "complete")
    expect(triggers[1]).toHaveAttribute("data-status", "complete")
    expect(triggers[2]).toHaveAttribute("data-status", "active")
  })

  it("shows step number for non-complete triggers", () => {
    renderBasicStepper(0)
    const buttons = screen.getAllByRole("button")
    expect(buttons[0]).toHaveTextContent(/1/)
    expect(buttons[1]).toHaveTextContent(/2/)
    expect(buttons[2]).toHaveTextContent(/3/)
  })

  it("renders vertical orientation", () => {
    const { container } = render(
      <Stepper orientation="vertical" activeStep={0}>
        <StepperItem step={0}>
          <StepperTrigger step={0} />
          <StepperTitle>Step 1</StepperTitle>
        </StepperItem>
      </Stepper>
    )
    expect(container.querySelector("[data-slot='stepper']")).toHaveAttribute(
      "data-orientation",
      "vertical"
    )
  })

  it("renders description", () => {
    render(
      <Stepper activeStep={0}>
        <StepperItem step={0}>
          <StepperTrigger step={0} />
          <div>
            <StepperTitle>Step 1</StepperTitle>
            <StepperDescription>Enter your details</StepperDescription>
          </div>
        </StepperItem>
      </Stepper>
    )
    expect(screen.getByText("Enter your details")).toBeInTheDocument()
  })

  it("allows explicit status override", () => {
    const { container } = render(
      <Stepper activeStep={0}>
        <StepperItem step={0} status="complete">
          <StepperTrigger step={0} status="complete" />
          <StepperTitle>Forced Complete</StepperTitle>
        </StepperItem>
      </Stepper>
    )
    const item = container.querySelector("[data-slot='stepper-item']")
    expect(item).toHaveAttribute("data-status", "complete")
  })

  it("renders separator with complete state", () => {
    const { container } = render(
      <Stepper activeStep={1}>
        <StepperItem step={0}>
          <StepperTrigger step={0} />
        </StepperItem>
        <StepperSeparator complete />
        <StepperItem step={1}>
          <StepperTrigger step={1} />
        </StepperItem>
      </Stepper>
    )
    const separator = container.querySelector("[data-slot='stepper-separator']")
    expect(separator).toHaveAttribute("data-complete", "true")
  })

  it("applies custom className", () => {
    const { container } = render(
      <Stepper className="custom-stepper" activeStep={0}>
        <StepperItem step={0} className="custom-item">
          <StepperTrigger step={0} />
        </StepperItem>
      </Stepper>
    )
    expect(container.querySelector(".custom-stepper")).toBeTruthy()
    expect(container.querySelector(".custom-item")).toBeTruthy()
  })
})

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations (horizontal)", async () => {
    const { container } = renderBasicStepper(1)
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (vertical)", async () => {
    const { container } = render(
      <Stepper orientation="vertical" activeStep={0}>
        <StepperItem step={0}>
          <StepperTrigger step={0} />
          <StepperTitle>Step 1</StepperTitle>
        </StepperItem>
        <StepperSeparator />
        <StepperItem step={1}>
          <StepperTrigger step={1} />
          <StepperTitle>Step 2</StepperTitle>
        </StepperItem>
      </Stepper>
    )
    await checkA11y(container)
  })
})
