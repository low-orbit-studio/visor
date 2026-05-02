import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, fireEvent, screen } from "@testing-library/react";
import { PrivateThemeSwitcher } from "../private-theme-switcher";
import type { PrivateThemeEntry } from "@/lib/private-themes";

const FIXTURES: PrivateThemeEntry[] = [
  { slug: "alpha", label: "Alpha", group: "Client" },
  { slug: "bravo", label: "Bravo", group: "Client" },
  { slug: "charlie", label: "Charlie", group: "Low Orbit" },
];

describe("PrivateThemeSwitcher", () => {
  beforeEach(() => {
    document.body.className = "";
  });

  afterEach(() => {
    document.body.className = "";
  });

  it("applies the first theme's class to body on mount", () => {
    render(<PrivateThemeSwitcher themes={FIXTURES} />);
    expect(document.body.classList.contains("alpha-theme")).toBe(true);
  });

  it("renders the active theme label in the trigger", () => {
    render(<PrivateThemeSwitcher themes={FIXTURES} />);
    expect(screen.getByRole("combobox")).toHaveTextContent("Alpha");
  });

  it("removes prior theme class when switching", () => {
    document.body.classList.add("blackout-theme", "some-other-class");
    render(<PrivateThemeSwitcher themes={FIXTURES} />);
    expect(document.body.classList.contains("blackout-theme")).toBe(false);
    expect(document.body.classList.contains("alpha-theme")).toBe(true);
    expect(document.body.classList.contains("some-other-class")).toBe(true);
  });

  it("renders nothing in the trigger when given an empty list", () => {
    render(<PrivateThemeSwitcher themes={[]} />);
    expect(document.body.classList.length).toBe(0);
  });
});
