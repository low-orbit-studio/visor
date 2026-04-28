#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const STATUS_PATH = "/tmp/changeset-status.json";
const SCOPE_PREFIX = "@loworbitstudio/";

const result = spawnSync(
  "npx",
  ["changeset", "status", `--output=${STATUS_PATH}`],
  { stdio: "ignore" },
);

let releases = [];
if (result.status === 0 && existsSync(STATUS_PATH)) {
  releases = JSON.parse(readFileSync(STATUS_PATH, "utf8")).releases ?? [];
}

const bumps = releases
  .filter((r) => r.type !== "none" && r.newVersion !== r.oldVersion)
  .map((r) => `${r.name.replace(SCOPE_PREFIX, "")}@${r.newVersion}`);

process.stdout.write(
  bumps.length ? `Version Packages: ${bumps.join(", ")}` : "Version Packages",
);
