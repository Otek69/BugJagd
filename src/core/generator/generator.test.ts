import { describe, expect, it } from 'vitest';
import { CATALOG } from '../../miniapps/registry';
import { Rng } from '../random/rng';
import { CODE_ALPHABET } from '../random/code';
import type { AnyBug, Level } from '../types';
import { CURRENT_CATALOG_VERSION } from './catalog-version';
import { generateExercise, LEVEL_RULES, everyBugIsProvable } from './generator';

function codeFor(i: number): string {
  const rng = new Rng(`gen-test-${i}`);
  let s = '';
  for (let k = 0; k < 8; k++) s += rng.pick([...CODE_ALPHABET]);
  return `BUG-${s.slice(0, 4)}-${s.slice(4)}`;
}

function summary(code: string, level: Level, catalog = CATALOG) {
  const ex = generateExercise(catalog, { code, level, catalogVersion: 1 });
  return {
    app: ex.app.id,
    appParams: ex.appParams,
    bugs: ex.bugs.map((b) => ({ id: b.bug.id, params: b.params })),
  };
}

describe('Fehler-Generator', () => {
  it('gleicher Code + gleiche Stufe = gleiche Übung', () => {
    expect(summary('BUG-7F3A-K9Q2', 2)).toEqual(summary('BUG-7F3A-K9Q2', 2));
  });

  it('anderer Code ergibt (fast immer) eine andere Übung', () => {
    const variants = new Set(
      Array.from({ length: 50 }, (_, i) => JSON.stringify(summary(codeFor(i), 2))),
    );
    expect(variants.size).toBeGreaterThan(40);
  });

  for (const level of [1, 2, 3] as const) {
    it(`Stufe ${level}: Anzahl und Art der Fehler passen zu den Regeln (1000 Codes)`, () => {
      const rules = LEVEL_RULES[level];
      for (let i = 0; i < 1000; i++) {
        const ex = generateExercise(CATALOG, { code: codeFor(i), level, catalogVersion: 1 });
        expect(ex.bugs.length).toBeGreaterThanOrEqual(rules.minBugs);
        expect(ex.bugs.length).toBeLessThanOrEqual(rules.maxBugs);
        for (const b of ex.bugs)
          expect(b.bug.obviousness).toBeLessThanOrEqual(rules.maxObviousness);
        const points = ex.bugs.map((b) => b.bug.injectionPoint);
        expect(new Set(points).size).toBe(points.length);
        expect(everyBugIsProvable(ex)).toBe(true);
      }
    });
  }

  it('alle 5 Fehlerarten kommen in Stufe 3 vor', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 300; i++) {
      for (const b of generateExercise(CATALOG, { code: codeFor(i), level: 3, catalogVersion: 1 })
        .bugs) {
        seen.add(b.bug.id);
      }
    }
    expect(seen.size).toBe(CATALOG.bugs.length);
  });

  it('Golden Seeds: feste Codes ergeben immer genau diese Übungen', () => {
    // Wenn dieser Test fehlschlägt, hat sich die Bedeutung alter Übungscodes geändert.
    // Das darf nicht passieren. Siehe docs/ADDING_A_BUG.md, Abschnitt "Stabile Codes".
    expect(summary('BUG-7F3A-K9Q2', 1)).toEqual({
      app: 'discount-calculator',
      appParams: {
        productName: 'Wasserflasche 0,5 l',
        maxQuantity: 199,
        tiers: [
          { min: 5, rate: 7 },
          { min: 15, rate: 11 },
        ],
        coupon: { code: 'SOMMER5', rate: 5 },
      },
      bugs: [
        { id: 'discount.boundary-quantity-threshold', params: { tierIndex: 1, mode: 'late' } },
      ],
    });
    expect(summary('BUG-2345-6789', 2).bugs).toEqual([
      { id: 'discount.rounding-truncation', params: { mode: 'truncate' } },
    ]);
    expect(summary('BUG-ABCD-EFGH', 3).bugs).toEqual([
      { id: 'discount.decimal-comma-parsing', params: { mode: 'cut-at-comma' } },
      { id: 'discount.missing-quantity-validation', params: { mode: 'no-lower-bound' } },
    ]);
    expect(summary('BUG-XYZW-VUTS', 3).bugs).toEqual([
      { id: 'discount.discounts-added-not-chained', params: {} },
      { id: 'discount.boundary-quantity-threshold', params: { tierIndex: 1, mode: 'late' } },
    ]);
  });

  it('eine neue Fehlerart mit höherer Katalog-Version ändert alte Codes nicht', () => {
    const template = CATALOG.bugs[0] as AnyBug;
    const futureBug: AnyBug = {
      ...template,
      id: 'discount.aaa-future-bug',
      since: CURRENT_CATALOG_VERSION + 1,
    };
    const extended = { apps: CATALOG.apps, bugs: [futureBug, ...CATALOG.bugs] };
    for (let i = 0; i < 200; i++) {
      for (const level of [1, 2, 3] as const) {
        expect(summary(codeFor(i), level, extended)).toEqual(summary(codeFor(i), level));
      }
    }
  });

  it('meldet einen klaren Fehler, wenn es keine Mini-App gibt', () => {
    expect(() =>
      generateExercise(
        { apps: [], bugs: [] },
        { code: 'BUG-2222-2222', level: 1, catalogVersion: 1 },
      ),
    ).toThrow(/Keine Mini-App/);
  });
});
