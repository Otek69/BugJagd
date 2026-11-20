import { describe, expect, it } from 'vitest';
import app from '../../miniapps/discount-calculator';
import boundary from '../../miniapps/discount-calculator/bugs/boundary-quantity-threshold';
import { FIXED_PARAMS } from '../../miniapps/discount-calculator/test-fixtures';
import type { Exercise } from '../types';
import {
  gradeReport,
  splitSteps,
  stripStepPrefix,
  type BugReportDraft,
  type RuleId,
} from './report-rules';

const exercise: Exercise = {
  code: 'BUG-TEST-TEST',
  level: 1,
  catalogVersion: 1,
  app,
  appParams: FIXED_PARAMS,
  bugs: [{ bug: boundary, params: { tierIndex: 0, mode: 'late' } }],
};

const goodReport: BugReportDraft = {
  title: 'Kein Mengenrabatt bei genau 10 Stück',
  steps: ['1. Einzelpreis 10 eingeben', '2. Menge 10 eingeben', '3. Auf Preis berechnen klicken'],
  expected: 'Mengenrabatt 5 %, Endpreis 95,00 € (laut A3)',
  actual: 'Mengenrabatt 0 %, Endpreis 100,00 €',
  severity: 'medium',
  priority: 'medium',
  environment: 'Chrome 131, BugJagd 0.1.0',
  proofInput: { price: '10', quantity: '10', coupon: '' },
};

function ruleOf(report: Partial<BugReportDraft>, id: RuleId) {
  const result = gradeReport(exercise, { ...goodReport, ...report });
  const rule = result.rules.find((r) => r.id === id);
  if (!rule) throw new Error(`Regel ${id} fehlt`);
  return rule;
}

describe('Bewertung des Fehlerberichts', () => {
  it('ein guter Bericht erfüllt alle Regeln und bekommt 100 von 100 Punkten', () => {
    const result = gradeReport(exercise, goodReport);
    expect(result.rules.filter((r) => !r.passed)).toEqual([]);
    expect(result.score).toBe(100);
    expect(result.maxScore).toBe(100);
  });

  it('R1: Eingabe ohne Fehlerwirkung wird nicht als Beweis anerkannt', () => {
    expect(ruleOf({ proofInput: { price: '10', quantity: '11', coupon: '' } }, 'R1').passed).toBe(
      false,
    );
  });

  it.each([
    ['zu kurz', 'Rabatt'],
    ['zu lang', `Rabatt ${'x'.repeat(120)}`],
    ['ohne Bezug zum Testobjekt', 'Etwas funktioniert hier nicht richtig'],
  ])('R2: Titel %s', (_name, title) => {
    expect(ruleOf({ title }, 'R2').passed).toBe(false);
  });

  it('R3: ein Schritt ist zu wenig, zu kurze Schritte werden genannt', () => {
    expect(ruleOf({ steps: ['Menge 10 eingeben und berechnen'] }, 'R3').passed).toBe(false);
    const short = ruleOf({ steps: ['Preis 10 eingeben', 'Menge 10', 'Berechnen'] }, 'R3');
    expect(short.passed).toBe(false);
    expect(short.feedback).toContain('2, 3');
  });

  it('R4: fehlende Werte der Beweis-Eingabe werden genannt', () => {
    const r = ruleOf(
      {
        steps: ['Einen Preis eingeben bitte', 'Menge 10 eingeben jetzt'],
        proofInput: { price: '7', quantity: '10', coupon: '' },
      },
      'R4',
    );
    expect(r.passed).toBe(false);
    expect(r.feedback).toContain('„7“');
  });

  it('R5/R6: ohne konkrete Werte nicht erfüllt', () => {
    expect(ruleOf({ expected: 'Es sollte Rabatt geben' }, 'R5').passed).toBe(false);
    expect(ruleOf({ actual: 'Es gibt keinen Rabatt' }, 'R6').passed).toBe(false);
    expect(ruleOf({ actual: 'Meldung „Bitte eine Menge eingeben.“ erscheint' }, 'R6').passed).toBe(
      true,
    );
  });

  it('R7: Erwartetes im Feld "tatsächlich" wird erkannt', () => {
    expect(ruleOf({ actual: 'Endpreis 100,00 €, sollte aber 95,00 € sein' }, 'R7').passed).toBe(
      false,
    );
    expect(ruleOf({ actual: goodReport.expected }, 'R7').passed).toBe(false);
    // "Mussten" o. Ä. als Teil eines anderen Worts zählt nicht.
    expect(ruleOf({ actual: 'Endpreis 100,00 €, Rabattmuster fehlt' }, 'R7').passed).toBe(true);
  });

  it('R8: Schweregrad mehr als eine Stufe entfernt ist nicht erfüllt', () => {
    expect(ruleOf({ severity: 'high' }, 'R8').passed).toBe(true);
    expect(ruleOf({ severity: 'low' }, 'R8').passed).toBe(true);
    expect(ruleOf({ severity: 'critical' }, 'R8').passed).toBe(false);
    expect(ruleOf({ severity: '' }, 'R8').passed).toBe(false);
  });

  it('R9: Priorität und Umgebung müssen ausgefüllt sein', () => {
    expect(ruleOf({ priority: '' }, 'R9').feedback).toContain('Priorität');
    expect(ruleOf({ environment: ' ' }, 'R9').feedback).toContain('Umgebung');
  });

  it('Hilfsfunktionen für Schritte', () => {
    expect(splitSteps('1. a\n\n2) b\r\n- c')).toEqual(['1. a', '2) b', '- c']);
    expect(stripStepPrefix('12. Menge eingeben')).toBe('Menge eingeben');
    expect(stripStepPrefix('• Menge eingeben')).toBe('Menge eingeben');
  });
});
