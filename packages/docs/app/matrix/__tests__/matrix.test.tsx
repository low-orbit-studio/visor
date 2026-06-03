import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { checkA11y } from "../../../../../test-utils/a11y";

// Deterministic theme registry (independent of whether the private package is
// installed): no custom themes, plus one adaptive Client + one dark-locked Low
// Orbit private theme. So `all` = 5 stock + 0 custom + 2 private = 7 rows.
vi.mock("@/lib/theme-config.custom.generated", () => ({
  customThemeGroups: [],
}));
vi.mock("@/lib/private-themes", () => ({
  PRIVATE_THEMES: [
    { slug: "animal", label: "Animal", group: "Client" },
    { slug: "blacklight", label: "Blacklight", group: "Low Orbit", defaultMode: "dark" },
  ],
}));

const mocks = vi.hoisted(() => ({ params: new URLSearchParams() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => mocks.params,
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) =>
    <a href={href} {...props}>{children}</a>,
}));

import MatrixPage from "../page";

function frames(container: HTMLElement): HTMLIFrameElement[] {
  return Array.from(container.querySelectorAll("iframe"));
}

describe("MatrixPage", () => {
  beforeEach(() => {
    mocks.params = new URLSearchParams();
  });

  it("renders one row per theme in the set, grouped, defaulting to the Form section across all themes", () => {
    const { container } = render(<MatrixPage />);

    // all = 5 stock + 0 custom + 2 mocked private = 7 rows.
    expect(frames(container)).toHaveLength(7);

    // Group headings, in registry order.
    const heads = Array.from(container.querySelectorAll(".groupHead")).map((h) => h.textContent);
    expect(heads).toEqual(["Visor", "Client", "Low Orbit"]);

    // Default section selector reads "Form".
    expect(screen.getByRole("combobox", { name: "Component or block" })).toHaveTextContent("Form");
  });

  it("builds each iframe src from theme + effective mode + section", () => {
    const { container } = render(<MatrixPage />);
    const srcs = frames(container).map((f) => f.getAttribute("src") ?? "");

    // Adaptive theme under Default mode → dark fallback.
    expect(srcs).toContainEqual("/matrix/panel?theme=blackout&mode=dark&section=form");
    // Dark-locked theme → dark regardless.
    expect(srcs).toContainEqual("/matrix/panel?theme=blacklight&mode=dark&section=form");
    // Every row points at the panel route and lazy-loads.
    expect(frames(container).every((f) => f.getAttribute("loading") === "lazy")).toBe(true);
  });

  it("badges adaptive vs fixed themes with their effective mode", () => {
    const { container } = render(<MatrixPage />);
    const badges = Array.from(container.querySelectorAll(".themeMode")).map((b) => b.textContent);
    expect(badges).toContainEqual("adaptive · dark"); // blackout et al.
    expect(badges).toContainEqual("fixed · dark"); // blacklight (locked)
  });

  it("honors the theme-set URL param (stock → no private rows)", () => {
    mocks.params = new URLSearchParams("themes=stock");
    const { container } = render(<MatrixPage />);
    expect(frames(container)).toHaveLength(5);
    const heads = Array.from(container.querySelectorAll(".groupHead")).map((h) => h.textContent);
    expect(heads).toEqual(["Visor"]);
  });

  it("honors light mode for adaptive themes while locked themes stay fixed", () => {
    mocks.params = new URLSearchParams("mode=light&section=showcase");
    const { container } = render(<MatrixPage />);
    const srcs = frames(container).map((f) => f.getAttribute("src") ?? "");
    expect(srcs).toContainEqual("/matrix/panel?theme=blackout&mode=light&section=showcase");
    // Locked theme ignores the light selection.
    expect(srcs).toContainEqual("/matrix/panel?theme=blacklight&mode=dark&section=showcase");
  });

  it("passes accessibility checks", async () => {
    const { container } = render(<MatrixPage />);
    // Don't descend into the row iframes — they're separate documents (and jsdom
    // iframes aren't real frames axe can post into); we check the matrix chrome.
    await checkA11y(container, { iframes: false });
  });
});
