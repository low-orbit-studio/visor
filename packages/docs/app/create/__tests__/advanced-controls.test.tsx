import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdvancedControls } from "../components/advanced-controls";

const defaultProps = {
  shadowXs: "",
  shadowSm: "",
  shadowMd: "",
  shadowLg: "",
  shadowXl: "",
  motionDurationFast: "100ms",
  motionDurationNormal: "200ms",
  motionDurationSlow: "500ms",
  motionEasing: "cubic-bezier(0.4, 0, 0.2, 1)",
  onShadowChange: vi.fn(),
  onMotionDurationChange: vi.fn(),
  onMotionEasingChange: vi.fn(),
};

describe("AdvancedControls", () => {
  it("renders the accordion trigger", () => {
    render(<AdvancedControls {...defaultProps} />);
    expect(screen.getByText("Advanced")).toBeInTheDocument();
  });

  it("shows shadow and motion controls when expanded", async () => {
    render(<AdvancedControls {...defaultProps} />);

    // Click the accordion to open
    await userEvent.click(screen.getByText("Advanced"));

    expect(screen.getByText("Shadows")).toBeInTheDocument();
    expect(screen.getByText("Motion")).toBeInTheDocument();
  });

  it("renders shadow inputs with default placeholders when expanded", async () => {
    render(<AdvancedControls {...defaultProps} />);
    await userEvent.click(screen.getByText("Advanced"));

    const shadowXsInput = screen.getByLabelText("Shadow xs");
    expect(shadowXsInput).toBeInTheDocument();
    expect(shadowXsInput).toHaveAttribute(
      "placeholder",
      "0 1px 1px 0 rgba(0, 0, 0, 0.04)"
    );
  });

  it("renders all 5 shadow size inputs when expanded", async () => {
    render(<AdvancedControls {...defaultProps} />);
    await userEvent.click(screen.getByText("Advanced"));

    expect(screen.getByLabelText("Shadow xs")).toBeInTheDocument();
    expect(screen.getByLabelText("Shadow sm")).toBeInTheDocument();
    expect(screen.getByLabelText("Shadow md")).toBeInTheDocument();
    expect(screen.getByLabelText("Shadow lg")).toBeInTheDocument();
    expect(screen.getByLabelText("Shadow xl")).toBeInTheDocument();
  });

  it("renders motion duration inputs when expanded", async () => {
    render(<AdvancedControls {...defaultProps} />);
    await userEvent.click(screen.getByText("Advanced"));

    expect(screen.getByLabelText("Motion duration-fast")).toBeInTheDocument();
    expect(screen.getByLabelText("Motion duration-normal")).toBeInTheDocument();
    expect(screen.getByLabelText("Motion duration-slow")).toBeInTheDocument();
  });

  it("renders motion easing input when expanded", async () => {
    render(<AdvancedControls {...defaultProps} />);
    await userEvent.click(screen.getByText("Advanced"));

    const easingInput = screen.getByLabelText("Motion easing");
    expect(easingInput).toHaveValue("cubic-bezier(0.4, 0, 0.2, 1)");
  });

  it("calls onShadowChange when shadow input changes", async () => {
    const onShadowChange = vi.fn();
    render(
      <AdvancedControls {...defaultProps} onShadowChange={onShadowChange} />
    );
    await userEvent.click(screen.getByText("Advanced"));

    const shadowXsInput = screen.getByLabelText("Shadow xs");
    await userEvent.type(shadowXsInput, "0 1px 2px black");

    expect(onShadowChange).toHaveBeenCalled();
    // Should have been called with "xs" as the size
    expect(onShadowChange.mock.calls[0][0]).toBe("xs");
  });

  it("calls onMotionEasingChange when easing input changes", async () => {
    const onMotionEasingChange = vi.fn();
    render(
      <AdvancedControls
        {...defaultProps}
        motionEasing=""
        onMotionEasingChange={onMotionEasingChange}
      />
    );
    await userEvent.click(screen.getByText("Advanced"));

    const easingInput = screen.getByLabelText("Motion easing");
    await userEvent.type(easingInput, "ease-in-out");

    expect(onMotionEasingChange).toHaveBeenCalled();
  });
});
