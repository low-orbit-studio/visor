import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import {
  deriveFamilySlug,
  collectWoff2Files,
  getNonWoff2Fonts,
  buildS3Key,
  fontsAddCommand,
} from "../commands/fonts-add.js";

let testDir: string;

beforeEach(() => {
  testDir = join(tmpdir(), `visor-test-fonts-${Date.now()}`);
  mkdirSync(testDir, { recursive: true });
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
    throw new Error(`process.exit(${code})`);
  }) as never);
});

afterEach(() => {
  rmSync(testDir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

// ============================================================
// deriveFamilySlug
// ============================================================

describe("deriveFamilySlug", () => {
  it("strips weight suffix and lowercases", () => {
    expect(deriveFamilySlug("PPModelMono-Light.woff2")).toBe("pp-model-mono");
  });

  it("strips bold suffix", () => {
    expect(deriveFamilySlug("Inter-Bold.woff2")).toBe("inter");
  });

  it("strips italic suffix", () => {
    expect(deriveFamilySlug("Roboto-Italic.woff2")).toBe("roboto");
  });

  it("strips compound weight-style suffix (BoldItalic)", () => {
    expect(deriveFamilySlug("Roboto-BoldItalic.woff2")).toBe("roboto");
  });

  it("handles single-word font names", () => {
    expect(deriveFamilySlug("Inter-Regular.woff2")).toBe("inter");
  });

  it("handles filename with no weight suffix", () => {
    expect(deriveFamilySlug("CustomFont.woff2")).toBe("custom-font");
  });

  it("handles filename with multiple hyphens", () => {
    expect(deriveFamilySlug("PP-Neue-Montreal-Bold.woff2")).toBe("pp-neue-montreal");
  });

  it("handles camelCase names", () => {
    expect(deriveFamilySlug("SourceCodePro-Medium.woff2")).toBe("source-code-pro");
  });

  it("preserves family when no known suffix matches", () => {
    expect(deriveFamilySlug("MyFont-Custom.woff2")).toBe("my-font-custom");
  });

  it("handles already-lowercased names", () => {
    expect(deriveFamilySlug("inter-semibold.woff2")).toBe("inter");
  });
});

// ============================================================
// collectWoff2Files
// ============================================================

describe("collectWoff2Files", () => {
  it("collects a single .woff2 file", () => {
    const file = join(testDir, "Font-Regular.woff2");
    writeFileSync(file, "fake-font-data");

    const result = collectWoff2Files(file);
    expect(result).toEqual([file]);
  });

  it("collects all .woff2 files from a directory", () => {
    writeFileSync(join(testDir, "Font-Regular.woff2"), "data");
    writeFileSync(join(testDir, "Font-Bold.woff2"), "data");
    writeFileSync(join(testDir, "readme.txt"), "not a font");

    const result = collectWoff2Files(testDir);
    expect(result).toHaveLength(2);
    expect(result.every((f) => f.endsWith(".woff2"))).toBe(true);
  });

  it("throws on non-woff2 single file", () => {
    const file = join(testDir, "Font.ttf");
    writeFileSync(file, "fake-font");

    expect(() => collectWoff2Files(file)).toThrow(
      "Invalid file format: Font.ttf. Only .woff2 files are accepted."
    );
  });

  it("throws when directory has no .woff2 files", () => {
    writeFileSync(join(testDir, "readme.txt"), "text");

    expect(() => collectWoff2Files(testDir)).toThrow(
      "No .woff2 files found in directory"
    );
  });

  it("throws when path does not exist", () => {
    expect(() => collectWoff2Files("/nonexistent/path")).toThrow(
      "Path not found"
    );
  });

  it("returns files sorted alphabetically", () => {
    writeFileSync(join(testDir, "Zeta.woff2"), "data");
    writeFileSync(join(testDir, "Alpha.woff2"), "data");
    writeFileSync(join(testDir, "Middle.woff2"), "data");

    const result = collectWoff2Files(testDir);
    const filenames = result.map((f) => f.split("/").pop());
    expect(filenames).toEqual(["Alpha.woff2", "Middle.woff2", "Zeta.woff2"]);
  });
});

// ============================================================
// getNonWoff2Fonts
// ============================================================

describe("getNonWoff2Fonts", () => {
  it("returns non-woff2 font files", () => {
    writeFileSync(join(testDir, "Font.woff2"), "data");
    writeFileSync(join(testDir, "Font.ttf"), "data");
    writeFileSync(join(testDir, "Font.otf"), "data");
    writeFileSync(join(testDir, "readme.txt"), "text");

    const result = getNonWoff2Fonts(testDir);
    expect(result).toHaveLength(2);
    expect(result).toContain("Font.ttf");
    expect(result).toContain("Font.otf");
  });

  it("returns empty array for non-existent path", () => {
    expect(getNonWoff2Fonts("/nonexistent")).toEqual([]);
  });

  it("returns empty array for a file path", () => {
    const file = join(testDir, "test.woff2");
    writeFileSync(file, "data");
    expect(getNonWoff2Fonts(file)).toEqual([]);
  });
});

// ============================================================
// buildS3Key
// ============================================================

describe("buildS3Key", () => {
  it("builds correct key with org/family/filename pattern", () => {
    expect(buildS3Key("low-orbit", "pp-model-mono", "PPModelMono-Light.woff2")).toBe(
      "low-orbit/pp-model-mono/PPModelMono-Light.woff2"
    );
  });

  it("handles different org names", () => {
    expect(buildS3Key("acme-corp", "inter", "Inter-Bold.woff2")).toBe(
      "acme-corp/inter/Inter-Bold.woff2"
    );
  });
});

// ============================================================
// fontsAddCommand (integration-level)
// ============================================================

describe("fontsAddCommand", () => {
  it("fails with missing R2 env vars", async () => {
    const file = join(testDir, "Font-Regular.woff2");
    writeFileSync(file, "fake-font-data");

    // Ensure env vars are not set
    delete process.env.VISOR_R2_ACCESS_KEY_ID;
    delete process.env.VISOR_R2_SECRET_ACCESS_KEY;
    delete process.env.VISOR_R2_ENDPOINT;

    await expect(
      fontsAddCommand(file, { org: "test-org" })
    ).rejects.toThrow("process.exit(2)");
  });

  it("outputs JSON error when env vars missing and --json set", async () => {
    const file = join(testDir, "Font-Regular.woff2");
    writeFileSync(file, "fake-font-data");

    delete process.env.VISOR_R2_ACCESS_KEY_ID;
    delete process.env.VISOR_R2_SECRET_ACCESS_KEY;
    delete process.env.VISOR_R2_ENDPOINT;

    await expect(
      fontsAddCommand(file, { org: "test-org", json: true })
    ).rejects.toThrow("process.exit(2)");

    const logCalls = (console.log as ReturnType<typeof vi.fn>).mock.calls;
    const jsonOutput = logCalls.find((call) => {
      try {
        const parsed = JSON.parse(call[0]);
        return parsed.success === false;
      } catch {
        return false;
      }
    });
    expect(jsonOutput).toBeDefined();
    const parsed = JSON.parse(jsonOutput![0]);
    expect(parsed.error).toContain("Missing required environment variables");
  });

  it("fails when path does not exist", async () => {
    process.env.VISOR_R2_ACCESS_KEY_ID = "test-key";
    process.env.VISOR_R2_SECRET_ACCESS_KEY = "test-secret";
    process.env.VISOR_R2_ENDPOINT = "https://test.r2.dev";

    await expect(
      fontsAddCommand("/nonexistent/path", { org: "test-org" })
    ).rejects.toThrow("process.exit(2)");

    delete process.env.VISOR_R2_ACCESS_KEY_ID;
    delete process.env.VISOR_R2_SECRET_ACCESS_KEY;
    delete process.env.VISOR_R2_ENDPOINT;
  });

  it("fails with non-woff2 file", async () => {
    const file = join(testDir, "Font.ttf");
    writeFileSync(file, "fake-font-data");

    process.env.VISOR_R2_ACCESS_KEY_ID = "test-key";
    process.env.VISOR_R2_SECRET_ACCESS_KEY = "test-secret";
    process.env.VISOR_R2_ENDPOINT = "https://test.r2.dev";

    await expect(
      fontsAddCommand(file, { org: "test-org" })
    ).rejects.toThrow("process.exit(2)");

    delete process.env.VISOR_R2_ACCESS_KEY_ID;
    delete process.env.VISOR_R2_SECRET_ACCESS_KEY;
    delete process.env.VISOR_R2_ENDPOINT;
  });
});
