import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

// Partial-mock theme-config so individual tests can drive `resolveBrand`'s
// return value. The default is a passthrough to the real resolver, so the
// existing suite below (which relies on the Visor default brand) is unaffected.
vi.mock("@/lib/theme-config", async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import("@/lib/theme-config");
  return { ...actual, resolveBrand: vi.fn(actual.resolveBrand) };
});

import { BrandSection } from "../brand";
import { resolveBrand, VISOR_DEFAULT_BRAND } from "@/lib/theme-config";

const mockedResolveBrand = vi.mocked(resolveBrand);

describe("BrandSection", () => {
  it("renders all four brand variants by default", () => {
    const { container } = render(<BrandSection />);
    const variants = Array.from(
      container.querySelectorAll('[data-slot="brand-variant"]')
    ).map((el) => el.getAttribute("data-variant"));
    expect(variants).toEqual(["logo", "brandmark", "wordmark", "monochrome"]);
  });

  it("shows the light asset on the light ground and the dark asset on the dark ground", () => {
    const { container } = render(<BrandSection />);
    const logo = container.querySelector('[data-variant="logo"]') as HTMLElement;

    const lightImg = logo.querySelector('[data-ground="light"] img') as HTMLImageElement;
    const darkImg = logo.querySelector('[data-ground="dark"] img') as HTMLImageElement;

    expect(lightImg.getAttribute("src")).toContain("visor-logo-light.svg");
    expect(darkImg.getAttribute("src")).toContain("visor-logo-dark.svg");
  });

  it("tints the monochrome mark via mask-image (no inline <svg> or <img>)", () => {
    const { container } = render(<BrandSection />);
    const mono = container.querySelector('[data-variant="monochrome"]') as HTMLElement;

    const tints = mono.querySelectorAll('[data-slot="brand-tint"]');
    expect(tints.length).toBe(3);

    // The mark is a masked element, not a raster <img> or inline <svg>.
    expect(mono.querySelector("img")).toBeNull();
    expect(mono.querySelector("svg")).toBeNull();

    const firstTint = tints[0] as HTMLElement;
    expect(firstTint.style.getPropertyValue("--mono-src")).toContain("visor-monochrome.svg");
    expect(firstTint.style.color).toContain("--text-primary");
  });

  it("hides a variant when its per-variant toggle is turned off", () => {
    const { container } = render(<BrandSection />);
    expect(container.querySelector('[data-variant="logo"]')).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Logo" }));

    expect(container.querySelector('[data-variant="logo"]')).toBeNull();
    // Other variants remain.
    expect(container.querySelector('[data-variant="brandmark"]')).not.toBeNull();
  });

  it("defaults stock themes to the Visor brand assets", () => {
    const { container } = render(<BrandSection />);
    const brandmark = container.querySelector('[data-variant="brandmark"]') as HTMLElement;
    const img = within(brandmark).getAllByRole("img")[0] as HTMLImageElement;
    expect(img.getAttribute("src")).toContain("/themes/visor/brand/visor-");
  });
});

describe("BrandSection — animated slot (VI-488)", () => {
  it("renders the animated variant via <img> when the theme declares one", () => {
    mockedResolveBrand.mockReturnValue({
      ...VISOR_DEFAULT_BRAND,
      animated: {
        light: "/themes/test/brand/animated-light.svg",
        dark: "/themes/test/brand/animated-dark.svg",
      },
    });
    const { container } = render(<BrandSection />);
    const section = container.querySelector('[data-variant="animated"]');
    expect(section).not.toBeNull();
    const img = section?.querySelector("img") as HTMLImageElement;
    expect(img).not.toBeNull();
    expect(img.getAttribute("src")).toContain("animated-light.svg");
  });

  it("omits the animated variant when the theme declares none (optional, D2)", () => {
    mockedResolveBrand.mockReturnValue(VISOR_DEFAULT_BRAND);
    const { container } = render(<BrandSection />);
    expect(container.querySelector('[data-variant="animated"]')).toBeNull();
  });
});
