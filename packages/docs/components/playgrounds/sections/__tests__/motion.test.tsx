import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SECTIONS, findSection } from "../index";
import { MotionSection } from "../motion";

describe("Motion section registration", () => {
  it("is registered in SECTIONS with id 'motion' and label 'Motion'", () => {
    const motion = SECTIONS.find((s) => s.id === "motion");
    expect(motion).toBeDefined();
    expect(motion?.label).toBe("Motion");
    expect(motion?.Component).toBe(MotionSection);
  });

  it("is selectable via findSection", () => {
    expect(findSection("motion").id).toBe("motion");
  });
});

describe("MotionSection rendering", () => {
  it("renders the easing set including the spring/overshoot curve", () => {
    render(<MotionSection />);
    expect(screen.getByText("spring")).toBeInTheDocument();
    expect(screen.getByText("cubic-bezier(0.34, 1.56, 0.64, 1)")).toBeInTheDocument();
    expect(screen.getByText("ease-out")).toBeInTheDocument();
  });

  it("renders fast / normal / slow durations", () => {
    render(<MotionSection />);
    expect(screen.getByText("100ms")).toBeInTheDocument();
    expect(screen.getByText("200ms")).toBeInTheDocument();
    expect(screen.getByText("500ms")).toBeInTheDocument();
  });

  it("provides replay controls for both specimens", () => {
    render(<MotionSection />);
    // MotionEasing + MotionDuration each render their own "Play animation" button.
    expect(screen.getAllByRole("button", { name: "Play animation" })).toHaveLength(2);
  });
});
