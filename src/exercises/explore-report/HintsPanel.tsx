import { LEVEL_RULES } from '../../core/generator/generator';
import type { Exercise } from '../../core/types';
import { useProgress } from '../../features/progress/ProgressContext';
import { foundBugIds, revealHint, XP_RULES } from '../../features/progress/progress-logic';
import type { ActiveExercise } from '../../features/progress/schema';

export function HintsPanel({ exercise, active }: { exercise: Exercise; active: ActiveExercise }) {
  const { progress, setProgress } = useProgress();
  const mode = LEVEL_RULES[exercise.level].hints;
  const found = new Set(foundBugIds(active));

  if (mode === 'none') {
    return (
      <section className="panel" aria-labelledby="hints-heading">
        <h2 id="hints-heading">Hinweise</h2>
        <p>In Stufe 3 gibt es keine Hinweise.</p>
      </section>
    );
  }

  return (
    <section className="panel" aria-labelledby="hints-heading">
      <h2 id="hints-heading">Hinweise</h2>
      <p className="field-help">
        {mode === 'free'
          ? 'In Stufe 1 sind Hinweise kostenlos. Der erste Hinweis ist schon sichtbar.'
          : `In Stufe 2 kostet jeder Hinweis ${XP_RULES.hintCost} Erfahrungspunkte.`}
      </p>
      {exercise.bugs.map((planted, index) => {
        const hints = planted.bug.hints(exercise.appParams, planted.params);
        const shown = active.hintsShown[index] ?? 0;
        return (
          <div key={planted.bug.id} className="hint-group">
            <h3>
              Fehler {index + 1}
              {found.has(planted.bug.id) ? ' – gefunden' : ''}
            </h3>
            {shown > 0 ? (
              <ol>
                {hints.slice(0, shown).map((hint) => (
                  <li key={hint}>{hint}</li>
                ))}
              </ol>
            ) : (
              <p>Noch kein Hinweis angezeigt.</p>
            )}
            {shown < hints.length ? (
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setProgress(revealHint(progress, index, hints.length))}
              >
                Nächsten Hinweis zu Fehler {index + 1} anzeigen
                {mode === 'paid' ? ` (kostet ${XP_RULES.hintCost} Punkte)` : ''}
              </button>
            ) : (
              <p className="field-help">Alle Hinweise zu diesem Fehler sind sichtbar.</p>
            )}
          </div>
        );
      })}
    </section>
  );
}
