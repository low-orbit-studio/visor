import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const url = 'http://127.0.0.1:4060/journey.html';
const outDir = path.join(__dirname, 'shots');
const T = { mm: 't-mm', space: 't-space' };

// full walkthrough in modern-minimal light + portability spot-checks
const shots = [
  ['start',    'mm',    'light'],
  ['strategy', 'mm',    'light'],
  ['verbal',   'mm',    'light'],
  ['visual',   'mm',    'light'],
  ['prove',    'mm',    'light'],
  ['export',   'mm',    'light'],
  ['canvas',   'mm',    'light'],
  ['verbal',   'space', 'dark'],
  ['prove',    'mm',    'dark'],
  ['export',   'space', 'light'],
];

const browser = await chromium.launch();
for (const [stage, theme, mode] of shots) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 912 }, deviceScaleFactor: 2, colorScheme: mode });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.locator(`[data-go="${stage}"]`).first().click();
  await page.locator(`[data-t="${T[theme]}"]`).click();
  await page.locator(`[data-m="${mode}"]`).click();
  await page.evaluate(() => { const rb = document.querySelector('.reviewbar'); if (rb) rb.style.display = 'none'; });
  try { await page.evaluate(() => document.fonts.ready); } catch {}
  await page.waitForTimeout(450);
  const out = path.join(outDir, `journey-${stage}-${theme}-${mode}.png`);
  await page.screenshot({ path: out });
  console.log('wrote', path.basename(out));
  await page.close();
}
await browser.close();
