import { describe, expect, it } from 'vitest';
import { describeBugContract } from '../../../core/testing/bug-contract';
import app from '../index';
import { input } from '../bug-types';
import { runBoth, total } from '../test-fixtures';
import bug from './decimal-comma-parsing';

describeBugContract(bug, app);

describe('Dezimalkomma – konkrete Beispiele', () => {
  it('Variante "cut-at-comma": 19,99 wird als 19,00 gelesen', () => {
    const { actual, expected } = runBoth(bug, { mode: 'cut-at-comma' }, input('19,99', '1'));
    expect(total(expected)).toBe(1999);
    expect(total(actual)).toBe(1900);
  });

  it('Variante "comma-removed": 19,99 wird als 1.999,00 gelesen', () => {
    const { actual } = runBoth(bug, { mode: 'comma-removed' }, input('19,99', '1'));
    expect(total(actual)).toBe(199900);
  });

  it('Beide Varianten: 19.99 mit Punkt und ganze Zahlen sind korrekt', () => {
    for (const mode of ['cut-at-comma', 'comma-removed'] as const) {
      for (const price of ['19.99', '20', '0.5']) {
        const { actual, expected } = runBoth(bug, { mode }, input(price, '1'));
        expect(total(actual)).toBe(total(expected));
      }
    }
  });
});
