import { useState } from 'react';
import type { Exercise } from '../../core/types';
import { useProgress } from '../../features/progress/ProgressContext';
import { finishExercise, foundBugIds } from '../../features/progress/progress-logic';
import type { ActiveExercise } from '../../features/progress/schema';

export function FinishPanel({ exercise, active }: { exercise: Exercise; active: ActiveExercise }) {
  const { progress, setProgress } = useProgress();
  const [confirming, setConfirming] = useState(false);
  const found = foundBugIds(active).length;
  const total = exercise.bugs.length;
  const missing = total - found;

  return (
    <section className="panel" aria-labelledby="finish-heading">
      <h2 id="finish-heading">Übung beenden</h2>
      {missing === 0 ? (
        <p className="notice notice-success">
          Du hast alle {total} Fehler gefunden. Klicke jetzt auf „Übung beenden“, um die Lösung und
          die Erklärungen zu sehen.
        </p>
      ) : (
        <p>
          Gefunden: {found} von {total}. Wenn du jetzt beendest, zählen {missing} Fehler als
          übersehen.
        </p>
      )}
      {!confirming ? (
        <button type="button" className="button" onClick={() => setConfirming(true)}>
          Übung beenden
        </button>
      ) : (
        <div className="confirm-box">
          <p>
            <strong>Wirklich beenden?</strong> Danach siehst du die Lösung. Du kannst dann keine
            Berichte mehr zu dieser Übung schreiben.
          </p>
          <div className="button-row">
            <button
              type="button"
              className="button"
              onClick={() =>
                setProgress(finishExercise(progress, exercise, new Date().toISOString()))
              }
            >
              Ja, beenden und Lösung zeigen
            </button>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => setConfirming(false)}
            >
              Nein, weiter testen
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
