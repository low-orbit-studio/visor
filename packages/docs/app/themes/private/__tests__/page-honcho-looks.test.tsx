import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";

vi.mock("@/lib/private-themes", () => ({
  PRIVATE_THEMES: [
    { slug: "honcho", label: "Honcho", group: "Client" },
    { slug: "honcho-backstage", label: "Honcho Backstage", group: "Client" },
  ],
}));

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("notFound() called");
  },
}));

import PrivateThemesPage from "../page";

describe("PrivateThemesPage with honcho-backstage installed", () => {
  it("shows Honcho's five looks: Today on honcho, the rest on honcho-backstage", () => {
    const { container } = render(<PrivateThemesPage />);
    const section = container.querySelector('[data-slot="honcho-looks"]');
    expect(section).toBeTruthy();
    const looks = Array.from(section!.querySelectorAll("figure")).map((f) => [
      f.querySelector("figcaption")!.textContent,
      new URL(f.querySelector("iframe")!.getAttribute("src")!, "http://x").searchParams.get("theme"),
    ]);
    expect(looks).toEqual([
      ["Today", "honcho"],
      ["Dark", "honcho-backstage"],
      ["Dark + Photo", "honcho-backstage"],
      ["Light", "honcho-backstage"],
      ["Light + Photo", "honcho-backstage"],
    ]);
  });
});
