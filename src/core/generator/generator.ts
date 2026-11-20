/**
 * Fehler-Generator: Baut aus Übungscode + Stufe + Katalog-Version eine Übung.
 * Gleiche Eingaben ergeben immer die gleiche Übung (deterministisch).
 */
import { Rng } from '../random/rng';
import type { AnyBug, AnyMiniApp, Exercise, Level, PlantedBug } from '../types';
import { checkProof } from '../grading/proof';

export interface Catalog {
  apps: readonly AnyMiniApp[];
  bugs: readonly AnyBug[];
}

export interface ExerciseRequest {
  code: string;
  level: Level;
  catalogVersion: number;
}

/** Regeln pro Stufe. */
export const LEVEL_RULES: Record<
  Level,
  { minBugs: number; maxBugs: number; maxObviousness: 1 | 2 | 3; hints: 'free' | 'paid' | 'none' }
> = {
  1: { minBugs: 1, maxBugs: 1, maxObviousness: 1, hints: 'free' },
  2: { minBugs: 1, maxBugs: 2, maxObviousness: 3, hints: 'paid' },
  3: { minBugs: 2, maxBugs: 3, maxObviousness: 3, hints: 'none' },
};

const MAX_ATTEMPTS = 50;

export function generateExercise(catalog: Catalog, request: ExerciseRequest): Exercise {
  const { code, level, catalogVersion } = request;
  const rng = new Rng(`${code}|level:${level}`);
  const rules = LEVEL_RULES[level];

  const apps = catalog.apps.filter((app) => app.since <= catalogVersion);
  if (apps.length === 0) throw new Error(`Keine Mini-App für Katalog-Version ${catalogVersion}.`);
  const app = rng.fork('app-choice').pick(apps);
  const appParams: unknown = app.generateParams(rng.fork(`app:${app.id}`));

  const pool = catalog.bugs.filter(
    (bug) =>
      bug.miniAppId === app.id &&
      bug.since <= catalogVersion &&
      bug.obviousness <= rules.maxObviousness,
  );
  if (pool.length === 0) throw new Error(`Keine Fehlerarten für ${app.id}.`);

  const wanted = Math.min(rng.fork('bug-count').int(rules.minBugs, rules.maxBugs), pool.length);
  const selection = rng.fork('bug-selection');

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const chosen = chooseBugs(selection.shuffle(pool), wanted);
    if (chosen.length < wanted) continue;
    const bugs: PlantedBug[] = chosen.map((bug) => ({
      bug,
      params: bug.generateParams(rng.fork(`bug:${bug.id}`), appParams),
    }));
    const exercise: Exercise = { code, level, catalogVersion, app, appParams, bugs };
    if (everyBugIsProvable(exercise)) return exercise;
  }
  throw new Error(`Für ${code} (Stufe ${level}) wurde keine gültige Fehler-Kombination gefunden.`);
}

/** Wählt Fehlerarten, die verschiedene Einfügepunkte ersetzen. */
function chooseBugs(shuffled: AnyBug[], wanted: number): AnyBug[] {
  const chosen: AnyBug[] = [];
  const usedPoints = new Set<string>();
  for (const bug of shuffled) {
    if (chosen.length === wanted) break;
    if (usedPoints.has(bug.injectionPoint)) continue;
    usedPoints.add(bug.injectionPoint);
    chosen.push(bug);
  }
  return chosen;
}

/**
 * Jeder versteckte Fehler muss mit seiner Beispiel-Eingabe im fertigen Programm
 * nachweisbar sein. Sonst wäre die Übung unfair.
 */
export function everyBugIsProvable(exercise: Exercise): boolean {
  return exercise.bugs.every((planted) => {
    const trigger = planted.bug.exampleTrigger(exercise.appParams, planted.params);
    return checkProof(exercise, trigger).triggeredBugIds.includes(planted.bug.id);
  });
}
