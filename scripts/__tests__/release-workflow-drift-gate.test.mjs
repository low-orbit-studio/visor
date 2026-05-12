/**
 * Asserts the structural contract of the drift-gate in .github/workflows/release.yml.
 *
 * The drift check must:
 *  1. Be preceded by a `Detect pending changesets` step with id `changesets`
 *     that writes a `pending` count to GITHUB_OUTPUT.
 *  2. Carry an `if:` condition that runs only when `pending == '0'`.
 *
 * Together these implement the publish-path-only gate (VI-361, W020).
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const here = dirname(fileURLToPath(import.meta.url));
const workflowPath = resolve(here, "../../.github/workflows/release.yml");
const workflow = parse(readFileSync(workflowPath, "utf8"));
const steps = workflow.jobs.release.steps;

describe("release.yml drift-gate", () => {
  it("includes a Detect pending changesets step with id 'changesets'", () => {
    const detect = steps.find((s) => s.name === "Detect pending changesets");
    expect(detect, "Detect pending changesets step is missing").toBeDefined();
    expect(detect.id).toBe("changesets");
    expect(detect.run).toMatch(/pending=/);
    expect(detect.run).toMatch(/GITHUB_OUTPUT/);
  });

  it("gates Check export-surface drift on zero pending changesets", () => {
    const drift = steps.find((s) => s.name === "Check export-surface drift");
    expect(drift, "Check export-surface drift step is missing").toBeDefined();
    expect(drift.if).toBe("steps.changesets.outputs.pending == '0'");
  });

  it("runs Detect pending changesets before Check export-surface drift", () => {
    const detectIdx = steps.findIndex((s) => s.name === "Detect pending changesets");
    const driftIdx = steps.findIndex((s) => s.name === "Check export-surface drift");
    expect(detectIdx).toBeGreaterThanOrEqual(0);
    expect(driftIdx).toBeGreaterThan(detectIdx);
  });
});
