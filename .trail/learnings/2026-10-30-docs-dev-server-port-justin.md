---
title: Docs dev server port
author: Justin
date: 2026-10-30
id: l-fa5d1f2d
scope: repo
status: active
touches:
  - packages/docs/package.json
---

## Decided
The docs dev server runs on port 4050.

**Why:** Custom port configuration in packages/docs/package.json scripts.

## Watch out
When starting the dev server or referencing localhost URLs, always use port 4050.

_From Claude Code's memory of this repo, last updated Mar 26._
