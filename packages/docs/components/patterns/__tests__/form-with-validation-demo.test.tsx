import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FormWithValidationDemo } from "../form-with-validation-demo";

describe("FormWithValidationDemo", () => {
  it("renders without throwing", () => {
    expect(() => render(<FormWithValidationDemo />)).not.toThrow();
  });

  it("renders a form", () => {
    render(<FormWithValidationDemo />);
    expect(screen.getByRole("form")).toBeInTheDocument();
  });

  it("renders a submit button with 'Create account' text", () => {
    render(<FormWithValidationDemo />);
    expect(
      screen.getByRole("button", { name: /create account/i })
    ).toBeInTheDocument();
  });
});
