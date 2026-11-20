/**
 * Fehlerart: Prozent von Prozent – die Rabatte werden addiert statt nacheinander angewendet.
 * Beispiel: 10 % + 10 % = 20 % (falsch). Richtig: 100 → 90 → 81, also 19 %.
 */
import { input, type DiscountBug } from '../bug-types';

type Params = Record<string, never>;

const bug: DiscountBug<Params> = {
  id: 'discount.discounts-added-not-chained',
  miniAppId: 'discount-calculator',
  category: 'calculation',
  since: 1,
  obviousness: 2,
  injectionPoint: 'applyDiscounts',
  severity: 'medium',

  generateParams: () => ({}),

  inject: () => ({
    applyDiscounts(subtotalCents, quantityRate, couponRate) {
      return subtotalCents * (100 - quantityRate - couponRate) * 100;
    },
  }),

  exampleTrigger: (app) => input('100', String(app.tiers[0].min), app.coupon.code),
  exampleNonTrigger: (app) => input('100', '1', app.coupon.code),

  hints: (app) => [
    'Lies die Anforderung A5 (Reihenfolge der Rabatte).',
    'Teste die Kombination: Mengenrabatt und Gutschein gleichzeitig. Rechne das Ergebnis vorher selbst aus.',
    `Teste den Preis 100 mit der Menge ${app.tiers[0].min} und dem Gutschein ${app.coupon.code}.`,
  ],

  explain: (app) => {
    const q = app.tiers[0].rate;
    const c = app.coupon.rate;
    const chained = ((100 - q) * (100 - c)) / 100;
    return {
      title: 'Mengenrabatt und Gutschein werden addiert statt nacheinander abgezogen',
      why: `Die Anforderung A5 sagt: zuerst Mengenrabatt, danach Gutschein vom reduzierten Betrag. Von 100 € bleiben dann ${String(chained).replace('.', ',')} €. Der Code addiert aber die Prozentsätze (${q} % + ${c} % = ${q + c} %). Dann bleiben nur ${100 - q - c} €. Der Kunde bekommt zu viel Rabatt.`,
      buggyCode:
        'const gesamtRabatt = mengenRabatt + gutscheinRabatt;\nendpreis = summe * (100 - gesamtRabatt) / 100;',
      fixedCode:
        'const nachMenge = summe * (100 - mengenRabatt) / 100;\nendpreis = nachMenge * (100 - gutscheinRabatt) / 100;',
      howToFind:
        'Entscheidungstabellentest (Decision Table Testing): Es gibt zwei Bedingungen: Mengenrabatt ja/nein und Gutschein ja/nein. Das ergibt 4 Regeln. Erst die Regel „beide ja“ zeigt den Fehler. Wer jede Bedingung nur einzeln testet, findet ihn nicht.',
      learned:
        'Manche Fehler zeigen sich nur, wenn zwei Bedingungen gleichzeitig erfüllt sind. Eine Entscheidungstabelle zeigt alle Kombinationen, damit keine vergessen wird. Prozent von Prozent ist nicht dasselbe wie Prozent plus Prozent.',
      syllabus: ['4.2.3'],
    };
  },
};

export default bug;
