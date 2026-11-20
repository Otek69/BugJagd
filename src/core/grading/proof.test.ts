import { describe, expect, it } from 'vitest';
import app from '../../miniapps/discount-calculator';
import boundary from '../../miniapps/discount-calculator/bugs/boundary-quantity-threshold';
import comma from '../../miniapps/discount-calculator/bugs/decimal-comma-parsing';
import validation from '../../miniapps/discount-calculator/bugs/missing-quantity-validation';
import { FIXED_PARAMS } from '../../miniapps/discount-calculator/test-fixtures';
import type { Exercise } from '../types';
import { checkProof } from './proof';

const exercise: Exercise = {
  code: 'BUG-TEST-TEST',
  level: 3,
  catalogVersion: 1,
  app,
  appParams: FIXED_PARAMS,
  bugs: [
    { bug: boundary, params: { tierIndex: 0, mode: 'late' } },
    { bug: comma, params: { mode: 'cut-at-comma' } },
    { bug: validation, params: { mode: 'zero-allowed' } },
  ],
};

const inp = (price: string, quantity: string, coupon = '') => ({ price, quantity, coupon });

describe('Prüfung der Beweis-Eingabe', () => {
  it('korrektes Verhalten beweist nichts', () => {
    const result = checkProof(exercise, inp('10', '2'));
    expect(result.programDiffers).toBe(false);
    expect(result.triggeredBugIds).toEqual([]);
  });

  it('ordnet eine Eingabe genau dem passenden Fehler zu', () => {
    expect(checkProof(exercise, inp('10', '10')).triggeredBugIds).toEqual([boundary.id]);
    expect(checkProof(exercise, inp('19,99', '1')).triggeredBugIds).toEqual([comma.id]);
    expect(checkProof(exercise, inp('10', '0')).triggeredBugIds).toEqual([validation.id]);
  });

  it('erkennt, wenn eine Eingabe zwei Fehler gleichzeitig auslöst', () => {
    expect(checkProof(exercise, inp('19,99', '10')).triggeredBugIds.sort()).toEqual(
      [boundary.id, comma.id].sort(),
    );
  });

  it('liefert erwartetes und tatsächliches Ergebnis', () => {
    const result = checkProof(exercise, inp('10', '10'));
    expect(result.expected).toMatchObject({ ok: true, totalCents: 9500 });
    expect(result.actual).toMatchObject({ ok: true, totalCents: 10000 });
  });
});
