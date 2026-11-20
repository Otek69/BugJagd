import { categoryLabel, SEVERITY_LABELS } from '../../catalog/categories';
import { syllabusLabel } from '../../content/syllabus';
import { runActual, runExpected } from '../../core/grading/proof';
import { randomCode } from '../../core/random/code';
import type { Exercise, RawInput } from '../../core/types';
import { hrefFor, navigate, PATHS } from '../../app/router';
import { useProgress } from '../../features/progress/ProgressContext';
import {
  finishBonus,
  foundBugIds,
  paidHints,
  startExercise,
  XP_RULES,
} from '../../features/progress/progress-logic';
import type { ActiveExercise } from '../../features/progress/schema';
import { CATALOG } from '../../miniapps/registry';

function formatInput(exercise: Exercise, input: RawInput): string {
  return exercise.app.inputFields
    .map((f) => `${f.label} = ${input[f.key] ? `„${input[f.key]}“` : '(leer)'}`)
    .join(', ');
}

export function SolutionView({ exercise, active }: { exercise: Exercise; active: ActiveExercise }) {
  const { progress, setProgress } = useProgress();
  const found = new Set(foundBugIds(active));
  const attempt = [...progress.attempts]
    .reverse()
    .find((a) => a.code === active.code && a.startedAt === active.startedAt);
  const reportXp = active.reports.reduce((s, r) => s + r.xp, 0);

  function restart(code: string) {
    setProgress(
      startExercise(CATALOG, progress, { code, level: exercise.level }, new Date().toISOString()),
    );
    navigate(PATHS.exercise, { code, stufe: String(exercise.level) });
  }

  return (
    <>
      <section className="panel" aria-labelledby="summary-heading">
        <h2 id="summary-heading">Ergebnis</h2>
        <p data-testid="solution-summary">
          Gefunden: {found.size} von {exercise.bugs.length} Fehlern.
        </p>
        <p>
          Erfahrungspunkte für diese Übung: <strong>{attempt?.xp ?? 0}</strong> (Berichte {reportXp}{' '}
          + Bonus {finishBonus(active)} − Hinweise {paidHints(active) * XP_RULES.hintCost}).
        </p>
        <div className="button-row">
          <button type="button" className="button" onClick={() => restart(randomCode())}>
            Neue zufällige Übung (Stufe {exercise.level})
          </button>
          <button
            type="button"
            className="button button-secondary"
            onClick={() => restart(exercise.code)}
          >
            Diese Übung wiederholen
          </button>
          <a className="button button-secondary" href={hrefFor(PATHS.start)}>
            Zur Startseite
          </a>
        </div>
      </section>

      {exercise.bugs.map((planted, index) => {
        const e = planted.bug.explain(exercise.appParams, planted.params);
        const trigger = planted.bug.exampleTrigger(exercise.appParams, planted.params);
        const isFound = found.has(planted.bug.id);
        return (
          <article key={planted.bug.id} className="panel solution" aria-labelledby={`sol-${index}`}>
            <h2 id={`sol-${index}`}>
              Fehler {index + 1}: {e.title}
            </h2>
            <p className={isFound ? 'notice notice-success' : 'notice notice-warning'}>
              {isFound ? 'Von dir gefunden.' : 'Von dir übersehen.'}
            </p>
            <dl className="info-grid">
              <div>
                <dt>Kategorie</dt>
                <dd>{categoryLabel(planted.bug.category)}</dd>
              </div>
              <div>
                <dt>Referenz-Schweregrad</dt>
                <dd>
                  {SEVERITY_LABELS[planted.bug.severity].de} (
                  {SEVERITY_LABELS[planted.bug.severity].en})
                </dd>
              </div>
            </dl>
            <h3>Warum passiert der Fehler?</h3>
            <p>{e.why}</p>
            <div className="code-compare">
              <figure>
                <figcaption>Fehlerhafter Code (vereinfacht)</figcaption>
                <pre>
                  <code>{e.buggyCode}</code>
                </pre>
              </figure>
              <figure>
                <figcaption>Korrigierter Code</figcaption>
                <pre>
                  <code>{e.fixedCode}</code>
                </pre>
              </figure>
            </div>
            <h3>Eine Eingabe, die den Fehler zeigt</h3>
            <p>{formatInput(exercise, trigger)}</p>
            <dl className="compare">
              <dt>Korrektes Ergebnis</dt>
              <dd>{exercise.app.describeOutput(runExpected(exercise, trigger))}</dd>
              <dt>Ergebnis im Testobjekt</dt>
              <dd>{exercise.app.describeOutput(runActual(exercise, trigger))}</dd>
            </dl>
            <h3>So findest du ihn systematisch</h3>
            <p>{e.howToFind}</p>
            <h3>Was hast du gerade gelernt?</h3>
            <p>{e.learned}</p>
            <p className="field-help">Lehrplan: {e.syllabus.map(syllabusLabel).join(' · ')}</p>
          </article>
        );
      })}
    </>
  );
}
