import { existsSync, readFileSync } from "fs"
import { join } from "path"
import { z } from "zod"

/**
 * The file every blessed build must ship at its root. Its presence is what
 * marks a directory as a forkable blessed reference build (see D9 in VI-597).
 */
export const BLESSED_MANIFEST_FILENAME = "blessed-manifest.json"

/**
 * Where a blessed build wants `visor spawn` / `visor theme apply` to write the
 * nextjs-adapter CSS (VI-601). Absent = implicit `{ kind: "globals-css" }`,
 * preserving VI-597's original behavior for reference-builds that haven't
 * opted in.
 *
 * Two initial kinds:
 * - `globals-css` (default) writes the adapter output to a single file
 *   (defaults to `app/globals.css`).
 * - `themes-css-dir` writes to `<path>/<theme-id>.css`, matching
 *   organization-management's actual swap-point where `layout.tsx` inlines
 *   every registered theme as a scoped `<style>` and a pre-paint script picks
 *   the active one.
 */
export const themeApplyTargetSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("globals-css"),
      /** Build-root-relative destination file. Defaults to `app/globals.css`. */
      path: z.string().min(1).optional(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("themes-css-dir"),
      /** Build-root-relative directory. The adapter output is written to `<path>/<theme-id>.css`. */
      path: z.string().min(1),
    })
    .strict(),
])

export type ThemeApplyTarget = z.infer<typeof themeApplyTargetSchema>

/**
 * Zod schema for `blessed-manifest.json` (VI-597 D9, VI-601).
 *
 * `.strict()` rejects unknown keys so drift (a stray/renamed field) fails
 * loudly rather than being silently ignored. Every non-optional field is
 * required — a partial manifest is not a valid blessed-build contract.
 */
export const blessedManifestSchema = z
  .object({
    /** Blessed-build shape, e.g. `admin-ui`. Matched against the `{shape}` in `blessed:{shape}:{pattern}`. */
    shape: z.string().min(1),
    /** Pattern name within the shape, e.g. `organization-management`. */
    pattern: z.string().min(1),
    /** The theme the reference build was authored + captured against. */
    base_theme: z.string().min(1),
    /** Minimum Visor version this build is known to work with (semver range). */
    requires_visor: z.string().min(1),
    /** Path (relative to the build root) to the approved capture baseline. */
    captures_baseline: z.string().min(1),
    /** Three-gates disposition at the time the build was blessed. */
    three_gates_status: z.string().min(1),
    /** Optional: where to write the nextjs-adapter CSS. Absent = `globals-css`. */
    theme_apply_target: themeApplyTargetSchema.optional(),
  })
  .strict()

export type BlessedManifest = z.infer<typeof blessedManifestSchema>

export type ManifestReadResult =
  | { ok: true; manifest: BlessedManifest }
  | { ok: false; error: string }

/**
 * Read + Zod-validate the `blessed-manifest.json` at the root of `buildDir`.
 *
 * Returns a discriminated result rather than throwing so callers (discovery,
 * spawn) can shape their own error surface. The missing-file message is the
 * exact wording specified in VI-597 D9.
 */
export function parseBlessedManifest(buildDir: string): ManifestReadResult {
  const manifestPath = join(buildDir, BLESSED_MANIFEST_FILENAME)

  if (!existsSync(manifestPath)) {
    return {
      ok: false,
      error: `this directory is not a blessed build (missing ${BLESSED_MANIFEST_FILENAME}); see docs/blessed-builds.md`,
    }
  }

  let raw: string
  try {
    raw = readFileSync(manifestPath, "utf-8")
  } catch {
    return { ok: false, error: `could not read ${manifestPath}` }
  }

  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch (err) {
    const message = err instanceof Error ? err.message : "invalid JSON"
    return { ok: false, error: `invalid JSON in ${manifestPath}: ${message}` }
  }

  const result = blessedManifestSchema.safeParse(json)
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => {
        const path = issue.path.join(".") || "(root)"
        return `${path}: ${issue.message}`
      })
      .join("; ")
    return {
      ok: false,
      error: `invalid ${BLESSED_MANIFEST_FILENAME} at ${manifestPath}: ${issues}`,
    }
  }

  return { ok: true, manifest: result.data }
}
