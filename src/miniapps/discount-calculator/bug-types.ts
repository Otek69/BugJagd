import type { BugDefinition } from '../../core/types';
import type { DiscountHooks, DiscountInput, DiscountParams } from './logic';

/** Typ für Fehlerarten des Rabattrechners. */
export type DiscountBug<BugParams> = BugDefinition<
  DiscountInput,
  DiscountParams,
  DiscountHooks,
  BugParams
>;

export function input(price: string, quantity: string, coupon = ''): DiscountInput {
  return { price, quantity, coupon };
}
