import { describe, expect, it } from 'vitest';
import { describeBugContract } from '../../../core/testing/bug-contract';
import { Rng } from '../../../core/random/rng';
import app from '../index';
import { input } from '../bug-types';
import { correctHooks, EXACT_SCALE } from '../logic';
import { FIXED_PARAMS, runBoth, total } from '../test-fixtures';
import bug, { findHalfCentCase } from './rounding-truncation';

describeBugContract(bug, app);

describe('Rundungsfehler – konkrete Beispiele (ab 10 Stück 5 %)', () => {
  it('1,99 € × 10 Stück − 5 % = genau 18,905 € → korrekt 18,91 €, mit Fehler 18,90 €', () => {
    for (const mode of ['truncate', 'half-down'] as const) {
      const { actual, expected } = runBoth(bug, { mode }, input('1,99', '10'));
      expect(total(expected)).toBe(1891);
      expect(total(actual)).toBe(1890);
    }
  });

  it('Variante "half-down" rundet über einem halben Cent korrekt auf', () => {
    // 1,97 € × 11 = 21,67 €; −5 % = 20,5865 € → 20,59 €
    const { actual, expected } = runBoth(bug, { mode: 'half-down' }, input('1,97', '11'));
    expect(total(expected)).toBe(2059);
    expect(total(actual)).toBe(2059);
  });

  it('Variante "truncate" schneidet auch über einem halben Cent ab', () => {
    const { actual } = runBoth(bug, { mode: 'truncate' }, input('1,97', '11'));
    expect(total(actual)).toBe(2058);
  });

  it('findHalfCentCase findet für 500 Varianten immer einen Fall mit genau einem halben Cent', () => {
    for (let i = 0; i < 500; i++) {
      const params = app.generateParams(new Rng(`half-cent-${i}`));
      const found = findHalfCentCase(params);
      const exact = correctHooks.applyDiscounts(
        found.priceCents * found.quantity,
        params.tiers[0].rate,
        0,
      );
      expect(exact % EXACT_SCALE).toBe(EXACT_SCALE / 2);
    }
  });

  it('findHalfCentCase liefert für die festen Parameter einen gültigen Fall', () => {
    const found = findHalfCentCase(FIXED_PARAMS);
    expect(found.quantity).toBeGreaterThanOrEqual(10);
    expect(found.quantity).toBeLessThan(50);
  });
});
