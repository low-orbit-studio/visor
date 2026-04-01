import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { StartFromDropdown } from "../components/start-from-dropdown";

const kaiaYaml = `name: kaiah
version: 1
colors:
  primary: "#3B2F1A"
  accent: "#F5F0E6"
`;

const mockParseConfig = vi.fn((yaml: string) => ({
  name: "kaiah",
  version: 1,
  colors: {
    primary: "#3B2F1A",
    accent: "#F5F0E6",
  },
}));

vi.mock("@loworbitstudio/visor-theme-engine", () => ({
  parseConfig: (yaml: string) => mockParseConfig(yaml),
}));

vi.mock("@/lib/theme-config", () => ({
  THEME_GROUPS: [
    {
      label: "Visor",
      themes: [{ value: "blackout", label: "Blackout" }],
    },
    {
      label: "Low Orbit",
      themes: [{ value: "kaiah", label: "Kaiah" }],
    },
  ],
}));

describe("StartFromDropdown", () => {
  const onLoadConfig = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("renders with Blank as default option", () => {
    render(<StartFromDropdown onLoadConfig={onLoadConfig} />);
    const select = screen.getByLabelText("Start from");
    expect(select).toHaveValue("blank");
  });

  it("shows theme options grouped by label", () => {
    render(<StartFromDropdown onLoadConfig={onLoadConfig} />);
    expect(screen.getByText("Blackout")).toBeInTheDocument();
    expect(screen.getByText("Kaiah")).toBeInTheDocument();
  });

  it("loads default config when Blank is selected", () => {
    render(<StartFromDropdown onLoadConfig={onLoadConfig} />);
    fireEvent.change(screen.getByLabelText("Start from"), {
      target: { value: "blank" },
    });
    expect(onLoadConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "custom",
        version: 1,
        colors: expect.objectContaining({ primary: "#6366F1" }),
      })
    );
  });

  it("fetches and loads theme config on selection", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(kaiaYaml),
    });

    render(<StartFromDropdown onLoadConfig={onLoadConfig} />);
    fireEvent.change(screen.getByLabelText("Start from"), {
      target: { value: "kaiah" },
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/themes/kaiah.visor.yaml");
      expect(mockParseConfig).toHaveBeenCalledWith(kaiaYaml);
      expect(onLoadConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "kaiah",
          colors: expect.objectContaining({ primary: "#3B2F1A" }),
        })
      );
    });
  });

  it("handles fetch errors gracefully", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    render(<StartFromDropdown onLoadConfig={onLoadConfig} />);
    fireEvent.change(screen.getByLabelText("Start from"), {
      target: { value: "kaiah" },
    });

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
      expect(onLoadConfig).not.toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });
});
