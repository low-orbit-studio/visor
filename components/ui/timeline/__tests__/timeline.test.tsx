import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import {
  Timeline,
  TimelineItem,
  TimelineIcon,
  TimelineContent,
  TimelineTitle,
  TimelineDescription,
  TimelineTimestamp,
} from "../timeline"
import { checkA11y } from "../../../../test-utils/a11y"

describe("Timeline", () => {
  it("renders timeline container", () => {
    const { container } = render(<Timeline>content</Timeline>)
    expect(container.firstChild).toHaveAttribute("data-slot", "timeline")
  })

  it("renders timeline items with content", () => {
    render(
      <Timeline>
        <TimelineItem>
          <TimelineContent>
            <TimelineTitle>Event 1</TimelineTitle>
            <TimelineDescription>Description of event 1</TimelineDescription>
          </TimelineContent>
        </TimelineItem>
      </Timeline>
    )
    expect(screen.getByText("Event 1")).toBeInTheDocument()
    expect(screen.getByText("Description of event 1")).toBeInTheDocument()
  })

  it("applies status to timeline items", () => {
    const { container } = render(
      <Timeline>
        <TimelineItem status="complete">
          <TimelineContent>
            <TimelineTitle>Done</TimelineTitle>
          </TimelineContent>
        </TimelineItem>
        <TimelineItem status="active">
          <TimelineContent>
            <TimelineTitle>Current</TimelineTitle>
          </TimelineContent>
        </TimelineItem>
        <TimelineItem status="upcoming">
          <TimelineContent>
            <TimelineTitle>Next</TimelineTitle>
          </TimelineContent>
        </TimelineItem>
      </Timeline>
    )
    const items = container.querySelectorAll("[data-slot='timeline-item']")
    expect(items[0]).toHaveAttribute("data-status", "complete")
    expect(items[1]).toHaveAttribute("data-status", "active")
    expect(items[2]).toHaveAttribute("data-status", "upcoming")
  })

  it("defaults to upcoming status", () => {
    const { container } = render(
      <Timeline>
        <TimelineItem>
          <TimelineContent>
            <TimelineTitle>Event</TimelineTitle>
          </TimelineContent>
        </TimelineItem>
      </Timeline>
    )
    expect(container.querySelector("[data-slot='timeline-item']")).toHaveAttribute(
      "data-status",
      "upcoming"
    )
  })

  it("renders custom icon", () => {
    render(
      <Timeline>
        <TimelineItem>
          <TimelineIcon>
            <span data-testid="custom-icon">*</span>
          </TimelineIcon>
          <TimelineContent>
            <TimelineTitle>Event</TimelineTitle>
          </TimelineContent>
        </TimelineItem>
      </Timeline>
    )
    expect(screen.getByTestId("custom-icon")).toBeInTheDocument()
  })

  it("renders timestamp with dateTime", () => {
    render(
      <Timeline>
        <TimelineItem>
          <TimelineContent>
            <TimelineTitle>Event</TimelineTitle>
            <TimelineTimestamp dateTime="2024-01-15">
              Jan 15, 2024
            </TimelineTimestamp>
          </TimelineContent>
        </TimelineItem>
      </Timeline>
    )
    const timestamp = screen.getByText("Jan 15, 2024")
    expect(timestamp).toBeInTheDocument()
    expect(timestamp).toHaveAttribute("datetime", "2024-01-15")
  })

  it("applies custom className to all sub-components", () => {
    const { container } = render(
      <Timeline className="tl">
        <TimelineItem className="tl-item">
          <TimelineIcon className="tl-icon">*</TimelineIcon>
          <TimelineContent className="tl-content">
            <TimelineTitle className="tl-title">Title</TimelineTitle>
            <TimelineDescription className="tl-desc">
              Desc
            </TimelineDescription>
            <TimelineTimestamp className="tl-time">Time</TimelineTimestamp>
          </TimelineContent>
        </TimelineItem>
      </Timeline>
    )
    expect(container.querySelector(".tl")).toBeTruthy()
    expect(container.querySelector(".tl-item")).toBeTruthy()
    expect(container.querySelector(".tl-icon")).toBeTruthy()
    expect(container.querySelector(".tl-content")).toBeTruthy()
    expect(container.querySelector(".tl-title")).toBeTruthy()
    expect(container.querySelector(".tl-desc")).toBeTruthy()
    expect(container.querySelector(".tl-time")).toBeTruthy()
  })

  it("forwards ref on Timeline", () => {
    const ref = { current: null as HTMLDivElement | null }
    render(<Timeline ref={ref}>content</Timeline>)
    expect(ref.current).toBeInstanceOf(HTMLElement)
  })
})

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations", async () => {
    const { container } = render(
      <Timeline>
        <TimelineItem status="complete">
          <TimelineContent>
            <TimelineTitle>Step 1</TimelineTitle>
            <TimelineDescription>First step completed</TimelineDescription>
            <TimelineTimestamp dateTime="2024-01-01">
              Jan 1, 2024
            </TimelineTimestamp>
          </TimelineContent>
        </TimelineItem>
        <TimelineItem status="active">
          <TimelineContent>
            <TimelineTitle>Step 2</TimelineTitle>
            <TimelineDescription>Currently in progress</TimelineDescription>
          </TimelineContent>
        </TimelineItem>
      </Timeline>
    )
    await checkA11y(container)
  })
})
