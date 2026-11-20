/**
 * Prüfung der Beweis-Eingabe (objektiv, Ja/Nein).
 *
 * Eine Eingabe beweist einen versteckten Fehler F, wenn beides gilt:
 * 1. Das Programm, das du testest, liefert ein anderes Ergebnis als das korrekte Programm.
 * 2. Wenn man NUR den Fehler F entfernt, ändert sich dieses Ergebnis.
 *    (Der sichtbare Unterschied hängt also wirklich mit F zusammen.)
 */
import type { Exercise, PlantedBug, RawInput } from '../types';

export function buildHooks(exercise: Exercise, planted: readonly PlantedBug[]): object {
  const correct = exercise.app.correctHooks as object;
  const hooks: Record<string, unknown> = { ...correct };
  for (const p of planted) {
    Object.assign(hooks, p.bug.inject(p.params, exercise.appParams, correct));
  }
  return hooks;
}

export function runWith(
  exercise: Exercise,
  input: RawInput,
  planted: readonly PlantedBug[],
): unknown {
  return exercise.app.run(input, exercise.appParams, buildHooks(exercise, planted));
}

/** Ergebnis des Programms mit allen versteckten Fehlern (das, was du siehst). */
export function runActual(exercise: Exercise, input: RawInput): unknown {
  return runWith(exercise, input, exercise.bugs);
}

/** Ergebnis des korrekten Programms (Testorakel, test oracle). */
export function runExpected(exercise: Exercise, input: RawInput): unknown {
  return runWith(exercise, input, []);
}

export interface ProofResult {
  /** Zeigt das getestete Programm mit dieser Eingabe ein falsches Ergebnis? */
  programDiffers: boolean;
  /** IDs der versteckten Fehler, die diese Eingabe beweist. */
  triggeredBugIds: string[];
  expected: unknown;
  actual: unknown;
}

export function checkProof(exercise: Exercise, input: RawInput): ProofResult {
  const { app } = exercise;
  const expected = runExpected(exercise, input);
  const actual = runActual(exercise, input);
  if (!app.outputsDiffer(expected, actual)) {
    return { programDiffers: false, triggeredBugIds: [], expected, actual };
  }
  const triggeredBugIds = exercise.bugs
    .filter((planted) => {
      const withoutThis = exercise.bugs.filter((p) => p !== planted);
      return app.outputsDiffer(actual, runWith(exercise, input, withoutThis));
    })
    .map((planted) => planted.bug.id);
  return { programDiffers: true, triggeredBugIds, expected, actual };
}
