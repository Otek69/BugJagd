import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import {
  EXERCISE_URL,
  expectNoA11yViolations,
  submitGoodReport,
  triggerBugInTestObject,
} from './helpers';

test('Export, Löschen und Import stellen den Fortschritt wieder her', async ({
  page,
}, testInfo) => {
  await page.goto(EXERCISE_URL);
  await triggerBugInTestObject(page);
  await submitGoodReport(page);
  await page.getByRole('button', { name: 'Übung beenden', exact: true }).click();
  await page.getByRole('button', { name: 'Ja, beenden und Lösung zeigen' }).click();

  await page.getByRole('link', { name: 'Fortschritt' }).click();
  await expect(page.getByTestId('total-xp')).toHaveText('60 XP');
  await expectNoA11yViolations(page);

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Fortschritt exportieren' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^bugjagd-fortschritt-\d{4}-\d{2}-\d{2}\.json$/);
  const file = testInfo.outputPath('export.json');
  await download.saveAs(file);
  expect(JSON.parse(await readFile(file, 'utf8')).app).toBe('BugJagd');

  await page.getByRole('link', { name: 'Einstellungen' }).click();
  await page.getByRole('button', { name: 'Fortschritt löschen …' }).click();
  await page.getByRole('button', { name: 'Ja, alles löschen' }).click();
  await page.getByRole('link', { name: 'Fortschritt' }).click();
  await expect(page.getByTestId('total-xp')).toHaveText('0 XP');

  await page.getByTestId('import-file').setInputFiles(file);
  await expect(page.getByTestId('import-confirm')).toContainText('60 XP');
  await page.getByRole('button', { name: 'Ja, importieren und ersetzen' }).click();
  await expect(page.getByTestId('total-xp')).toHaveText('60 XP');
});

test('Import einer falschen Datei verändert nichts und erklärt den Grund', async ({ page }) => {
  await page.goto('./#/fortschritt');
  await page.getByTestId('import-file').setInputFiles({
    name: 'falsch.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"hallo": 1}'),
  });
  await expect(page.getByRole('status').filter({ hasText: 'Import nicht möglich' })).toContainText(
    'keine BugJagd-Fortschrittsdatei',
  );
  await expect(page.getByTestId('total-xp')).toHaveText('0 XP');
});

test('Design und Schriftgröße werden gespeichert', async ({ page }) => {
  await page.goto('./#/einstellungen');
  await expectNoA11yViolations(page);
  await page.getByRole('radio', { name: 'Dunkel' }).check();
  await page.getByRole('radio', { name: 'Größer (130 %)' }).check();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('html')).toHaveAttribute('data-font-size', 'larger');
  await expectNoA11yViolations(page);

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('html')).toHaveAttribute('data-font-size', 'larger');
  await expect(page.getByRole('radio', { name: 'Dunkel' })).toBeChecked();
});

test('die Hauptnavigation ist per Tastatur bedienbar', async ({ page }) => {
  await page.goto('./');
  await page.keyboard.press('Tab'); // Sprunglink
  await page.keyboard.press('Tab'); // Start
  await page.keyboard.press('Tab'); // Übung
  await page.keyboard.press('Tab'); // Fortschritt
  await expect(page.getByRole('link', { name: 'Fortschritt' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Fortschritt');
  await expect(page.getByRole('link', { name: 'Fortschritt' })).toHaveAttribute(
    'aria-current',
    'page',
  );
});
