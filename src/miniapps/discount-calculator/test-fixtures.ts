import { singleBugExercise } from '../../core/testing/bug-contract';
import { runActual, runExpected } from '../../core/grading/proof';
import type { AnyBug } from '../../core/types';
import app from './index';
import type { DiscountInput, DiscountOutput, DiscountParams } from './logic';

/** Feste Parameter für gut lesbare Tests. */
export const FIXED_PARAMS: DiscountParams = {
  productName: 'Testprodukt',
  maxQuantity: 199,
  tiers: [
    { min: 10, rate: 5 },
    { min: 50, rate: 9 },
  ],
  coupon: { code: 'SPAR10', rate: 10 },
};

export function runBoth(
  bug: AnyBug,
  bugParams: unknown,
  input: DiscountInput,
  appParams = FIXED_PARAMS,
) {
  const exercise = singleBugExercise(app, appParams, bug, bugParams);
  return {
    actual: runActual(exercise, input) as DiscountOutput,
    expected: runExpected(exercise, input) as DiscountOutput,
  };
}

export function total(output: DiscountOutput): number | 'error' {
  return output.ok ? output.totalCents : 'error';
}
