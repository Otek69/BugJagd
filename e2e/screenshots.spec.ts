/**
 * Erzeugt die Screenshots für die README: npm run screenshots
 * Die Bilder landen in docs/screenshots/.
 */
import { test } from '@playwright/test';
import { EXERCISE_URL, submitGoodReport, triggerBugInTestObject } from './helpers';

const DIR = 'docs/screenshots';

test('Screenshots für die README', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('./');
  await page.screenshot({ path: `${DIR}/start.png` });

  await page.goto(EXERCISE_URL);
  await triggerBugInTestObject(page);
  await page.locator('.two-columns').screenshot({ path: `${DIR}/uebung.png` });

  await submitGoodReport(page);
  await page.getByTestId('grading-result').screenshot({ path: `${DIR}/bewertung.png` });

  await page.getByRole('button', { name: 'Übung beenden', exact: true }).click();
  await page.getByRole('button', { name: 'Ja, beenden und Lösung zeigen' }).click();
  await page
    .locator('article.solution')
    .first()
    .screenshot({ path: `${DIR}/loesung.png` });

  await page.goto('./#/einstellungen');
  await page.getByRole('radio', { name: 'Dunkel' }).check();
  await page.goto(EXERCISE_URL.replace('stufe=1', 'stufe=2'));
  await page.getByTestId('exercise-code').waitFor();
  await page.screenshot({ path: `${DIR}/dunkel.png` });
});
