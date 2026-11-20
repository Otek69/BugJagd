/**
 * Gemeinsamer Vertrags-Test für jede Fehlerart.
 * Er beweist für viele zufällige Varianten:
 * 1. Mit dem Fehler löst die Beispiel-Eingabe ein falsches Ergebnis aus.
 * 2. Ohne den Fehler ist das Ergebnis mit derselben Eingabe anders (nämlich korrekt).
 * 3. Bei der Gegen-Eingabe verhält sich das Programm mit dem Fehler korrekt.
 * 4. Die Fehlerart ersetzt nur ihren angegebenen Einfügepunkt.
 */
import { describe, expect, it } from 'vitest';
import { Rng } from '../random/rng';
import { checkProof, runActual, runExpected } from '../grading/proof';
import type { AnyBug, AnyMiniApp, Exercise } from '../types';

export function singleBugExercise(
  app: AnyMiniApp,
  appParams: unknown,
  bug: AnyBug,
  params: unknown,
): Exercise {
  return {
    code: 'BUG-TEST-TEST',
    level: 1,
    catalogVersion: 1,
    app,
    appParams,
    bugs: [{ bug, params }],
  };
}

export function describeBugContract(bug: AnyBug, app: AnyMiniApp, runs = 200): void {
  describe(`Vertrag der Fehlerart ${bug.id}`, () => {
    it('gehört zur richtigen Mini-App', () => {
      expect(bug.miniAppId).toBe(app.id);
    });

    it('ersetzt nur den angegebenen Einfügepunkt', () => {
      const appParams = app.generateParams(new Rng('points'));
      const params = bug.generateParams(new Rng('points-bug'), appParams);
      const replaced = Object.keys(bug.inject(params, appParams, app.correctHooks));
      expect(replaced).toEqual([bug.injectionPoint]);
      expect(Object.keys(app.correctHooks)).toContain(bug.injectionPoint);
    });

    it(`löst den Fehler mit der Beispiel-Eingabe aus, aber nicht ohne den Fehler (${runs} Varianten)`, () => {
      for (let i = 0; i < runs; i++) {
        const appParams = app.generateParams(new Rng(`contract-app-${i}`));
        const params = bug.generateParams(new Rng(`contract-bug-${i}`), appParams);
        const exercise = singleBugExercise(app, appParams, bug, params);
        const trigger = bug.exampleTrigger(appParams, params);

        const withBug = runActual(exercise, trigger);
        const withoutBug = runExpected(exercise, trigger);
        expect(app.outputsDiffer(withBug, withoutBug), `Variante ${i}`).toBe(true);
        expect(checkProof(exercise, trigger).triggeredBugIds).toEqual([bug.id]);
      }
    });

    it(`verhält sich bei der Gegen-Eingabe korrekt (${runs} Varianten)`, () => {
      for (let i = 0; i < runs; i++) {
        const appParams = app.generateParams(new Rng(`contract-app-${i}`));
        const params = bug.generateParams(new Rng(`contract-bug-${i}`), appParams);
        const exercise = singleBugExercise(app, appParams, bug, params);
        const nonTrigger = bug.exampleNonTrigger(appParams, params);
        expect(checkProof(exercise, nonTrigger).programDiffers, `Variante ${i}`).toBe(false);
      }
    });

    it('hat Hinweise und eine vollständige Erklärung', () => {
      const appParams = app.generateParams(new Rng('texts'));
      const params = bug.generateParams(new Rng('texts-bug'), appParams);
      expect(bug.hints(appParams, params).length).toBeGreaterThanOrEqual(2);
      const e = bug.explain(appParams, params);
      for (const text of [e.title, e.why, e.buggyCode, e.fixedCode, e.howToFind, e.learned]) {
        expect(text.trim().length).toBeGreaterThan(0);
      }
      expect(e.syllabus.length).toBeGreaterThan(0);
    });
  });
}
