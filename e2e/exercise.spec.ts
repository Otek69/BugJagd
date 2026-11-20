import { expect, test } from '@playwright/test';
import {
  CODE,
  EXERCISE_URL,
  expectNoA11yViolations,
  submitGoodReport,
  triggerBugInTestObject,
} from './helpers';

test('kompletter Ablauf: Fehler finden, melden, Übung beenden, Lösung sehen', async ({ page }) => {
  await page.goto(EXERCISE_URL);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Übung: Rabattrechner (Discount Calculator)',
  );
  await expect(page.getByTestId('exercise-code')).toHaveText(CODE);
  await expect(page.getByTestId('found-count')).toHaveText('0 von 1');
  await expectNoA11yViolations(page);

  await triggerBugInTestObject(page);
  await submitGoodReport(page);

  const grading = page.getByTestId('grading-result');
  await expect(grading.getByRole('heading', { level: 3 })).toHaveText(
    'Bewertung: 100 von 100 Punkten',
  );
  await expect(grading.getByRole('heading', { level: 3 })).toBeFocused();
  await expect(grading).toContainText('+50 Erfahrungspunkte');
  await expect(page.getByTestId('found-count')).toHaveText('1 von 1');
  await expect(page.getByText('Du hast alle 1 Fehler gefunden.')).toBeVisible();
  await expectNoA11yViolations(page);

  await page.getByRole('button', { name: 'Übung beenden', exact: true }).click();
  await page.getByRole('button', { name: 'Ja, beenden und Lösung zeigen' }).click();
  await expect(page.getByTestId('solution-summary')).toHaveText('Gefunden: 1 von 1 Fehlern.');
  await expect(page.getByText('Von dir gefunden.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Was hast du gerade gelernt?' })).toBeVisible();
  await expect(
    page.getByText('CTFL 4.0, Kapitel 4.2.2: Grenzwertanalyse (Boundary Value Analysis)'),
  ).toBeVisible();
  await expectNoA11yViolations(page);
});

test('ein Bericht ohne gültigen Beweis wird nachvollziehbar abgelehnt', async ({ page }) => {
  await page.goto(EXERCISE_URL);
  await page.getByLabel('Einzelpreis', { exact: true }).fill('10');
  await page.getByLabel('Menge', { exact: true }).fill('3');
  await page.getByRole('button', { name: 'Fehlerbericht abschicken' }).click();
  const r1 = page.locator('tr[data-rule="R1"]');
  await expect(r1).toContainText('✗ nicht erfüllt');
  await expect(r1).toContainText('Mit dieser Eingabe verhält sich das Programm korrekt.');
  await expect(page.getByTestId('found-count')).toHaveText('0 von 1');
});

test('Fortschritt bleibt nach dem Neuladen erhalten', async ({ page }) => {
  await page.goto(EXERCISE_URL);
  await triggerBugInTestObject(page);
  await submitGoodReport(page);
  await expect(page.getByTestId('found-count')).toHaveText('1 von 1');

  await page.reload();
  await expect(page.getByTestId('found-count')).toHaveText('1 von 1');
  await page.getByRole('link', { name: 'Fortschritt' }).click();
  await expect(page.getByTestId('total-xp')).toHaveText('50 XP');
});

test('Startseite: ungültiger Code zeigt eine genaue Meldung, gültiger Code startet die Übung', async ({
  page,
}) => {
  await page.goto('./');
  await expectNoA11yViolations(page);
  await page.getByLabel('Übungscode').fill('BUG-0000');
  await page.getByRole('button', { name: 'Diesen Code starten' }).click();
  await expect(page.getByText('Der Code braucht genau 8 Zeichen')).toBeVisible();

  await page.getByRole('radio', { name: /Stufe 2/ }).check();
  await page.getByLabel('Übungscode').fill('2345 6789');
  await page.getByRole('button', { name: 'Diesen Code starten' }).click();
  await expect(page).toHaveURL(/#\/uebung\?code=BUG-2345-6789&stufe=2$/);
  await expect(page.getByTestId('exercise-code')).toHaveText('BUG-2345-6789');
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
});

test('ein Link zu einer anderen Übung fragt vorher nach, wenn eine Übung offen ist', async ({
  page,
}) => {
  await page.goto(EXERCISE_URL);
  await expect(page.getByTestId('exercise-code')).toHaveText(CODE);
  await page.goto('./#/uebung?code=BUG-2345-6789&stufe=2');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Übung wechseln?');
  await page.getByRole('button', { name: 'Nein, offene Übung behalten' }).click();
  await expect(page.getByTestId('exercise-code')).toHaveText(CODE);
});

test('ungültiger Link zeigt eine Fehlermeldung', async ({ page }) => {
  await page.goto('./#/uebung?code=BUG-0000-0000&stufe=1');
  await expect(page.getByRole('alert')).toContainText('Diese Zeichen gibt es in Codes nicht: 0');
});
