/**
 * Fehlerart: Dezimalkomma wird falsch gelesen.
 * Variante "cut-at-comma":   "19,99" wird als 19 gelesen (wie parseFloat in JavaScript).
 * Variante "comma-removed": "19,99" wird als 1999 gelesen (Komma als Tausendertrennzeichen).
 */
import { input, type DiscountBug } from '../bug-types';

interface Params {
  mode: 'cut-at-comma' | 'comma-removed';
}

const bug: DiscountBug<Params> = {
  id: 'discount.decimal-comma-parsing',
  miniAppId: 'discount-calculator',
  category: 'locale',
  since: 1,
  obviousness: 1,
  injectionPoint: 'parsePrice',
  severity: 'high',

  generateParams: (rng) => ({ mode: rng.pick(['cut-at-comma', 'comma-removed'] as const) }),

  inject: (bp, _app, correct) => ({
    parsePrice(raw) {
      if (bp.mode === 'comma-removed') return correct.parsePrice(raw.replace(/,/g, ''));
      const value = Number.parseFloat(raw.trim());
      return Number.isNaN(value) ? null : Math.round(value * 100);
    },
  }),

  exampleTrigger: () => input('19,99', '1'),
  exampleNonTrigger: () => input('19.99', '1'),

  hints: () => [
    'Lies die Anforderung A1 (Einzelpreis). Welche Schreibweisen sind erlaubt?',
    'Teste beide erlaubten Schreibweisen für Dezimalzahlen.',
    'Vergleiche den Preis 19,99 mit dem Preis 19.99.',
  ],

  explain: (_app, bp) => ({
    title:
      bp.mode === 'cut-at-comma'
        ? 'Preis mit Dezimalkomma wird beim Komma abgeschnitten (19,99 → 19,00)'
        : 'Komma im Preis wird ignoriert (19,99 → 1.999,00)',
    why:
      bp.mode === 'cut-at-comma'
        ? 'In Österreich schreibt man Dezimalzahlen mit Komma. Die JavaScript-Funktion parseFloat kennt aber nur den Punkt. Sie liest „19,99“ bis zum Komma und hört dann auf. Ergebnis: 19.'
        : 'Der Code entfernt alle Kommas, weil er sie für Tausendertrennzeichen hält (wie in „1,000“ im Englischen). Aus „19,99“ wird „1999“.',
    buggyCode:
      bp.mode === 'cut-at-comma'
        ? 'const preis = parseFloat(eingabe);  // "19,99" → 19'
        : 'const preis = Number(eingabe.replace(",", ""));  // "19,99" → 1999',
    fixedCode: 'const preis = Number(eingabe.replace(",", "."));  // "19,99" → 19.99',
    howToFind:
      'Äquivalenzklassenbildung (Equivalence Partitioning) für das Eingabeformat: „ganze Zahl“, „mit Dezimalpunkt“, „mit Dezimalkomma“, „ungültiges Format“. Aus jeder Klasse einen Wert testen. Wer nur „19.99“ oder nur ganze Zahlen testet, findet den Fehler nicht.',
    learned:
      'Eingaben in verschiedenen Schreibweisen sind eigene Äquivalenzklassen. Software, die in Österreich benutzt wird, muss das Dezimalkomma verstehen. Teste immer die Schreibweise, die echte Benutzer verwenden.',
    syllabus: ['4.2.1'],
  }),
};

export default bug;
