/**
 * Tests der KORREKTEN Logik gegen die Anforderungen A1–A7.
 * Die korrekte Logik ist das Testorakel. Darum muss sie selbst gut getestet sein.
 */
import { describe, expect, it } from 'vitest';
import { input } from './bug-types';
import { correctHooks, discountOutputsDiffer, runDiscount, type DiscountOutput } from './logic';
import { FIXED_PARAMS } from './test-fixtures';

const run = (price: string, quantity: string, coupon = '') =>
  runDiscount(input(price, quantity, coupon), FIXED_PARAMS, correctHooks);

const totalOf = (o: DiscountOutput) => (o.ok ? o.totalCents : 'error');
const errorFields = (o: DiscountOutput) => (o.ok ? [] : Object.keys(o.errors).sort());

describe('A1 Einzelpreis', () => {
  it.each([
    ['19,99', 1999],
    ['19.99', 1999],
    ['19', 1900],
    ['19,9', 1990],
    [' 19,99 ', 1999],
    ['0,01', 1],
    ['9999,99', 999999],
  ])('gültig: %s → %i Cent', (price, cents) => {
    expect(totalOf(run(price, '1'))).toBe(cents);
  });

  it.each(['', '0', '0,00', '10000', '19,999', '1.234,56', 'abc', '-5', '19 99', '€19'])(
    'ungültig: "%s" ergibt eine Fehlermeldung beim Preis',
    (price) => {
      expect(errorFields(run(price, '1'))).toEqual(['price']);
    },
  );
});

describe('A2 Menge', () => {
  it.each(['1', '199', ' 5 ', '+5'])('gültig: "%s"', (q) => {
    expect(run('1', q).ok).toBe(true);
  });
  it.each(['', '0', '-1', '200', '2,5', 'zwei', '1e2'])('ungültig: "%s"', (q) => {
    expect(errorFields(run('1', q))).toEqual(['quantity']);
  });
});

describe('A3 Mengenrabatt (Grenzwerte 9/10 und 49/50)', () => {
  it.each([
    [9, 0],
    [10, 5],
    [11, 5],
    [49, 5],
    [50, 9],
    [51, 9],
  ])('%i Stück → %i %%', (q, rate) => {
    const out = run('1', String(q));
    expect(out.ok && out.quantityRate).toBe(rate);
  });
});

describe('A4 Gutschein', () => {
  it.each(['SPAR10', 'spar10', ' Spar10 '])('gültig: "%s" → 10 %%', (code) => {
    const out = run('100', '1', code);
    expect(out.ok && out.couponRate).toBe(10);
  });
  it('leer bedeutet kein Gutschein', () => {
    const out = run('100', '1', '   ');
    expect(out.ok && out.couponRate).toBe(0);
  });
  it.each(['SPAR20', 'SPAR 10', 'X'])('unbekannt: "%s"', (code) => {
    expect(errorFields(run('100', '1', code))).toEqual(['coupon']);
  });
});

describe('A5 Reihenfolge und A6 Rundung', () => {
  it('Rabatte werden nacheinander angewendet: 100 € × 10, −5 %, −10 % = 855,00 €', () => {
    const out = run('100', '10', 'SPAR10');
    expect(out).toEqual({
      ok: true,
      subtotalCents: 100000,
      quantityRate: 5,
      couponRate: 10,
      quantityDiscountCents: 5000,
      couponDiscountCents: 9500,
      totalCents: 85500,
    });
  });

  it('genau ein halber Cent wird aufgerundet: 18,905 € → 18,91 €', () => {
    expect(totalOf(run('1,99', '10'))).toBe(1891);
  });

  it('Rundung knapp an der Grenze des halben Cents', () => {
    // 1,01 × 10 = 10,10 €; × 0,95 = 9,595 € → genau halber Cent → 9,60 €
    expect(totalOf(run('1,01', '10'))).toBe(960);
    // 1,03 × 10 = 10,30 €; × 0,95 = 9,785 € → 9,79 €
    expect(totalOf(run('1,03', '10'))).toBe(979);
    // 1,02 × 10 = 10,20 €; × 0,95 = 9,69 € → exakt
    expect(totalOf(run('1,02', '10'))).toBe(969);
  });

  it('Zwischensumme minus beide Rabattbeträge ergibt immer den Endpreis (A7)', () => {
    for (const [p, q, c] of [
      ['1,99', '10', ''],
      ['3,33', '51', 'SPAR10'],
      ['9999,99', '199', 'spar10'],
    ] as const) {
      const out = run(p, q, c);
      expect(out.ok).toBe(true);
      if (out.ok) {
        expect(out.subtotalCents - out.quantityDiscountCents - out.couponDiscountCents).toBe(
          out.totalCents,
        );
      }
    }
  });

  it('größte Eingabe bleibt exakt (keine Überläufe)', () => {
    expect(totalOf(run('9999,99', '199', 'SPAR10'))).toBe(
      Math.floor((999999 * 199 * 91 * 90 + 5000) / 10000),
    );
  });

  it('roundCents rundet negative Beträge symmetrisch', () => {
    expect(correctHooks.roundCents(-15_000)).toBe(-2);
    expect(correctHooks.roundCents(-14_999)).toBe(-1);
  });
});

describe('Vergleich von Ergebnissen', () => {
  it('Fehlermeldungen sind gleich, wenn dieselben Felder betroffen sind', () => {
    expect(discountOutputsDiffer(run('', '1'), run('abc', '1'))).toBe(false);
    expect(discountOutputsDiffer(run('', '1'), run('1', ''))).toBe(true);
  });
  it('Ergebnis und Fehlermeldung sind verschieden', () => {
    expect(discountOutputsDiffer(run('1', '1'), run('1', '0'))).toBe(true);
  });
});
