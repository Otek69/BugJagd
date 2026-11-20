import { useEffect, useMemo } from 'react';
import { hrefFor, navigate, PATHS } from '../app/router';
import { parseCode } from '../core/random/code';
import type { Exercise, Level } from '../core/types';
import { ExerciseView } from '../exercises/explore-report/ExerciseView';
import { useProgress } from '../features/progress/ProgressContext';
import { exerciseFor, startExercise } from '../features/progress/progress-logic';
import type { ActiveExercise } from '../features/progress/schema';
import { CATALOG } from '../miniapps/registry';

type Requested = { ok: true; code: string; level: Level } | { ok: false; error: string } | null;

function readRequest(query: URLSearchParams): Requested {
  const codeText = query.get('code');
  if (codeText === null) return null;
  const parsed = parseCode(codeText);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  const levelText = query.get('stufe') ?? '1';
  if (!['1', '2', '3'].includes(levelText)) {
    return { ok: false, error: `Die Stufe „${levelText}“ gibt es nicht. Erlaubt sind 1, 2 und 3.` };
  }
  return { ok: true, code: parsed.code, level: Number(levelText) as Level };
}

function useExercise(active: ActiveExercise | null): {
  exercise: Exercise | null;
  error: string | null;
} {
  const code = active?.code;
  const level = active?.level;
  const catalogVersion = active?.catalogVersion;
  return useMemo(() => {
    if (!code || !level || !catalogVersion) return { exercise: null, error: null };
    try {
      return { exercise: exerciseFor(CATALOG, { code, level, catalogVersion }), error: null };
    } catch (e) {
      return { exercise: null, error: e instanceof Error ? e.message : String(e) };
    }
  }, [code, level, catalogVersion]);
}

export function ExercisePage({ query }: { query: URLSearchParams }) {
  const { progress, setProgress } = useProgress();
  const requested = readRequest(query);
  const active = progress.active;
  const matches = !!(
    requested?.ok &&
    active &&
    active.code === requested.code &&
    active.level === requested.level
  );
  const activeOpen = !!active && active.finishedAt === null;
  // Automatisch starten, wenn ein Link geöffnet wird und dabei keine offene Übung verloren geht.
  const autoStart = !!requested?.ok && !matches && !activeOpen;

  useEffect(() => {
    if (autoStart && requested?.ok) {
      setProgress(startExercise(CATALOG, progress, requested, new Date().toISOString()));
    }
  }, [autoStart, requested, progress, setProgress]);

  const { exercise, error } = useExercise(matches || !requested ? active : null);

  if (requested && !requested.ok) {
    return (
      <>
        <h1 tabIndex={-1}>Übung</h1>
        <p className="notice notice-error" role="alert">
          Der Link enthält einen Fehler: {requested.error}
        </p>
        <p>
          <a href={hrefFor(PATHS.start)}>Zur Startseite</a>
        </p>
      </>
    );
  }

  if (requested?.ok && !matches && activeOpen && active) {
    return (
      <>
        <h1 tabIndex={-1}>Übung wechseln?</h1>
        <section className="panel">
          <p>
            Du hast eine offene Übung: <code>{active.code}</code>, Stufe {active.level}.
          </p>
          <p>
            Der Link öffnet eine andere Übung: <code>{requested.code}</code>, Stufe{' '}
            {requested.level}.
          </p>
          <p>
            Wenn du wechselst, wird die offene Übung als „abgebrochen“ gespeichert. Die
            Erfahrungspunkte aus ihren Berichten bleiben erhalten.
          </p>
          <div className="button-row">
            <button
              type="button"
              className="button"
              onClick={() =>
                setProgress(startExercise(CATALOG, progress, requested, new Date().toISOString()))
              }
            >
              Ja, zur neuen Übung wechseln
            </button>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => navigate(PATHS.exercise)}
            >
              Nein, offene Übung behalten
            </button>
          </div>
        </section>
      </>
    );
  }

  if (error) {
    return (
      <>
        <h1 tabIndex={-1}>Übung</h1>
        <p className="notice notice-error" role="alert">
          Die Übung konnte nicht erzeugt werden: {error}
        </p>
      </>
    );
  }

  if (!active || !exercise || autoStart) {
    return (
      <>
        <h1 tabIndex={-1}>Übung</h1>
        <p>Im Moment ist keine Übung offen.</p>
        <p>
          <a className="button" href={hrefFor(PATHS.start)}>
            Auf der Startseite eine Übung starten
          </a>
        </p>
      </>
    );
  }

  return (
    <ExerciseView
      key={`${active.code}-${active.level}-${active.startedAt}`}
      exercise={exercise}
      active={active}
    />
  );
}
