/**
 * Rabattrechner – korrekte Logik.
 *
 * Alle Geldbeträge sind ganze Cent. So entstehen keine Gleitkomma-Fehler
 * (0,1 + 0,2 ist in JavaScript 0,30000000000000004).
 *
 * Jede Funktion in DiscountHooks ist ein Einfügepunkt (injection point).
 * Eine Fehlerart darf genau einen davon durch eine fehlerhafte Version ersetzen.
 */
import type { RawInput } from '../../core/types';

export interface DiscountInput extends RawInput {
  price: string;
  quantity: string;
  coupon: string;
}

export interface Tier {
  /** Ab dieser Menge gilt der Rabatt. */
  min: number;
  /** Rabatt in Prozent (ganze Zahl). */
  rate: number;
}

export interface DiscountParams {
  productName: string;
  maxQuantity: number;
  /** Zwei Rabattstufen, aufsteigend: tiers[0].min < tiers[1].min */
  tiers: [Tier, Tier];
  coupon: { code: string; rate: number };
}

export type DiscountField = 'price' | 'quantity' | 'coupon';

export type DiscountOutput =
  | {
      ok: true;
      subtotalCents: number;
      quantityRate: number;
      couponRate: number;
      quantityDiscountCents: number;
      couponDiscountCents: number;
      totalCents: number;
    }
  | { ok: false; errors: Partial<Record<DiscountField, string>> };

/**
 * Genauigkeit für exakte Zwischenergebnisse: Betrag in Cent mal 10 000.
 * Beispiel: 1890,5 Cent werden als 18 905 000 gespeichert (ganze Zahl).
 */
export const EXACT_SCALE = 10_000;

export interface DiscountHooks {
  /** Liest den Preis-Text. Ergebnis: Cent, oder null bei ungültigem Format. */
  parsePrice(raw: string): number | null;
  /** Liegt der Preis im erlaubten Bereich? */
  isPriceValid(cents: number): boolean;
  /** Liest den Mengen-Text. Ergebnis: ganze Zahl, oder null bei ungültigem Format. */
  parseQuantity(raw: string): number | null;
  /** Liegt die Menge im erlaubten Bereich? */
  isQuantityValid(quantity: number, params: DiscountParams): boolean;
  /** Mengenrabatt in Prozent für diese Menge. */
  quantityRate(quantity: number, params: DiscountParams): number;
  /** Gutschein-Rabatt in Prozent. 0 = kein Gutschein. null = unbekannter Code. */
  couponRate(raw: string, params: DiscountParams): number | null;
  /** Exakter Endpreis (Cent × EXACT_SCALE) nach beiden Rabatten. */
  applyDiscounts(subtotalCents: number, quantityRate: number, couponRate: number): number;
  /** Rundet einen exakten Betrag (Cent × EXACT_SCALE) auf ganze Cent. */
  roundCents(exact: number): number;
}

export const MIN_PRICE_CENTS = 1;
export const MAX_PRICE_CENTS = 999_999;

export const correctHooks: DiscountHooks = {
  parsePrice(raw) {
    const text = raw.trim();
    // 1 bis 4 Ziffern, optional Komma oder Punkt mit 1 bis 2 Nachkommastellen.
    const match = /^(\d{1,4})(?:[.,](\d{1,2}))?$/.exec(text);
    if (!match) return null;
    const euros = Number(match[1]);
    const cents = Number((match[2] ?? '').padEnd(2, '0'));
    return euros * 100 + cents;
  },
  isPriceValid(cents) {
    return cents >= MIN_PRICE_CENTS && cents <= MAX_PRICE_CENTS;
  },
  parseQuantity(raw) {
    const text = raw.trim();
    if (!/^[+-]?\d{1,6}$/.test(text)) return null;
    const value = Number.parseInt(text, 10);
    return value === 0 ? 0 : value; // vermeidet -0
  },
  isQuantityValid(quantity, params) {
    return quantity >= 1 && quantity <= params.maxQuantity;
  },
  quantityRate(quantity, params) {
    const [low, high] = params.tiers;
    if (quantity >= high.min) return high.rate;
    if (quantity >= low.min) return low.rate;
    return 0;
  },
  couponRate(raw, params) {
    const text = raw.trim();
    if (text === '') return 0;
    return text.toUpperCase() === params.coupon.code ? params.coupon.rate : null;
  },
  applyDiscounts(subtotalCents, quantityRate, couponRate) {
    // Erst Mengenrabatt, dann Gutschein auf den reduzierten Betrag.
    return subtotalCents * (100 - quantityRate) * (100 - couponRate);
  },
  roundCents(exact) {
    // Kaufmännisch: ab einem halben Cent aufrunden.
    const half = EXACT_SCALE / 2;
    if (exact >= 0) return Math.floor((exact + half) / EXACT_SCALE);
    return -Math.floor((-exact + half) / EXACT_SCALE);
  },
};

