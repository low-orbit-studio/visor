import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fileArg = process.argv[2] || 'elicit-core.html';
const url = 'file://' + path.join(__dirname, fileArg);
const outDir = path.join(__dirname, 'shots');
const base = fileArg.replace(/\.html$/, '');

const variants = [
  { id: 'mm-light',    cls: 't-mm light',     name: 'modern-minimal', mode: 'light' },
  { id: 'mm-dark',     cls: 't-mm dark',      name: 'modern-minimal', mode: 'dark'  },
  { id: 'space-light', cls: 't-space light',  name: 'space',          mode: 'light' },
  { id: 'space-dark',  cls: 't-space dark',   name: 'space',          mode: 'dark'  },
];

const browser = await chromium.launch();
for (const v of variants) {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 912 },
    deviceScaleFactor: 2,
    colorScheme: v.mode,
  });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(({ cls, name, mode }) => {
    document.documentElement.className = cls;
    document.querySelectorAll('.tname').forEach((el) => (el.textContent = name));
    // reflect mode in the right-panel toggle
    const li = document.querySelector('.modetoggle .lighticon');
    const di = document.querySelector('.modetoggle .darkicon');
    if (li && di) { li.classList.toggle('on', mode === 'light'); di.classList.toggle('on', mode === 'dark'); }
    const rb = document.querySelector('.reviewbar'); if (rb) rb.style.display = 'none';
  }, v);
  try { await page.evaluate(() => document.fonts.ready); } catch {}
  await page.waitForTimeout(500);
  const out = path.join(outDir, `${base}-${v.id}.png`);
  await page.screenshot({ path: out });
  console.log('wrote', out);
  await page.close();
}
await browser.close();
