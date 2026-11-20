/**
 * Rabattrechner – Varianten und Anforderungen.
 * Die Zahlen ändern sich mit dem Übungscode. So kann man Lösungen nicht auswendig lernen.
 */
import type { Rng } from '../../core/random/rng';
import type { Requirement } from '../../core/types';
import type { DiscountParams } from './logic';

const PRODUCTS = [
  'Kugelschreiber',
  'Notizbuch A5',
  'Kaffeebohnen 1 kg',
  'USB-Kabel 2 m',
  'Teebeutel (20 Stück)',
  'Druckerpapier 500 Blatt',
  'Tennisbälle (3 Stück)',
  'Glühbirne LED',
  'Bleistift HB',
  'Wasserflasche 0,5 l',
];

const COUPON_PREFIXES = ['SPAR', 'WINTER', 'SOMMER', 'HERBST', 'TREUE', 'DANKE'];

export function generateDiscountParams(rng: Rng): DiscountParams {
  // Rabatte sind ungerade Prozentzahlen. Dadurch gibt es immer Preise,
  // bei denen genau ein halber Cent entsteht (wichtig für Rundungsfehler).
  const lowRate = rng.pick([3, 5, 7]);
  const highRate = lowRate + rng.pick([2, 4, 6]);
  const lowMin = rng.pick([5, 8, 10, 12, 15, 20]);
  const highMin = lowMin * rng.pick([3, 4, 5]);
  const maxQuantity = rng.pick([199, 499, 999]);
  const couponRate = rng.pick([5, 10, 15, 20]);
  const couponCode = `${rng.pick(COUPON_PREFIXES)}${couponRate}`;
  return {
    productName: rng.pick(PRODUCTS),
    maxQuantity,
    tiers: [
      { min: lowMin, rate: lowRate },
      { min: highMin, rate: highRate },
    ],
    coupon: { code: couponCode, rate: couponRate },
  };
}

export function discountRequirements(p: DiscountParams): Requirement[] {
  const [low, high] = p.tiers;
  return [
    {
      id: 'A1',
      title: 'Einzelpreis',
      text:
        'Pflichtfeld. Mindestens 0,01 €, höchstens 9.999,99 €. Erlaubt sind Dezimalkomma (19,99) und ' +
        'Dezimalpunkt (19.99) mit höchstens 2 Nachkommastellen, ohne Tausendertrennzeichen. ' +
        'Sonst erscheint eine Fehlermeldung beim Einzelpreis.',
    },
    {
      id: 'A2',
      title: 'Menge',
      text: `Pflichtfeld. Eine ganze Zahl von 1 bis ${p.maxQuantity}. Sonst erscheint eine Fehlermeldung bei der Menge.`,
    },
    {
      id: 'A3',
      title: 'Mengenrabatt',
      text:
        `Ab ${low.min} Stück gibt es ${low.rate} % Rabatt. Ab ${high.min} Stück gibt es ${high.rate} % ` +
        `Rabatt (statt ${low.rate} %). Unter ${low.min} Stück gibt es keinen Mengenrabatt.`,
    },
    {
      id: 'A4',
      title: 'Gutschein',
      text:
        `Optional. Der Code ${p.coupon.code} gibt ${p.coupon.rate} % Rabatt. Groß- und Kleinschreibung ` +
        'ist egal. Leerzeichen am Anfang und am Ende werden ignoriert. Ein leeres Feld bedeutet: kein ' +
        'Gutschein. Jeder andere Code ergibt eine Fehlermeldung beim Gutschein.',
    },
    {
      id: 'A5',
      title: 'Reihenfolge der Rabatte',
      text:
        'Zuerst wird der Mengenrabatt abgezogen. Danach wird der Gutschein-Rabatt vom bereits ' +
        'reduzierten Betrag abgezogen. Die Prozentsätze werden nicht addiert. Beispiel: 100,00 € mit ' +
        '10 % und danach 10 % ergibt 81,00 €, nicht 80,00 €.',
    },
    {
      id: 'A6',
      title: 'Rundung',
      text:
        'Gerechnet wird mit genauen Zwischenwerten. Nur die angezeigten Beträge werden kaufmännisch ' +
        'auf ganze Cent gerundet: ab einem halben Cent wird aufgerundet. Beispiel: 18,905 € wird 18,91 €.',
    },
    {
      id: 'A7',
      title: 'Anzeige',
      text:
        'Angezeigt werden: Zwischensumme (Einzelpreis × Menge), Mengenrabatt in Prozent und Euro, ' +
        'Gutschein-Rabatt in Prozent und Euro, Endpreis.',
    },
  ];
}
