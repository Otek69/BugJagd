import type { MiniAppDefinition } from '../../core/types';
import { formatCents } from '../../shared/format';
import { DiscountView } from './DiscountView';
import {
  correctHooks,
  describeDiscountOutput,
  discountOutputsDiffer,
  runDiscount,
  type DiscountHooks,
  type DiscountInput,
  type DiscountOutput,
  type DiscountParams,
} from './logic';
import { discountRequirements, generateDiscountParams } from './params';

export type DiscountApp = MiniAppDefinition<
  DiscountInput,
  DiscountOutput,
  DiscountParams,
  DiscountHooks
>;

const discountCalculator: DiscountApp = {
  id: 'discount-calculator',
  title: 'Rabattrechner',
  titleEn: 'Discount Calculator',
  description: 'Berechnet den Endpreis aus Einzelpreis, Menge, Mengenrabatt und Gutschein.',
  since: 1,
  generateParams: generateDiscountParams,
  requirements: discountRequirements,
  inputFields: [
    { key: 'price', label: 'Einzelpreis' },
    { key: 'quantity', label: 'Menge' },
    { key: 'coupon', label: 'Gutschein' },
  ],
  emptyInput: () => ({ price: '', quantity: '', coupon: '' }),
  correctHooks,
  run: runDiscount,
  outputsDiffer: discountOutputsDiffer,
  describeOutput: (output) => describeDiscountOutput(output, formatCents),
  reportKeywords: [
    'preis',
    'einzelpreis',
    'endpreis',
    'menge',
    'stück',
    'rabatt',
    'mengenrabatt',
    'gutschein',
    'code',
    'summe',
    'zwischensumme',
    'rundung',
    'gerundet',
    'cent',
    'komma',
    'punkt',
    'dezimal',
    'betrag',
  ],
  View: DiscountView,
};

export default discountCalculator;
