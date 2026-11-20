/**
 * Fehlerart: Grenzwertfehler beim Mengenrabatt (Off-by-one).
 * Variante "late":  ">" statt ">="  → Rabatt beginnt ein Stück zu spät.
 * Variante "early": ">= min - 1"     → Rabatt beginnt ein Stück zu früh.
 */
import { input, type DiscountBug } from '../bug-types';

interface Params {
  tierIndex: 0 | 1;
  mode: 'late' | 'early';
}

const bug: DiscountBug<Params> = {
  id: 'discount.boundary-quantity-threshold',
  miniAppId: 'discount-calculator',
  category: 'boundary',
  since: 1,
  obviousness: 1,
  injectionPoint: 'quantityRate',
  severity: 'medium',

  generateParams: (rng) => ({
    tierIndex: rng.pick([0, 1] as const),
    mode: rng.pick(['late', 'early'] as const),
  }),

  inject: (bp) => ({
    quantityRate(quantity, params) {
      for (const index of [1, 0] as const) {
        const tier = params.tiers[index];
        let reached = quantity >= tier.min;
        if (index === bp.tierIndex) {
          reached = bp.mode === 'late' ? quantity > tier.min : quantity >= tier.min - 1;
        }
        if (reached) return tier.rate;
      }
      return 0;
    },
  }),

  exampleTrigger: (app, bp) => {
    const min = app.tiers[bp.tierIndex].min;
    return input('10', String(bp.mode === 'late' ? min : min - 1));
  },
  exampleNonTrigger: (app, bp) => {
    const min = app.tiers[bp.tierIndex].min;
    return input('10', String(bp.mode === 'late' ? min + 1 : min - 2));
  },

  hints: (app, bp) => {
    const min = app.tiers[bp.tierIndex].min;
    return [
      'Lies die Anforderung A3 (Mengenrabatt) genau. Wo ändert sich der Rabatt?',
      'Teste die Menge genau an jeder Grenze, an der sich der Rabatt ändert, und jeweils eins darunter und eins darüber.',
      `Teste die Mengen ${min - 1}, ${min} und ${min + 1}.`,
    ];
  },

  explain: (app, bp) => {
    const tier = app.tiers[bp.tierIndex];
    const late = bp.mode === 'late';
    return {
      title: late
        ? `Mengenrabatt ${tier.rate} % beginnt erst bei ${tier.min + 1} statt bei ${tier.min} Stück`
        : `Mengenrabatt ${tier.rate} % beginnt schon bei ${tier.min - 1} statt bei ${tier.min} Stück`,
      why: late
        ? `Die Anforderung sagt „ab ${tier.min} Stück“. „Ab“ bedeutet: ${tier.min} gehört dazu. Im Code steht aber „größer als“ (>) statt „größer oder gleich“ (>=). Darum bekommt man bei genau ${tier.min} Stück den Rabatt nicht.`
        : `Die Anforderung sagt „ab ${tier.min} Stück“. Im Code wird aber von der Grenze 1 abgezogen. Darum bekommt man schon bei ${tier.min - 1} Stück den Rabatt.`,
      buggyCode: late
        ? `if (menge > ${tier.min}) {\n  rabatt = ${tier.rate};\n}`
        : `if (menge >= ${tier.min} - 1) {\n  rabatt = ${tier.rate};\n}`,
      fixedCode: `if (menge >= ${tier.min}) {\n  rabatt = ${tier.rate};\n}`,
      howToFind: `Grenzwertanalyse (Boundary Value Analysis): Für jede Grenze testet man den Wert genau auf der Grenze und den Nachbarn daneben. Hier: ${tier.min - 1} (kein Rabatt dieser Stufe) und ${tier.min} (Rabatt dieser Stufe). Mit der 3-Werte-Variante zusätzlich ${tier.min + 1}.`,
      learned:
        'Fehler passieren besonders oft genau an Grenzen, weil „>“ und „>=“ leicht verwechselt werden. Darum testet man immer den Grenzwert selbst und seinen direkten Nachbarn. Ein Test mit einem Wert irgendwo in der Mitte findet diesen Fehler nicht.',
      syllabus: ['4.2.2'],
    };
  },
};

export default bug;
