import { describe, expect, it } from 'vitest';
import { describeBugContract } from '../../../core/testing/bug-contract';
import app from '../index';
import { input } from '../bug-types';
import { runBoth, total } from '../test-fixtures';
import bug from './discounts-added-not-chained';

describeBugContract(bug, app);

describe('Rabatte addiert statt nacheinander – konkrete Beispiele (5 % Menge, 10 % Gutschein)', () => {
  it('100 € × 10 Stück mit Gutschein: korrekt 855,00 €, mit Fehler 850,00 €', () => {
    const { actual, expected } = runBoth(bug, {}, input('100', '10', 'SPAR10'));
    expect(total(expected)).toBe(85500); // 1000 → 950 → 855
    expect(total(actual)).toBe(85000); // 1000 × (100 − 15) %
  });

  it('Nur ein Rabatt aktiv: kein Unterschied', () => {
    expect(total(runBoth(bug, {}, input('100', '10')).actual)).toBe(95000);
    expect(total(runBoth(bug, {}, input('100', '1', 'spar10')).actual)).toBe(9000);
  });
});
