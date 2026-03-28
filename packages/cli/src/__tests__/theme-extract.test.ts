import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { themeExtractCommand } from "../commands/theme-extract.js";

const SAMPLE_CSS = `:root {
  --primary-600: #6366f1;
  --primary-700: #4f46e5;
  --accent-600: #f59e0b;
  --neutral-900: #111827;
  --neutral-50: #f9fafb;
  --text-primary: #111827;
  --text-link: #6366f1;
  --surface-page: #ffffff;
  --surface-card: #ffffff;
  --border-default: #e5e7eb;
  --interactive-primary-bg: #6366f1;
  --radius-sm: 2;
  --radius-md: 4;
  --radius-lg: 8;
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --font-family-heading: "Inter";
  --font-weight-heading: 700;
  --spacing-base: 4;
  --motion-duration-fast: 100ms;
}
.dark {
  --surface-page: #0a0a0a;
  --background: #000000;
}
`;

const MINIMAL_CSS = `:root {
  --primary-600: #ff0000;
}`;

let testDir: string;
let outputDir: string;

beforeEach(() => {
  testDir = join(tmpdir(), `visor-test-extract-${Date.now()}`);
  outputDir = join(tmpdir(), `visor-test-extract-out-${Date.now()}`);
  mkdirSync(testDir, { recursive: true });
  mkdirSync(outputDir, { recursive: true });
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
    throw new Error(`process.exit(${code})`);
  }) as never);
});

