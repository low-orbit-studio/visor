import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ExportBar } from "../components/export-bar";
import type { ThemeData, ThemeValidationResult } from "@loworbitstudio/visor-theme-engine";

const mockExportTheme = vi.fn(() => "name: test\nversion: 1\ncolors:\n  primary: \"#6366F1\"\n");

vi.mock("@loworbitstudio/visor-theme-engine", () => ({
  exportTheme: (...args: unknown[]) => mockExportTheme(...args),
}));

vi.mock("@/components/ui/toast", () => ({
  toast: vi.fn(),
}));

vi.mock("@phosphor-icons/react", () => ({
  DownloadSimple: ({ size, weight }: { size: number; weight: string }) => (
    <span data-testid="download-icon" />
  ),
  Copy: ({ size, weight }: { size: number; weight: string }) => (
    <span data-testid="copy-icon" />
  ),
}));

const mockThemeData = {
  config: { name: "test", version: 1, colors: { primary: "#6366F1" } },
  primitives: { primary: { 600: "#6366F1" } },
  tokens: {},
  output: { fullBundleCss: "" },
} as unknown as ThemeData;

const validResult: ThemeValidationResult = {
  valid: true,
  errors: [],
  warnings: [],
};

const invalidResult: ThemeValidationResult = {
  valid: false,
  errors: [{ severity: "error" as const, code: "E001", message: "Bad" }],
  warnings: [],
};

describe("ExportBar", () => {
  const onNameChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders theme name input", () => {
    render(
      <ExportBar
        themeName="my-theme"
        onNameChange={onNameChange}
        themeData={mockThemeData}
        validationResult={validResult}
      />
    );
    const input = screen.getByLabelText("Theme name");
    expect(input).toHaveValue("my-theme");
  });

  it("calls onNameChange when input changes", () => {
    render(
      <ExportBar
        themeName="my-theme"
        onNameChange={onNameChange}
        themeData={mockThemeData}
        validationResult={validResult}
      />
    );
    fireEvent.change(screen.getByLabelText("Theme name"), {
      target: { value: "new-name" },
    });
    expect(onNameChange).toHaveBeenCalledWith("new-name");
  });

  it("disables download when name is empty", () => {
    render(
      <ExportBar
        themeName=""
        onNameChange={onNameChange}
        themeData={mockThemeData}
        validationResult={validResult}
      />
    );
    expect(screen.getByTitle("Enter a theme name to export")).toBeDisabled();
  });

  it("disables download when validation has errors", () => {
    render(
      <ExportBar
        themeName="my-theme"
        onNameChange={onNameChange}
        themeData={mockThemeData}
        validationResult={invalidResult}
      />
    );
    expect(
      screen.getByTitle("Fix validation errors before exporting")
    ).toBeDisabled();
  });

  it("calls exportTheme and triggers download on click", () => {
    global.URL.createObjectURL = vi.fn(() => "blob:test");
    global.URL.revokeObjectURL = vi.fn();

    const { container } = render(
      <ExportBar
        themeName="my-theme"
        onNameChange={onNameChange}
        themeData={mockThemeData}
        validationResult={validResult}
      />
    );

    // Spy after render so we don't interfere with RTL's DOM operations
    const appendSpy = vi.spyOn(document.body, "appendChild");
    const removeSpy = vi.spyOn(document.body, "removeChild").mockImplementation((el) => el);

    fireEvent.click(screen.getByTitle("Download .visor.yaml"));
    expect(mockExportTheme).toHaveBeenCalledWith(
      mockThemeData.primitives,
      mockThemeData.config
    );

    appendSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it("copies CLI command to clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(
      <ExportBar
        themeName="my-theme"
        onNameChange={onNameChange}
        themeData={mockThemeData}
        validationResult={validResult}
      />
    );

    fireEvent.click(screen.getByTitle("Copy CLI apply command"));
    expect(writeText).toHaveBeenCalledWith(
      "npx visor theme apply my-theme.visor.yaml"
    );
  });
});
