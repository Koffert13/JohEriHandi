// Tar skärmdumpar av alla vyer: node e2e/screens.mjs <url> <utkatalog>
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const url = process.argv[2] ?? 'http://localhost:4173/';
const out = process.argv[3] ?? 'screens';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  timezoneId: 'Europe/Stockholm',
  locale: 'sv-SE',
  serviceWorkers: 'block',
});
const page = await context.newPage();
page.on('pageerror', (e) => console.error('pageerror', e.message));
await page.clock.install({ time: new Date('2026-09-25T10:20:00+02:00') });
await page.goto(url);
await page.screenshot({ path: `${out}/00-onboarding.png` });
const { seed } = await import('./seed.mjs');
await seed(page);
await page.reload();
await page.waitForTimeout(500);
const shot = async (name) => {
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${out}/${name}.png` });
};
await shot('01-timeline');
await page.getByRole('button', { name: 'list' }).click();
await shot('02-list');
await page.getByRole('button', { name: 'week' }).click();
await shot('03-week');
await page.getByRole('button', { name: 'month' }).click();
await shot('04-month');
await page.getByRole('button', { name: 'timeline' }).click();
await page.getByText('Promenad').first().click();
await shot('05-activity');
await page.getByRole('button', { name: 'OK' }).click();
await page.getByText('Lunch').first().click();
await shot('06-activity-note');
await page.getByRole('button', { name: 'Ändra' }).click();
await shot('07-edit');
await page.getByRole('button', { name: /Starttid|12:00/ }).first().click();
await shot('08-time-entry');
await page.getByRole('button', { name: 'Avbryt' }).click();
await page.getByRole('button', { name: 'Bild' }).first().click().catch(() => {});
await page.locator('.image-btn').click();
await shot('09-image-folders');
await page.locator('.folder-cell').first().click();
await shot('10-image-folder');
await page.getByRole('button', { name: 'Tillbaka' }).click();
await page.getByRole('button', { name: 'Tillbaka' }).click();
await page.getByRole('button', { name: 'Tillbaka' }).click();
await page.getByRole('button', { name: 'OK' }).click();
await page.getByRole('button', { name: 'Kalendermenyn' }).click();
await shot('11-menu');
await page.getByText('Klocka').click();
await shot('12-clock');
await page.getByRole('button', { name: 'Tillbaka' }).click();
await page.getByText('Inställningar').click();
await shot('13-code');
for (const d of '0353') await page.locator('.numpad button', { hasText: d }).first().click();
await shot('14-settings');
await page.getByText('Kalendervyn').click();
await shot('15-settings-calendar');
await page.getByRole('button', { name: 'Avbryt' }).click();
await page.getByRole('button', { name: 'Tillbaka' }).click();
await page.getByText('Starta timer').click();
await shot('16-timer-base');
await page.getByText('Ingen bastimer').click();
await shot('17-timer-time');
await page.getByRole('button', { name: 'Tillbaka' }).click();
await page.getByRole('button', { name: 'Tillbaka' }).click();
await page.getByRole('button', { name: 'Tillbaka' }).click();
await page.getByRole('button', { name: 'Lägg in aktivitet' }).click();
await shot('18-new-type');
await page.getByText('Enstaka').click();
await shot('19-new-edit');
await page.getByRole('button', { name: 'Tillbaka' }).click();
await page.clock.setFixedTime(new Date('2026-09-25T21:10:00+02:00'));
await page.getByText('Kvällsrutin').first().click().catch(() => {});
await shot('20-checklist');
await browser.close();
