/**
 * Fehlerart: Falsche Rundung des Endpreises.
 * Variante "truncate":  Nachkommastellen werden abgeschnitten (18,905 → 18,90).
 * Variante "half-down": Bei genau einem halben Cent wird abgerundet (18,905 → 18,90).
 */
import { centsToDotInput } from '../../../shared/format';
import { input, type DiscountBug } from '../bug-types';
import { correctHooks, EXACT_SCALE, type DiscountParams } from '../logic';

interface Params {
  mode: 'truncate' | 'half-down';
}

/**
 * Sucht Preis und Menge, bei denen der exakte Endpreis auf genau einen halben Cent endet.
 * Ohne Gutschein, mit der ersten Rabattstufe.
 */
export function findHalfCentCase(app: DiscountParams): { priceCents: number; quantity: number } {
  const [low, high] = app.tiers;
  for (let quantity = low.min; quantity < high.min; quantity++) {
    for (let priceCents = 101; priceCents <= 9_999; priceCents++) {
      const exact = correctHooks.applyDiscounts(priceCents * quantity, low.rate, 0);
      if (exact % EXACT_SCALE === EXACT_SCALE / 2) return { priceCents, quantity };
    }
  }
  throw new Error('Kein Fall mit halbem Cent gefunden. Die Rabatt-Parameter sind ungeeignet.');
}

const bug: DiscountBug<Params> = {
  id: 'discount.rounding-truncation',
  miniAppId: 'discount-calculator',
  category: 'calculation',
  since: 1,
  obviousness: 3,
  injectionPoint: 'roundCents',
  severity: 'low',

  generateParams: (rng) => ({ mode: rng.pick(['truncate', 'half-down'] as const) }),

  inject: (bp) => ({
    roundCents(exact) {
      const sign = exact < 0 ? -1 : 1;
      const abs = Math.abs(exact);
      const rounded =
        bp.mode === 'truncate'
          ? Math.floor(abs / EXACT_SCALE)
          : Math.ceil((abs - EXACT_SCALE / 2) / EXACT_SCALE);
      return sign * rounded;
    },
  }),

  exampleTrigger: (app) => {
    const found = findHalfCentCase(app);
    return input(centsToDotInput(found.priceCents), String(found.quantity));
  },
  exampleNonTrigger: () => input('10', '1'),

  hints: (app) => {
    const found = findHalfCentCase(app);
    return [
      'Lies die Anforderung A6 (Rundung).',
      'Wähle Preis und Menge so, dass nach dem Mengenrabatt ein halber Cent entsteht. Rechne den genauen Wert selbst aus.',
      `Teste den Preis ${centsToDotInput(found.priceCents).replace('.', ',')} mit der Menge ${found.quantity} und rechne selbst nach.`,
    ];
  },

  explain: (app, bp) => {
    const found = findHalfCentCase(app);
    const exact = correctHooks.applyDiscounts(
      found.priceCents * found.quantity,
      app.tiers[0].rate,
      0,
    );
    const exactEuro = (exact / EXACT_SCALE / 100).toFixed(3).replace('.', ',');
    return {
      title:
        bp.mode === 'truncate'
          ? 'Der Endpreis wird abgeschnitten statt kaufmännisch gerundet'
          : 'Bei genau einem halben Cent wird abgerundet statt aufgerundet',
      why: `Die Anforderung A6 verlangt kaufmännisches Runden: ab einem halben Cent aufrunden. Beispiel aus dieser Übung: ${centsToDotInput(found.priceCents).replace('.', ',')} € × ${found.quantity} Stück mit ${app.tiers[0].rate} % Rabatt ergibt genau ${exactEuro} €. Richtig wäre aufrunden. Der Code ${bp.mode === 'truncate' ? 'schneidet die dritte Nachkommastelle einfach ab' : 'rundet bei genau 0,5 Cent ab'}.`,
      buggyCode:
        bp.mode === 'truncate'
          ? 'function runden(cent) {\n  return Math.floor(cent);\n}'
          : 'function runden(cent) {\n  return Math.ceil(cent - 0.5);\n}',
      fixedCode: 'function runden(cent) {\n  return Math.floor(cent + 0.5);\n}',
      howToFind:
        'Grenzwertanalyse (Boundary Value Analysis) auf das Rundungsergebnis angewendet: Die Grenze liegt bei genau einem halben Cent. Man wählt Eingaben, deren genaues Ergebnis knapp unter, genau auf und knapp über x,xx5 liegt. Dazu muss man das erwartete Ergebnis vorher selbst ausrechnen (Testorakel, test oracle).',
      learned:
        'Rundungsfehler sieht man nur, wenn man das erwartete Ergebnis vorher genau ausrechnet. Ein Unterschied von einem Cent wirkt klein, kann aber bei vielen Bestellungen viel Geld ausmachen. Die Grenze beim Runden ist genau der halbe Cent.',
      syllabus: ['4.2.2', '4.4.1'],
    };
  },
};

export default bug;
