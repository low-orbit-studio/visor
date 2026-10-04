/**
 * VI-687 — `text-transform` on typography slots
 *
 * A theme can set casing per slot (display, heading, body, mono). The engine
 * validates the four CSS values, resolves the key, and emits
 * `--font-<slot>-text-transform` only when the theme sets it, so every theme
 * that does not stays byte-identical.
 */

import { describe, it, expect } from "vitest";
import { generateThemeData } from "../pipeline.js";
import { generatePrimitivesCss } from "../generate-css.js";
import { docsAdapter } from "../adapters/docs.js";
import { validateConfig } from "../schema.js";
import { parse as parseYaml } from "yaml";
import type { AdapterInput } from "../adapters/types.js";

function themeYaml(typography = ""): string {
  return `
name: tt
version: 1
colors:
  primary: "#2563EB"
${typography}`;
}

function schemaErrors(yaml: string): string[] {
  return validateConfig(parseYaml(yaml)).errors;
}

describe("VI-687 — schema", () => {
  it.each(["none", "uppercase", "lowercase", "capitalize"])("accepts %s on every slot", (value) => {
    const typography = ["heading", "display", "body", "mono"]
      .map((slot) => `  ${slot}:\n    text-transform: ${value}\n`)
      .join("");
    expect(schemaErrors(themeYaml(`typography:\n${typography}`))).toEqual([]);
  });

  it("rejects any other value, naming the slot and the allowed set", () => {
    const errs = schemaErrors(themeYaml("typography:\n  display:\n    text-transform: shouting\n"));
    expect(errs).toHaveLength(1);
    expect(errs[0]).toContain("typography.display.text-transform");
    expect(errs[0]).toContain("none, uppercase, lowercase, capitalize");
  });

  it("lists text-transform among the valid keys of a slot", () => {
    const errs = schemaErrors(themeYaml("typography:\n  display:\n    bogus: 1\n"));
    expect(errs[0]).toContain("text-transform");
  });
});

describe("VI-687 — emit", () => {
  const withTransform = themeYaml(
    "typography:\n  display:\n    text-transform: uppercase\n  mono:\n    text-transform: lowercase\n",
  );

  it("core CSS carries the token for each slot that sets it, and only those", () => {
    const data = generateThemeData(withTransform);
    const css = generatePrimitivesCss(data.primitives, data.config);
    expect(css).toContain("--font-display-text-transform: uppercase;");
    expect(css).toContain("--font-mono-text-transform: lowercase;");
    expect(css).not.toContain("--font-heading-text-transform");
    expect(css).not.toContain("--font-body-text-transform");
  });

  it("docs adapter carries the token", () => {
    const data = generateThemeData(withTransform);
    const input: AdapterInput = { primitives: data.primitives, tokens: data.tokens, config: data.config };
    const css = docsAdapter(input);
    expect(css).toContain("--font-display-text-transform: uppercase;");
  });

  it("a theme that sets none emits no text-transform token", () => {
    const data = generateThemeData(themeYaml());
    expect(generatePrimitivesCss(data.primitives, data.config)).not.toContain("text-transform");
  });
});
