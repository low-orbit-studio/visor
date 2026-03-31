/**
 * Preload hint generation for font loading performance.
 *
 * Generates <link> tags for preconnecting to Google Fonts
 * and preloading critical font files.
 */

import { VISOR_FONTS_CDN, buildVisorFontUrl } from "./resolve.js";
import type { FontResolution } from "./types.js";

const GOOGLE_FONTS_ORIGIN = "https://fonts.googleapis.com";
const GOOGLE_FONTS_STATIC_ORIGIN = "https://fonts.gstatic.com";

/**
 * Generate preconnect and preload link tags for resolved fonts.
 *
 * For Google Fonts:
 *   - <link rel="preconnect"> to fonts.googleapis.com
 *   - <link rel="preconnect" crossorigin> to fonts.gstatic.com
 *   - <link rel="preload" as="style"> for the CSS URL
 *
 * For custom fonts with provided file paths:
 *   - <link rel="preload" as="font" type="font/woff2" crossorigin> per file
 */
export function generatePreloadLinks(
  resolutions: FontResolution[],
  customFontPaths?: Map<string, string[]>
): string[] {
  const links: string[] = [];
  const hasGoogleFonts = resolutions.some((r) => r.source === "google-fonts");

  if (hasGoogleFonts) {
    // Preconnect to Google Fonts origins (deduplicated — only once regardless of font count)
    links.push(
      `<link rel="preconnect" href="${GOOGLE_FONTS_ORIGIN}">`
    );
    links.push(
      `<link rel="preconnect" href="${GOOGLE_FONTS_STATIC_ORIGIN}" crossorigin>`
    );

    // Preload each Google Fonts CSS URL
    for (const resolution of resolutions) {
      if (resolution.source === "google-fonts" && resolution.cssUrl) {
        links.push(
          `<link rel="preload" as="style" href="${resolution.cssUrl}">`
        );
      }
    }
  }

  // Visor Fonts preconnect + preload
  const hasVisorFonts = resolutions.some((r) => r.source === "visor-fonts");
  if (hasVisorFonts) {
    links.push(
      `<link rel="preconnect" href="${VISOR_FONTS_CDN}" crossorigin>`
    );

    for (const resolution of resolutions) {
      if (resolution.source === "visor-fonts" && resolution.org) {
        for (const weight of resolution.weights) {
          const url = buildVisorFontUrl(resolution.org, resolution.family, weight);
          links.push(
            `<link rel="preload" as="font" type="font/woff2" href="${url}" crossorigin>`
          );
        }
      }
    }
  }

  // Local font file preloads
  if (customFontPaths) {
    for (const resolution of resolutions) {
      if (resolution.source === "local") {
        const paths = customFontPaths.get(resolution.family);
        if (paths) {
          for (const path of paths) {
            links.push(
              `<link rel="preload" as="font" type="font/woff2" href="${path}" crossorigin>`
            );
          }
        }
      }
    }
  }

  return links;
}

/**
 * Generate the stylesheet link tags for Google Fonts (non-preload).
 * These are the actual <link rel="stylesheet"> tags that load the fonts.
 */
export function generateStylesheetLinks(
  resolutions: FontResolution[]
): string[] {
  const links: string[] = [];

  for (const resolution of resolutions) {
    if (resolution.source === "google-fonts" && resolution.cssUrl) {
      links.push(
        `<link rel="stylesheet" href="${resolution.cssUrl}">`
      );
    }
  }

  return links;
}
