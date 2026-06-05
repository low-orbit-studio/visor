import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";

// Partial-mock theme-config so individual tests can drive `resolveBrand`'s
// return value. The default is a passthrough to the real resolver, so the
// existing suite below (which relies on the Visor default brand) is unaffected.
vi.mock("@/lib/theme-config", async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import("@/lib/theme-config");
  return { ...actual, resolveBrand: vi.fn(actual.resolveBrand) };
});

import { BrandSection } from "../brand";
import { resolveBrand, VISOR_DEFAULT_BRAND, DEFAULT_THEME, THEME_STORAGE_KEY } from "@/lib/theme-config";

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

describe("BrandSection — theme prop precedence (VI-521)", () => {
  afterEach(() => {
    localStorage.clear();
    mockedResolveBrand.mockClear();
  });

  it("resolves brand marks from the theme prop, not the stored theme (matrix row / compare pane)", () => {
    // A multi-theme surface (matrix iframe, compare pane) threads its own theme as
    // a prop. Even with a different theme stored globally, the prop must win — this
    // is the VI-521 fix for row/pane-correct brand content.
    localStorage.setItem(THEME_STORAGE_KEY, "space");
    render(<BrandSection theme="blackout" />);
    expect(mockedResolveBrand).toHaveBeenCalledWith("blackout");
    expect(mockedResolveBrand).not.toHaveBeenCalledWith("space");
  });

  it("falls back to the stored theme when no prop is given (single-pane unchanged)", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "space");
    render(<BrandSection />);
    expect(mockedResolveBrand).toHaveBeenCalledWith("space");
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

describe("BrandSection — private themes (VI-489)", () => {
  afterEach(() => {
    localStorage.clear();
    mockedResolveBrand.mockClear();
  });

  it("follows a private slug and renders that theme's marks when passed via privateThemes", () => {
    mockedResolveBrand.mockImplementation((t) =>
      t === "blacklight"
        ? {
            ...VISOR_DEFAULT_BRAND,
            logo: {
              light: "/themes/blacklight/brand/bl-logo-light.svg",
              dark: "/themes/blacklight/brand/bl-logo-dark.svg",
            },
          }
        : VISOR_DEFAULT_BRAND,
    );
    localStorage.setItem(THEME_STORAGE_KEY, "blacklight");

    const { container } = render(
      <BrandSection privateThemes={[{ slug: "blacklight", label: "Blacklight", group: "Low Orbit" }]} />,
    );

    expect(mockedResolveBrand).toHaveBeenCalledWith("blacklight");
    const logo = container.querySelector('[data-variant="logo"]') as HTMLElement;
    const lightImg = logo.querySelector('[data-ground="light"] img') as HTMLImageElement;
    expect(lightImg.getAttribute("src")).toContain("/themes/blacklight/brand/bl-logo-light.svg");
  });

  it("ignores a private slug in storage when privateThemes is omitted (route-scoped CSS, D5)", () => {
    mockedResolveBrand.mockImplementation(() => VISOR_DEFAULT_BRAND);
    localStorage.setItem(THEME_STORAGE_KEY, "blacklight");

    render(<BrandSection />);

    expect(mockedResolveBrand).not.toHaveBeenCalledWith("blacklight");
    expect(mockedResolveBrand).toHaveBeenCalledWith(DEFAULT_THEME);
  });
});
