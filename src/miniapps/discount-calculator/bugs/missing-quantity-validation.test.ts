import { describe, expect, it } from 'vitest';
import { describeBugContract } from '../../../core/testing/bug-contract';
import app from '../index';
import { input } from '../bug-types';
import { runBoth, total } from '../test-fixtures';
import bug from './missing-quantity-validation';

describeBugContract(bug, app);

describe('Fehlende Mengenprüfung – konkrete Beispiele', () => {
  it('Variante "no-lower-bound": -3 Stück ergibt einen negativen Preis statt einer Fehlermeldung', () => {
    const { actual, expected } = runBoth(bug, { mode: 'no-lower-bound' }, input('10', '-3'));
    expect(total(expected)).toBe('error');
    expect(total(actual)).toBe(-3000);
  });

  it('Variante "zero-allowed": 0 Stück ergibt 0,00 € statt einer Fehlermeldung', () => {
    const { actual, expected } = runBoth(bug, { mode: 'zero-allowed' }, input('10', '0'));
    expect(total(expected)).toBe('error');
    expect(total(actual)).toBe(0);
  });

  it('Variante "zero-allowed": -3 Stück wird weiterhin abgelehnt', () => {
    const { actual } = runBoth(bug, { mode: 'zero-allowed' }, input('10', '-3'));
    expect(total(actual)).toBe('error');
  });

  it('Die Obergrenze wird in beiden Varianten weiterhin geprüft', () => {
    for (const mode of ['no-lower-bound', 'zero-allowed'] as const) {
      const { actual } = runBoth(bug, { mode }, input('10', '200'));
      expect(total(actual)).toBe('error');
    }
  });
});
