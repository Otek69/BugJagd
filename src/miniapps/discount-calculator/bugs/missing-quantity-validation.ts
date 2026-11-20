/**
 * Fehlerart: Fehlende Eingabeprüfung der Menge.
 * Variante "no-lower-bound": Nur die Obergrenze wird geprüft → 0 und negative Mengen gehen durch.
 * Variante "zero-allowed":   Untergrenze ist 0 statt 1 → Menge 0 geht durch.
 */
import { input, type DiscountBug } from '../bug-types';

interface Params {
  mode: 'no-lower-bound' | 'zero-allowed';
}

const bug: DiscountBug<Params> = {
  id: 'discount.missing-quantity-validation',
  miniAppId: 'discount-calculator',
  category: 'validation',
  since: 1,
  obviousness: 1,
  injectionPoint: 'isQuantityValid',
  severity: 'high',

  generateParams: (rng) => ({ mode: rng.pick(['no-lower-bound', 'zero-allowed'] as const) }),

  inject: (bp) => ({
    isQuantityValid(quantity, params) {
      if (bp.mode === 'no-lower-bound') return quantity <= params.maxQuantity;
      return quantity >= 0 && quantity <= params.maxQuantity;
    },
  }),

  exampleTrigger: (_app, bp) => input('10', bp.mode === 'no-lower-bound' ? '-3' : '0'),
  exampleNonTrigger: () => input('10', '2'),

  hints: (_app, bp) => [
    'Lies die Anforderung A2 (Menge). Welche Werte sind ungültig?',
    'Teste nicht nur gültige Mengen. Teste auch Werte, die kleiner als das erlaubte Minimum sind.',
    bp.mode === 'no-lower-bound'
      ? 'Teste eine negative Menge, zum Beispiel -3.'
      : 'Teste die Menge 0.',
  ],

  explain: (app, bp) => ({
    title:
      bp.mode === 'no-lower-bound'
        ? 'Negative Mengen und die Menge 0 werden angenommen'
        : 'Die Menge 0 wird angenommen',
    why:
      bp.mode === 'no-lower-bound'
        ? `Die Anforderung A2 sagt: Menge von 1 bis ${app.maxQuantity}. Der Code prüft aber nur die Obergrenze. Darum entsteht bei -3 Stück ein negativer Preis statt einer Fehlermeldung.`
        : `Die Anforderung A2 sagt: Menge von 1 bis ${app.maxQuantity}. Der Code beginnt aber bei 0. Darum wird bei 0 Stück der Preis 0,00 € angezeigt statt einer Fehlermeldung.`,
    buggyCode:
      bp.mode === 'no-lower-bound'
        ? `function mengeGueltig(menge) {\n  return menge <= ${app.maxQuantity};\n}`
        : `function mengeGueltig(menge) {\n  return menge >= 0 && menge <= ${app.maxQuantity};\n}`,
    fixedCode: `function mengeGueltig(menge) {\n  return menge >= 1 && menge <= ${app.maxQuantity};\n}`,
    howToFind: `Äquivalenzklassenbildung (Equivalence Partitioning): Die Menge hat drei Klassen: zu klein (0 und weniger, ungültig), gültig (1 bis ${app.maxQuantity}), zu groß (mehr als ${app.maxQuantity}, ungültig). Aus jeder Klasse testet man mindestens einen Wert. Mit Grenzwertanalyse zusätzlich 0 und 1.`,
    learned:
      'Man testet nicht nur, ob gültige Eingaben funktionieren. Man testet auch, ob ungültige Eingaben abgelehnt werden. Für jede ungültige Äquivalenzklasse braucht man einen eigenen Testfall.',
    syllabus: ['4.2.1', '4.2.2'],
  }),
};

export default bug;
