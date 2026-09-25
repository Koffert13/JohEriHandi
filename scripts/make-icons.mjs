// Ritar appikonerna (PNG) med Chromium. Körs en gång: node scripts/make-icons.mjs
import { chromium } from 'playwright';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#dbe8f5"/>
  <rect x="56" y="70" width="400" height="390" rx="36" fill="#fff" stroke="#b9c7d6" stroke-width="6"/>
  <path d="M56 106a36 36 0 0 1 36-36h328a36 36 0 0 1 36 36v54H56z" fill="#0f6fc6"/>
  <rect x="138" y="40" width="30" height="70" rx="12" fill="#0b4c86"/>
  <rect x="344" y="40" width="30" height="70" rx="12" fill="#0b4c86"/>
  <rect x="92" y="186" width="74" height="250" rx="16" fill="#b9c1c8"/>
  ${[0, 1, 2, 3].map((i) => `<circle cx="129" cy="${220 + i * 60}" r="22" fill="${i < 1 ? 'none' : '#1d1d1d'}" stroke="#1d1d1d" stroke-width="6"/>`).join('')}
  <rect x="196" y="200" width="222" height="222" rx="14" fill="#fff" stroke="#cfd6dd" stroke-width="5"/>
  <circle cx="307" cy="311" r="80" fill="#17466f"/>
  <line x1="307" y1="311" x2="307" y2="256" stroke="#e8102a" stroke-width="12" stroke-linecap="round"/>
  <line x1="307" y1="311" x2="348" y2="330" stroke="#e8102a" stroke-width="12" stroke-linecap="round"/>
  <circle cx="307" cy="311" r="11" fill="#fff"/>
</svg>`;

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
const page = await browser.newPage();
for (const [name, size] of [['icon-512.png', 512], ['icon-192.png', 192], ['apple-touch-icon.png', 180]]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<body style="margin:0">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body>`);
  await page.screenshot({ path: `public/${name}` });
}
await browser.close();
