import { describe, it, expect, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useThemeCreator } from "../hooks/use-theme-creator";
import type { VisorThemeConfig } from "@loworbitstudio/visor-theme-engine";

describe("useThemeCreator", () => {
  it("returns default config when no initial config provided", () => {
    const { result } = renderHook(() => useThemeCreator());

    expect(result.current.config.name).toBe("custom");
    expect(result.current.config.version).toBe(1);
    expect(result.current.config.colors.primary).toBe("#6366F1");
  });

  it("accepts a custom initial config", () => {
    const custom: VisorThemeConfig = {
      name: "test-theme",
      version: 1,
      colors: { primary: "#FF0000" },
    };

    const { result } = renderHook(() => useThemeCreator(custom));

    expect(result.current.config.name).toBe("test-theme");
    expect(result.current.config.colors.primary).toBe("#FF0000");
  });

  it("generates themeData after debounce", async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useThemeCreator());

    // Initially null before debounce fires
    expect(result.current.themeData).toBeNull();

    // Advance past debounce
    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current.themeData).not.toBeNull();
    expect(result.current.themeData?.output.fullBundleCss).toBeTruthy();

    vi.useRealTimers();
  });

  it("generates validation result after debounce", async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useThemeCreator());

    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current.validationResult).not.toBeNull();
    expect(result.current.validationResult?.valid).toBe(true);

    vi.useRealTimers();
  });

  it("updateConfig updates nested config values", async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useThemeCreator());

    act(() => {
      result.current.updateConfig("colors.primary", "#00FF00");
    });

    expect(result.current.config.colors.primary).toBe("#00FF00");

    // Advance past debounce to trigger pipeline
    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current.themeData).not.toBeNull();

    vi.useRealTimers();
  });

  it("updateConfig updates top-level config values", async () => {
    const { result } = renderHook(() => useThemeCreator());

    act(() => {
      result.current.updateConfig("name", "renamed-theme");
    });

    expect(result.current.config.name).toBe("renamed-theme");
  });

  it("debounces rapid config updates", async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useThemeCreator());

    // Rapid updates
    act(() => {
      result.current.updateConfig("colors.primary", "#110000");
    });
    act(() => {
      result.current.updateConfig("colors.primary", "#220000");
    });
    act(() => {
      result.current.updateConfig("colors.primary", "#330000");
    });

    // Only the last value should stick
    expect(result.current.config.colors.primary).toBe("#330000");

    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    // Theme data should reflect the final value
    expect(result.current.themeData).not.toBeNull();

    vi.useRealTimers();
  });
});
