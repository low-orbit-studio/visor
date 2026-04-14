/**
 * Generates component preview screenshots using Playwright.
 *
 * Usage:
 *   npm run previews
 *
 * Prerequisites:
 *   - Docs dev server must be running (npm run docs:dev)
 *   - Playwright browsers must be installed (npx playwright install chromium)
 *
 * Output:
 *   packages/docs/public/previews/{component}.png
 *
 * Extend the COMPONENTS array as preview_url fields are added to .visor.yaml files.
 */

import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DOCS_BASE_URL = process.env.DOCS_URL || 'http://localhost:4050';
const OUTPUT_DIR = path.join(__dirname, '../packages/docs/public/previews');

/**
 * Component pages to screenshot.
 * Mirrors the preview_url values in each component's .visor.yaml file.
 * Add entries here as more components receive preview_url fields.
 */
const COMPONENTS: Array<{ name: string; path: string }> = [
  { name: 'button', path: '/docs/components/general/button' },
  { name: 'badge', path: '/docs/components/data-display/badge' },
  { name: 'alert', path: '/docs/components/feedback/alert' },
];

async function generatePreviews(): Promise<void> {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });

  let passed = 0;
  let failed = 0;

  for (const component of COMPONENTS) {
    try {
      await page.goto(`${DOCS_BASE_URL}${component.path}`, {
        waitUntil: 'networkidle',
        timeout: 30_000,
      });
      const outputPath = path.join(OUTPUT_DIR, `${component.name}.png`);
      await page.screenshot({ path: outputPath, fullPage: false });
      console.log(`✓ ${component.name} → ${outputPath}`);
      passed++;
    } catch (err) {
      console.error(`✗ ${component.name}: ${err instanceof Error ? err.message : String(err)}`);
      failed++;
    }
  }

  await browser.close();

  console.log(`\nDone: ${passed} captured, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

generatePreviews().catch((err) => {
  console.error('generate-previews crashed:', err);
  process.exit(1);
});
