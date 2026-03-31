import { existsSync, statSync, readdirSync, readFileSync } from "fs";
import { resolve, basename, extname } from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { logger } from "../utils/logger.js";

export interface FontsAddOptions {
  org: string;
  family?: string;
  json?: boolean;
}

interface UploadResult {
  file: string;
  key: string;
  size: number;
}

/**
 * Derive a font family slug from a filename.
 *
 * Steps:
 * 1. Strip the extension
 * 2. Strip known weight/style suffixes (e.g. -Light, -BoldItalic)
 * 3. Lowercase, replace spaces with hyphens
 *
 * Example: PPModelMono-Light.woff2 -> pp-model-mono
 */
export function deriveFamilySlug(filename: string): string {
  const name = basename(filename, extname(filename));

  // Split on hyphens — the last segment may be a weight/style
  const WEIGHT_STYLE_SUFFIXES = new Set([
    "thin",
    "hairline",
    "extralight",
    "ultralight",
    "light",
    "regular",
    "normal",
    "medium",
    "semibold",
    "demibold",
    "bold",
    "extrabold",
    "ultrabold",
    "black",
    "heavy",
    "italic",
    "oblique",
    "bolditalic",
    "semibolditalic",
    "lightitalic",
    "mediumitalic",
    "thinitalic",
    "extrabolditanic",
    "extrabolditalic",
    "blackitalic",
    "heavyitalic",
    "extralightitalic",
    "ultralightitalic",
    "ultrabolditalic",
    "demibolditalic",
    "regularitalic",
  ]);

  // Split on hyphen or camelCase transitions:
  // - lowercase to uppercase: "modelMono" -> "model-Mono"
  // - uppercase run to uppercase+lowercase: "PPModel" -> "PP-Model"
  const parts = name
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .split("-");

  // Remove trailing weight/style parts
  while (
    parts.length > 1 &&
    WEIGHT_STYLE_SUFFIXES.has(parts[parts.length - 1].toLowerCase())
  ) {
    parts.pop();
  }

  return parts.join("-").toLowerCase();
}

/**
 * Collect .woff2 files from a path (file or directory).
 * Returns an array of absolute paths.
 * Throws if no .woff2 files are found or path doesn't exist.
 */
export function collectWoff2Files(inputPath: string): string[] {
  const resolved = resolve(inputPath);

  if (!existsSync(resolved)) {
    throw new Error(`Path not found: ${resolved}`);
  }

  const stat = statSync(resolved);

  if (stat.isFile()) {
    if (extname(resolved).toLowerCase() !== ".woff2") {
      throw new Error(
        `Invalid file format: ${basename(resolved)}. Only .woff2 files are accepted.`
      );
    }
    return [resolved];
  }

  if (stat.isDirectory()) {
    const files = readdirSync(resolved)
      .filter((f) => extname(f).toLowerCase() === ".woff2")
      .map((f) => resolve(resolved, f));

    if (files.length === 0) {
      throw new Error(
        `No .woff2 files found in directory: ${resolved}`
      );
    }

    // Check for non-woff2 font files and warn
    const nonWoff2Fonts = readdirSync(resolved).filter((f) => {
      const ext = extname(f).toLowerCase();
      return [".ttf", ".otf", ".woff", ".eot"].includes(ext);
    });

    return files.sort();
  }

  throw new Error(`Path is neither a file nor a directory: ${resolved}`);
}

/**
 * Get non-woff2 font files from a directory (for warnings).
 */
export function getNonWoff2Fonts(inputPath: string): string[] {
  const resolved = resolve(inputPath);
  if (!existsSync(resolved) || !statSync(resolved).isDirectory()) {
    return [];
  }

  return readdirSync(resolved).filter((f) => {
    const ext = extname(f).toLowerCase();
    return [".ttf", ".otf", ".woff", ".eot"].includes(ext);
  });
}

/**
 * Build the S3 key for a font file.
 * Convention: <org>/<family>/<filename>
 */
export function buildS3Key(
  org: string,
  familySlug: string,
  filename: string
): string {
  return `${org}/${familySlug}/${filename}`;
}

/**
 * Validate that required R2 environment variables are set.
 */
function getR2Config(): {
  accessKeyId: string;
  secretAccessKey: string;
  endpoint: string;
} {
  const accessKeyId = process.env.VISOR_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.VISOR_R2_SECRET_ACCESS_KEY;
  const endpoint = process.env.VISOR_R2_ENDPOINT;

  if (!accessKeyId || !secretAccessKey || !endpoint) {
    const missing: string[] = [];
    if (!accessKeyId) missing.push("VISOR_R2_ACCESS_KEY_ID");
    if (!secretAccessKey) missing.push("VISOR_R2_SECRET_ACCESS_KEY");
    if (!endpoint) missing.push("VISOR_R2_ENDPOINT");
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }

  return { accessKeyId, secretAccessKey, endpoint };
}

/**
 * Create an S3 client configured for R2.
 */
function createR2Client(config: {
  accessKeyId: string;
  secretAccessKey: string;
  endpoint: string;
}): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

/**
 * Upload a single file to R2.
 */
async function uploadFile(
  client: S3Client,
  bucket: string,
  key: string,
  filePath: string
): Promise<void> {
  const body = readFileSync(filePath);
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: "font/woff2",
    })
  );
}

/**
 * Main fonts add command handler.
 */
export async function fontsAddCommand(
  inputPath: string,
  options: FontsAddOptions
): Promise<void> {
  const { org, json } = options;

  try {
    // Validate R2 credentials
    const r2Config = getR2Config();

    // Collect files
    const files = collectWoff2Files(inputPath);

    // Determine family slug
    const familySlug =
      options.family ?? deriveFamilySlug(basename(files[0]));

    // Warn about non-woff2 font files
    const resolved = resolve(inputPath);
    const nonWoff2 =
      statSync(resolved).isDirectory()
        ? getNonWoff2Fonts(resolved)
        : [];

    if (!json) {
      logger.heading("Visor Font Upload");
      logger.info(`Organization: ${org}`);
      logger.info(`Font family: ${familySlug}`);
      logger.info(`Files to upload: ${files.length}`);
      logger.blank();

      if (nonWoff2.length > 0) {
        logger.warn(
          `Skipping ${nonWoff2.length} non-woff2 file(s): ${nonWoff2.join(", ")}`
        );
        logger.blank();
      }
    }

    // Create R2 client
    const client = createR2Client(r2Config);
    const bucket = "visor-fonts";

    // Upload files
    const results: UploadResult[] = [];
    for (const filePath of files) {
      const filename = basename(filePath);
      const key = buildS3Key(org, familySlug, filename);

      if (!json) {
        logger.info(`Uploading ${filename}...`);
      }

      await uploadFile(client, bucket, key, filePath);

      const size = statSync(filePath).size;
      results.push({ file: filename, key, size });

      if (!json) {
        logger.success(`Uploaded: ${key} (${formatBytes(size)})`);
      }
    }

    // Output results
    if (json) {
      console.log(
        JSON.stringify(
          {
            success: true,
            org,
            family: familySlug,
            uploaded: results,
            totalFiles: results.length,
            totalBytes: results.reduce((sum, r) => sum + r.size, 0),
          },
          null,
          2
        )
      );
    } else {
      logger.blank();
      logger.success(
        `${results.length} file(s) uploaded to ${org}/${familySlug}/`
      );
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);

    if (json) {
      console.log(
        JSON.stringify({ success: false, error: message })
      );
    } else {
      logger.error(message);
    }

    process.exit(2);
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}
