import { describe, expect, it } from 'vitest';
import { describeBugContract } from '../../../core/testing/bug-contract';
import app from '../index';
import { input } from '../bug-types';
import { runBoth, total } from '../test-fixtures';
import bug from './boundary-quantity-threshold';

describeBugContract(bug, app);

describe('Grenzwertfehler Mengenrabatt – konkrete Beispiele (Stufe ab 10 Stück 5 %)', () => {
  it('Variante "late": bei genau 10 Stück fehlt der Rabatt', () => {
    const { actual, expected } = runBoth(bug, { tierIndex: 0, mode: 'late' }, input('10', '10'));
    expect(total(expected)).toBe(9500); // 100,00 € − 5 % = 95,00 €
    expect(total(actual)).toBe(10000); // kein Rabatt
  });

  it('Variante "late": bei 11 Stück ist alles korrekt', () => {
    const { actual, expected } = runBoth(bug, { tierIndex: 0, mode: 'late' }, input('10', '11'));
    expect(total(actual)).toBe(total(expected));
  });

  it('Variante "early": bei 9 Stück gibt es schon Rabatt', () => {
    const { actual, expected } = runBoth(bug, { tierIndex: 0, mode: 'early' }, input('10', '9'));
    expect(total(expected)).toBe(9000);
    expect(total(actual)).toBe(8550);
  });

  it('Zweite Stufe, Variante "late": bei genau 50 Stück gibt es nur 5 % statt 9 %', () => {
    const { actual, expected } = runBoth(bug, { tierIndex: 1, mode: 'late' }, input('10', '50'));
    expect(total(expected)).toBe(45500);
    expect(total(actual)).toBe(47500);
  });
});
