import { expect, test, type Page } from '@playwright/test';

// Fredag 25 september 2026 kl 09:00.
const NOW = new Date('2026-09-25T09:00:00+02:00');

async function start(page: Page) {
  await page.clock.install({ time: NOW });
  await page.goto('/');
  await page.getByText('Fortsätt').click();
  await page.getByText('Ja, lägg in startuppsättning').click();
  await expect(page.getByText('Fredag 25 september v39')).toBeVisible();
}

async function typeTime(page: Page, hhmm: string) {
  for (const d of hhmm) await page.locator('.numpad button', { hasText: new RegExp(`^${d}$`) }).click();
  await page.getByRole('button', { name: 'OK' }).click();
}

test('lägga in, kvittera och ta bort en aktivitet', async ({ page }) => {
  await start(page);
  await page.getByRole('button', { name: 'Lägg in aktivitet' }).click();
  await page.getByText('Enstaka').click();
  // Ändravyn
  await page.getByRole('button', { name: 'Namnge aktiviteten' }).click();
  await page.locator('textarea').fill('Fika med Anna');
  await page.getByRole('button', { name: 'OK' }).click();
  await page.locator('.ev-row', { hasText: 'Starttid' }).locator('button').click();
  await typeTime(page, '1500');
  await page.locator('.ev-row', { hasText: 'Sluttid' }).locator('button').click();
  await typeTime(page, '1530');
  await page.locator('.image-btn').click();
  await page.locator('.folder-cell', { hasText: 'Mat och dryck' }).click();
  await page.locator('.ig-cell', { hasText: 'Fika' }).click();
  await page.getByRole('button', { name: 'OK' }).click();
  await page.getByRole('button', { name: 'Kvitterbar' }).or(page.getByRole('button', { name: 'Inte kvitterbar' })).click();
  await page.getByRole('button', { name: 'OK' }).click();

  // Syns i listvyn
  await page.getByRole('button', { name: 'list' }).click();
  const row = page.locator('.dl-row', { hasText: 'Fika med Anna' });
  await expect(row).toContainText('15:00 - 15:30');

  // Aktivitetsvyn med nedräkning (6 timmar kvar = "lång tid", alla prickar tända)
  await row.click();
  await expect(page.locator('.act-header')).toContainText('Fika med Anna');
  await expect(page.locator('.qd.on')).toHaveCount(8);
  await expect(page.locator('.qd-digital')).toHaveText('06:00');

  // Kvittera
  await page.getByRole('button', { name: 'Kvittera' }).click();
  await expect(page.getByText('Klar?')).toBeVisible();
  await page.getByRole('button', { name: 'JA' }).click();
  await expect(page.locator('.signed-banner')).toBeVisible();

  // Ta bort
  await page.getByRole('button', { name: 'Ta bort' }).click();
  await page.getByRole('button', { name: 'OK' }).click();
  await expect(page.locator('.dl-row', { hasText: 'Fika med Anna' })).toHaveCount(0);
});

test('återkommande aktivitet varje tisdag och torsdag', async ({ page }) => {
  await start(page);
  await page.getByRole('button', { name: 'Lägg in aktivitet' }).click();
  await page.getByText('Återkommande').click();
  await page.getByText('Veckovis').click();
  // Fredag är förvald; välj tisdag och torsdag i stället.
  const days = page.locator('.weekday-picker button');
  await days.nth(4).click();
  await days.nth(1).click();
  await days.nth(3).click();
  await page.getByRole('button', { name: 'OK' }).click();
  await page.getByText('Utan slutdatum').click();
  await page.getByRole('button', { name: 'Namnge aktiviteten' }).click();
  await page.locator('textarea').fill('Simma');
  await page.getByRole('button', { name: 'OK' }).click();
  await page.locator('.ev-row', { hasText: 'Starttid' }).locator('button').click();
  await typeTime(page, '1000');
  await page.getByRole('button', { name: 'OK' }).click();

  await page.getByRole('button', { name: 'list' }).click();
  await expect(page.locator('.dl-row', { hasText: 'Simma' })).toHaveCount(0); // fredag
  for (let i = 0; i < 4; i++) await page.getByRole('button', { name: 'Framåt' }).click(); // tisdag 29/9
  await expect(page.getByText('Tisdag 29 september')).toBeVisible();
  await expect(page.locator('.dl-row', { hasText: 'Simma' })).toBeVisible();

  // Ta bort endast denna dag
  await page.locator('.dl-row', { hasText: 'Simma' }).click();
  await page.getByRole('button', { name: 'Ta bort' }).click();
  await page.getByText('Endast denna dag').click();
  await expect(page.locator('.dl-row', { hasText: 'Simma' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Framåt' }).click();
  await page.getByRole('button', { name: 'Framåt' }).click(); // torsdag 1/10
  await expect(page.locator('.dl-row', { hasText: 'Simma' })).toBeVisible();
});

test('basaktivitet och timer', async ({ page }) => {
  await start(page);
  await page.getByRole('button', { name: 'Lägg in aktivitet' }).click();
  await page.getByText('Enstaka').click();
  await page.getByRole('button', { name: 'Välj basaktivitet' }).click();
  await page.locator('.list-row', { hasText: 'Lunch' }).click();
  await expect(page.locator('.ev-row', { hasText: 'Namn' })).toContainText('Lunch');
  await page.getByRole('button', { name: 'OK' }).click();
  await expect(page.locator('.tl-card', { hasText: 'Lunch' })).toBeVisible();

  await page.getByRole('button', { name: 'Kalendermenyn' }).click();
  await page.getByText('Starta timer').click();
  await page.locator('.list-row', { hasText: 'Koka ägg' }).click();
  await expect(page.locator('.act-header')).toContainText('Koka ägg');
  await expect(page.locator('.qd-digital')).toHaveText('00:08');
  await page.clock.runFor(9 * 60 * 1000);
  await expect(page.locator('.signed-banner')).toContainText('Klar');
});

test('inställningar är kodskyddade med 0353', async ({ page }) => {
  await start(page);
  await page.getByRole('button', { name: 'Kalendermenyn' }).click();
  await page.getByText('Inställningar').click();
  for (const d of '1111') await page.locator('.numpad button', { hasText: new RegExp(`^${d}$`) }).click();
  await expect(page.getByText('Fel kod')).toBeVisible();
  for (const d of '0353') await page.locator('.numpad button', { hasText: new RegExp(`^${d}$`) }).click();
  await page.getByText('Kalendervyn').click();
  await page.getByText('Listvy').click();
  await page.getByRole('button', { name: 'OK' }).click();
  await page.getByRole('button', { name: 'Tillbaka' }).click();
  await page.getByRole('button', { name: 'Tillbaka' }).click();
  await page.reload();
  await expect(page.locator('.day-list')).toBeVisible();
});
