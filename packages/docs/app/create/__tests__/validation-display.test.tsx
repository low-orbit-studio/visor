import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ValidationDisplay } from "../components/validation-display";
import type { ThemeValidationResult } from "@loworbitstudio/visor-theme-engine";

describe("ValidationDisplay", () => {
  it("renders nothing when result is null", () => {
    const { container } = render(<ValidationDisplay result={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders valid message when no issues", () => {
    const result: ThemeValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
    };

    render(<ValidationDisplay result={result} />);
    expect(screen.getByText("Theme is valid")).toBeInTheDocument();
  });

  it("renders errors with severity label", () => {
    const result: ThemeValidationResult = {
      valid: false,
      errors: [
        {
          severity: "error",
          code: "INVALID_COLOR",
          message: "Primary color is invalid",
          path: "colors.primary",
        },
      ],
      warnings: [],
    };

    render(<ValidationDisplay result={result} />);
    expect(screen.getByText("Error")).toBeInTheDocument();
    expect(screen.getByText("Primary color is invalid")).toBeInTheDocument();
    expect(screen.getByText("colors.primary")).toBeInTheDocument();
  });

  it("renders warnings with severity label", () => {
    const result: ThemeValidationResult = {
      valid: true,
      errors: [],
      warnings: [
        {
          severity: "warning",
          code: "LOW_CONTRAST",
          message: "Low contrast ratio detected",
        },
      ],
    };

    render(<ValidationDisplay result={result} />);
    expect(screen.getByText("Warning")).toBeInTheDocument();
    expect(screen.getByText("Low contrast ratio detected")).toBeInTheDocument();
  });

  it("renders both errors and warnings", () => {
    const result: ThemeValidationResult = {
      valid: false,
      errors: [
        {
          severity: "error",
          code: "MISSING_NAME",
          message: "Theme name is required",
        },
      ],
      warnings: [
        {
          severity: "warning",
          code: "SIMILAR_COLORS",
          message: "Primary and accent are similar",
        },
      ],
    };

    render(<ValidationDisplay result={result} />);
    expect(screen.getByText("Error")).toBeInTheDocument();
    expect(screen.getByText("Theme name is required")).toBeInTheDocument();
    expect(screen.getByText("Warning")).toBeInTheDocument();
    expect(
      screen.getByText("Primary and accent are similar")
    ).toBeInTheDocument();
  });
});
