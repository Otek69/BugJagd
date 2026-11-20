import { useState } from 'react';
import { categoryLabel } from '../../catalog/categories';
import type { Exercise, RawInput } from '../../core/types';
import { foundBugIds } from '../../features/progress/progress-logic';
import type { ActiveExercise } from '../../features/progress/schema';
import { FinishPanel } from './FinishPanel';
import { HintsPanel } from './HintsPanel';
import { MiniAppPanel } from './MiniAppPanel';
import { ReportForm } from './ReportForm';
import { ReportList } from './ReportList';
import { RequirementsPanel } from './RequirementsPanel';
import { ShareLink } from './ShareLink';
import { SolutionView } from './SolutionView';

export function ExerciseView({ exercise, active }: { exercise: Exercise; active: ActiveExercise }) {
  const [input, setInput] = useState<RawInput>(() => exercise.app.emptyInput());
  const found = foundBugIds(active).length;
  const total = exercise.bugs.length;
  const finished = active.finishedAt !== null;

  return (
    <>
      <h1 tabIndex={-1}>
        Übung: {exercise.app.title} ({exercise.app.titleEn})
      </h1>

      <section className="panel exercise-info" aria-label="Angaben zur Übung">
        <dl className="info-grid">
          <div>
            <dt>Übungscode</dt>
            <dd>
              <code data-testid="exercise-code">{exercise.code}</code>
            </dd>
          </div>
          <div>
            <dt>Stufe</dt>
            <dd>{exercise.level}</dd>
          </div>
          <div>
            <dt>Versteckte Fehler</dt>
            <dd data-testid="bug-count">{total}</dd>
          </div>
          <div>
            <dt>Gefunden</dt>
            <dd data-testid="found-count">
              {found} von {total}
            </dd>
          </div>
          {exercise.level === 1 && (
            <div>
              <dt>Fehlerkategorie</dt>
              <dd>{exercise.bugs.map((b) => categoryLabel(b.bug.category)).join(', ')}</dd>
            </div>
          )}
        </dl>
        {!finished && (
          <p className="done-definition">
            <strong>Fertig ist die Übung, wenn:</strong> du für jeden versteckten Fehler einen
            Fehlerbericht mit gültiger Beweis-Eingabe abgeschickt hast und danach auf „Übung
            beenden“ klickst. Du kannst auch vorher beenden. Dann zählen nicht gefundene Fehler als
            „übersehen“.
          </p>
        )}
        <ShareLink code={exercise.code} level={exercise.level} />
      </section>

      {finished ? (
        <SolutionView exercise={exercise} active={active} />
      ) : (
        <>
          <div className="two-columns">
            <RequirementsPanel exercise={exercise} />
            <MiniAppPanel exercise={exercise} input={input} onInputChange={setInput} />
          </div>
          <HintsPanel exercise={exercise} active={active} />
          <ReportForm exercise={exercise} active={active} currentInput={input} />
          <ReportList exercise={exercise} active={active} />
          <FinishPanel exercise={exercise} active={active} />
        </>
      )}
    </>
  );
}