afterEach(() => {
  rmSync(testDir, { recursive: true, force: true });
  rmSync(outputDir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe("theme extract command", () => {
  it("extracts theme from CSS and writes .visor.yaml", () => {
    writeFileSync(join(testDir, "globals.css"), SAMPLE_CSS, "utf-8");

    themeExtractCommand(outputDir, { from: testDir });

    const outputPath = join(outputDir, ".visor.yaml");
    expect(existsSync(outputPath)).toBe(true);

    const content = readFileSync(outputPath, "utf-8");
    expect(content).toContain("name:");
    expect(content).toContain("version: 1");
    expect(content).toContain("colors:");
  });

  it("writes to custom output path", () => {
    writeFileSync(join(testDir, "globals.css"), SAMPLE_CSS, "utf-8");
    const customOutput = join(outputDir, "my-theme.yaml");

    themeExtractCommand(outputDir, { from: testDir, output: customOutput });

    expect(existsSync(customOutput)).toBe(true);
  });

  it("outputs structured JSON with --json flag", () => {
    writeFileSync(join(testDir, "globals.css"), SAMPLE_CSS, "utf-8");

    themeExtractCommand(outputDir, { from: testDir, json: true });

    const calls = (console.log as ReturnType<typeof vi.fn>).mock.calls;
    const jsonCall = calls.find((call: unknown[]) => {
      try {
        const parsed = JSON.parse(String(call[0]));
        return parsed.success !== undefined;
      } catch {
        return false;
      }
    });
    expect(jsonCall).toBeDefined();

    const parsed = JSON.parse(String(jsonCall![0]));
    expect(parsed.success).toBe(true);
    expect(parsed.config).toBeDefined();
    expect(parsed.config.colors).toBeDefined();
    expect(parsed.extraction).toBeDefined();
    expect(parsed.extraction.summary).toBeDefined();
    expect(typeof parsed.extraction.summary.totalTokens).toBe("number");
    expect(typeof parsed.extraction.summary.highConfidence).toBe("number");
    expect(typeof parsed.extraction.summary.mediumConfidence).toBe("number");
    expect(typeof parsed.extraction.summary.lowConfidence).toBe("number");
  });

  it("includes confidence annotations in YAML output", () => {
    writeFileSync(join(testDir, "globals.css"), SAMPLE_CSS, "utf-8");

    themeExtractCommand(outputDir, { from: testDir });

    const outputPath = join(outputDir, ".visor.yaml");
    const content = readFileSync(outputPath, "utf-8");
    expect(content).toContain("# confidence:");
  });

  it("exits with code 2 when target directory does not exist", () => {
    expect(() => {
      themeExtractCommand(outputDir, { from: "/nonexistent/path" });
    }).toThrow("process.exit(2)");
  });

  it("exits with code 2 when no CSS files found", () => {
    // Empty directory
    expect(() => {
      themeExtractCommand(outputDir, { from: testDir });
    }).toThrow("process.exit(2)");
  });

  it("runs validation when --validate flag is set", () => {
    writeFileSync(join(testDir, "globals.css"), SAMPLE_CSS, "utf-8");

    themeExtractCommand(outputDir, { from: testDir, runValidation: true });

    const calls = (console.log as ReturnType<typeof vi.fn>).mock.calls;
    const allOutput = calls.map((c: unknown[]) => String(c[0])).join("\n");
    // Should mention validation
    expect(
      allOutput.includes("Validation") || allOutput.includes("valid")
    ).toBe(true);
  });

  it("JSON output includes validation when --validate and --json", () => {
    writeFileSync(join(testDir, "globals.css"), MINIMAL_CSS, "utf-8");

    themeExtractCommand(outputDir, { from: testDir, json: true, runValidation: true });

    const calls = (console.log as ReturnType<typeof vi.fn>).mock.calls;
    const jsonCall = calls.find((call: unknown[]) => {
      try {
        const parsed = JSON.parse(String(call[0]));
        return parsed.validation !== undefined;
      } catch {
        return false;
      }
    });
    expect(jsonCall).toBeDefined();
  });

  it("scans subdirectories for CSS files", () => {
    // Create CSS in src/ subdirectory
    mkdirSync(join(testDir, "src"), { recursive: true });
    writeFileSync(join(testDir, "src", "globals.css"), SAMPLE_CSS, "utf-8");

    themeExtractCommand(outputDir, { from: testDir });

    const outputPath = join(outputDir, ".visor.yaml");
    expect(existsSync(outputPath)).toBe(true);
  });

  it("extracts dark mode colors", () => {
    writeFileSync(join(testDir, "globals.css"), SAMPLE_CSS, "utf-8");

    themeExtractCommand(outputDir, { from: testDir, json: true });

    const calls = (console.log as ReturnType<typeof vi.fn>).mock.calls;
    const jsonCall = calls.find((call: unknown[]) => {
      try {
        JSON.parse(String(call[0]));
        return true;
      } catch {
        return false;
      }
    });
    const parsed = JSON.parse(String(jsonCall![0]));
    expect(parsed.config["colors-dark"]).toBeDefined();
  });

  it("infers theme name from package.json", () => {
    writeFileSync(join(testDir, "globals.css"), MINIMAL_CSS, "utf-8");
    writeFileSync(
      join(testDir, "package.json"),
      JSON.stringify({ name: "@myorg/cool-app" }),
      "utf-8"
    );

    themeExtractCommand(outputDir, { from: testDir, json: true });

    const calls = (console.log as ReturnType<typeof vi.fn>).mock.calls;
    const jsonCall = calls.find((call: unknown[]) => {
      try {
        const parsed = JSON.parse(String(call[0]));
        return parsed.config !== undefined;
      } catch {
        return false;
      }
    });
    const parsed = JSON.parse(String(jsonCall![0]));
    expect(parsed.config.name).toBe("cool-app-theme");
  });

  it("extracts font hints from package.json dependencies", () => {
    writeFileSync(join(testDir, "globals.css"), MINIMAL_CSS, "utf-8");
    writeFileSync(
      join(testDir, "package.json"),
      JSON.stringify({
        name: "font-test",
        dependencies: {
          "@fontsource/inter": "^5.0.0",
          "@fontsource/fira-code": "^4.0.0",
        },
      }),
      "utf-8"
    );

    themeExtractCommand(outputDir, { from: testDir, json: true });

    const calls = (console.log as ReturnType<typeof vi.fn>).mock.calls;
    const jsonCall = calls.find((call: unknown[]) => {
      try {
        const parsed = JSON.parse(String(call[0]));
        return parsed.config !== undefined;
      } catch {
        return false;
      }
    });
    const parsed = JSON.parse(String(jsonCall![0]));
    expect(parsed.config.typography?.heading?.family).toBe("Inter");
    expect(parsed.config.typography?.mono?.family).toBe("Fira Code");
  });

  it("handles --json flag for missing directory error", () => {
    expect(() => {
      themeExtractCommand(outputDir, { from: "/nonexistent", json: true });
    }).toThrow("process.exit(2)");

    const calls = (console.log as ReturnType<typeof vi.fn>).mock.calls;
    const jsonCall = calls.find((call: unknown[]) => {
      try {
        const parsed = JSON.parse(String(call[0]));
        return parsed.success === false;
      } catch {
        return false;
      }
    });
    expect(jsonCall).toBeDefined();
  });

  it("reports unmapped tokens in JSON output", () => {
    const cssWithUnmapped = `:root {
      --primary-600: #6366f1;
      --my-custom-color: #abcdef;
    }`;
    writeFileSync(join(testDir, "globals.css"), cssWithUnmapped, "utf-8");

    themeExtractCommand(outputDir, { from: testDir, json: true });

    const calls = (console.log as ReturnType<typeof vi.fn>).mock.calls;
    const jsonCall = calls.find((call: unknown[]) => {
      try {
        const parsed = JSON.parse(String(call[0]));
        return parsed.extraction !== undefined;
      } catch {
        return false;
      }
    });
    const parsed = JSON.parse(String(jsonCall![0]));
    expect(parsed.extraction.unmapped.length).toBeGreaterThan(0);
  });
});
