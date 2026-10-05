import { chromium } from 'playwright-core';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 412, height: 900 } });
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
page.on('pageerror', e => errors.push('PAGEERROR: ' + String(e).slice(0, 300)));
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle', timeout: 45000 });
await page.waitForTimeout(6000);
await page.screenshot({ path: 'dbg-overflow/mobile-home.png', fullPage: false });

// Đo document scrollWidth vs viewport + liệt kê phần tử tràn
const res = await page.evaluate(() => {
  const vw = document.documentElement.clientWidth;
  const dw = document.documentElement.scrollWidth;
  const bw = document.body ? document.body.scrollWidth : -1;
  const offenders = [];
  const all = document.querySelectorAll('*');
  for (const el of all) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && (r.left < -1 || r.right > vw + 1)) {
      const cls = (el.className && el.className.baseVal !== undefined ? '' : String(el.className || '')).slice(0, 120);
      offenders.push({ tag: el.tagName, cls, left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width) });
      if (offenders.length >= 25) break;
    }
  }
  return { vw, dw, bw, offenders };
});
console.log(JSON.stringify(res, null, 1));
console.log('CONSOLE_ERRORS:', JSON.stringify(errors.slice(0, 10)));
await browser.close();