export function runDiscount(
  input: DiscountInput,
  params: DiscountParams,
  hooks: DiscountHooks,
): DiscountOutput {
  const errors: Partial<Record<DiscountField, string>> = {};

  let price: number | null = null;
  if (input.price.trim() === '') {
    errors.price = 'Bitte einen Einzelpreis eingeben.';
  } else {
    price = hooks.parsePrice(input.price);
    if (price === null) {
      errors.price = 'Ungültiges Format. Beispiele: 19,99 oder 19.99';
    } else if (!hooks.isPriceValid(price)) {
      errors.price = 'Der Preis muss zwischen 0,01 € und 9.999,99 € liegen.';
    }
  }

  let quantity: number | null = null;
  if (input.quantity.trim() === '') {
    errors.quantity = 'Bitte eine Menge eingeben.';
  } else {
    quantity = hooks.parseQuantity(input.quantity);
    if (quantity === null) {
      errors.quantity = 'Die Menge muss eine ganze Zahl sein.';
    } else if (!hooks.isQuantityValid(quantity, params)) {
      errors.quantity = `Die Menge muss zwischen 1 und ${params.maxQuantity} liegen.`;
    }
  }

  const couponRate = hooks.couponRate(input.coupon, params);
  if (couponRate === null) {
    errors.coupon = 'Dieser Gutscheincode ist unbekannt.';
  }

  if (
    Object.keys(errors).length > 0 ||
    price === null ||
    quantity === null ||
    couponRate === null
  ) {
    return { ok: false, errors };
  }

  const subtotalCents = price * quantity;
  const quantityRate = hooks.quantityRate(quantity, params);
  const totalCents = hooks.roundCents(
    hooks.applyDiscounts(subtotalCents, quantityRate, couponRate),
  );
  const quantityDiscountCents = hooks.roundCents(
    subtotalCents * quantityRate * (EXACT_SCALE / 100),
  );
  const couponDiscountCents = subtotalCents - quantityDiscountCents - totalCents;

  return {
    ok: true,
    subtotalCents,
    quantityRate,
    couponRate,
    quantityDiscountCents,
    couponDiscountCents,
    totalCents,
  };
}

const FIELD_LABELS: Record<DiscountField, string> = {
  price: 'Einzelpreis',
  quantity: 'Menge',
  coupon: 'Gutschein',
};

export function discountOutputsDiffer(a: DiscountOutput, b: DiscountOutput): boolean {
  if (a.ok !== b.ok) return true;
  if (!a.ok && !b.ok) {
    const keysA = Object.keys(a.errors).sort().join(',');
    const keysB = Object.keys(b.errors).sort().join(',');
    return keysA !== keysB;
  }
  if (a.ok && b.ok) {
    return (
      a.subtotalCents !== b.subtotalCents ||
      a.quantityRate !== b.quantityRate ||
      a.couponRate !== b.couponRate ||
      a.quantityDiscountCents !== b.quantityDiscountCents ||
      a.couponDiscountCents !== b.couponDiscountCents ||
      a.totalCents !== b.totalCents
    );
  }
  return false;
}

export function describeDiscountOutput(
  output: DiscountOutput,
  format: (c: number) => string,
): string {
  if (!output.ok) {
    const parts = (Object.keys(output.errors) as DiscountField[]).map(
      (field) => `${FIELD_LABELS[field]}: „${output.errors[field]}“`,
    );
    return `Fehlermeldung – ${parts.join('; ')}`;
  }
  return [
    `Zwischensumme ${format(output.subtotalCents)}`,
    `Mengenrabatt ${output.quantityRate} % (${format(output.quantityDiscountCents)})`,
    `Gutschein ${output.couponRate} % (${format(output.couponDiscountCents)})`,
    `Endpreis ${format(output.totalCents)}`,
  ].join(', ');
}
