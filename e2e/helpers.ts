import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

/**
 * Feste Übung für die Tests: BUG-7F3A-K9Q2, Stufe 1.
 * Versteckter Fehler: Mengenrabatt 11 % ab 15 Stück beginnt erst bei 16 Stück.
 * Bei Preis 10 und Menge 15: korrekt 133,50 €, im Testobjekt 139,50 €.
 */
export const CODE = 'BUG-7F3A-K9Q2';
export const EXERCISE_URL = `./#/uebung?code=${CODE}&stufe=1`;

export async function expectNoA11yViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);
}

export async function triggerBugInTestObject(page: Page) {
  const app = page.getByRole('form', { name: 'Rabattrechner' });
  await app.getByLabel('Einzelpreis in Euro').fill('10');
  await app.getByLabel('Menge (Stück)').fill('15');
  await app.getByRole('button', { name: 'Preis berechnen' }).click();
  await expect(page.getByTestId('total')).toHaveText('139,50 €');
}

export async function submitGoodReport(page: Page) {
  await page
    .getByRole('button', { name: 'Aktuelle Eingabe aus dem Testobjekt übernehmen' })
    .click();
  await page.getByLabel('Titel (Title)').fill('Mengenrabatt fehlt bei genau 15 Stück');
  await page
    .getByLabel('Schritte zum Nachstellen (Steps to Reproduce)')
    .fill('1. Einzelpreis 10 eingeben\n2. Menge 15 eingeben\n3. Auf Preis berechnen klicken');
  await page
    .getByLabel('Erwartetes Ergebnis (Expected Result)')
    .fill('Mengenrabatt 11 %, Endpreis 133,50 € (A3)');
  await page
    .getByLabel('Tatsächliches Ergebnis (Actual Result)')
    .fill('Mengenrabatt 7 %, Endpreis 139,50 €');
  await page.getByRole('radio', { name: /^Mittel \(Medium\): Eine Funktion/ }).check();
  await page.getByRole('radio', { name: /^Mittel \(Medium\): Soll im normalen/ }).check();
  await page.getByRole('button', { name: 'Fehlerbericht abschicken' }).click();
}
