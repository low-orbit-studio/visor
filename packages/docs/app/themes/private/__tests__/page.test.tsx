import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render } from "@testing-library/react";

vi.mock("@/lib/private-themes", () => ({
  PRIVATE_THEMES: [
    { slug: "animal", label: "Animal", group: "Client" },
    { slug: "blacklight", label: "Blacklight", group: "Low Orbit" },
  ],
}));

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("notFound() called");
  },
}));

// Import after mocks so the page consumes the mocked PRIVATE_THEMES.
import PrivateThemesPage from "../page";

describe("PrivateThemesPage", () => {
  beforeEach(() => {
    document.body.className = "";
  });

  afterEach(() => {
    document.body.className = "";
  });

  it("does not hardcode a *-theme class on the page wrapper", () => {
    const { container } = render(<PrivateThemesPage />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper).toBeTruthy();
    const themeClass = Array.from(wrapper.classList).find((c) => /-theme$/.test(c));
    expect(themeClass).toBeUndefined();
  });

  it("renders the page wrapper with the styles.page class", () => {
    const { container } = render(<PrivateThemesPage />);
    const wrapper = container.firstElementChild as HTMLElement;
    // CSS modules use non-scoped strategy in tests → class is literal "page".
    expect(wrapper.classList).toContain("page");
  });
});
