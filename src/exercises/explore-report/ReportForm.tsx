import { useRef, useState, type FormEvent } from 'react';
import { PRIORITY_LABELS, SEVERITY_LABELS } from '../../catalog/categories';
import { term } from '../../content/terms';
import {
  splitSteps,
  type BugReportDraft,
  type GradingResult,
} from '../../core/grading/report-rules';
import type { Exercise, Priority, RawInput, Severity } from '../../core/types';
import { PRIORITIES, SEVERITIES } from '../../core/types';
import { useProgress } from '../../features/progress/ProgressContext';
import { submitReport } from '../../features/progress/progress-logic';
import type { ActiveExercise, StoredReport } from '../../features/progress/schema';
import { defaultEnvironment } from './environment';
import { GradingResultView } from './GradingResultView';
import { RulesTable } from './RulesTable';

interface Props {
  exercise: Exercise;
  active: ActiveExercise;
  currentInput: RawInput;
}

interface FormState {
  title: string;
  steps: string;
  expected: string;
  actual: string;
  severity: Severity | '';
  priority: Priority | '';
  environment: string;
  proofInput: RawInput;
}

function emptyForm(exercise: Exercise): FormState {
  return {
    title: '',
    steps: '',
    expected: '',
    actual: '',
    severity: '',
    priority: '',
    environment: defaultEnvironment(exercise.code, exercise.level),
    proofInput: exercise.app.emptyInput(),
  };
}

export function ReportForm({ exercise, active, currentInput }: Props) {
  const { progress, setProgress } = useProgress();
  const [form, setForm] = useState<FormState>(() => emptyForm(exercise));
  const [result, setResult] = useState<{ grading: GradingResult; report: StoredReport } | null>(
    null,
  );
  const resultHeading = useRef<HTMLHeadingElement>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const draft: BugReportDraft = { ...form, steps: splitSteps(form.steps) };
    const id = `r${active.reports.length + 1}-${Date.now()}`;
    const outcome = submitReport(progress, exercise, draft, new Date().toISOString(), id);
    setProgress(outcome.progress);
    setResult({ grading: outcome.grading, report: outcome.report });
    // Fokus auf das Ergebnis: Es steht immer direkt unter dem Formular.
    requestAnimationFrame(() => resultHeading.current?.focus());
  }

  function startNew() {
    setForm(emptyForm(exercise));
    setResult(null);
    document.getElementById('report-title')?.focus();
  }

  return (
    <section className="panel" aria-labelledby="report-heading">
      <h2 id="report-heading">{term('bugReport')} schreiben</h2>
      <p className="field-help">
        Schreibe einen Bericht pro Fehler. Alle Felder stehen untereinander. Nach dem Abschicken
        erscheint die Bewertung direkt unter dem Formular.
      </p>
      <details className="rules-details">
        <summary>So wird bewertet (9 feste Regeln, 100 Punkte)</summary>
        <RulesTable />
      </details>

      <form className="report-form" onSubmit={onSubmit} noValidate>
        <fieldset>
          <legend>{term('proofInput')}</legend>
          <p className="field-help">
            Die genaue Eingabe, mit der man den Fehler im Testobjekt sieht. Die App prüft damit
            automatisch, ob der Fehler wirklich existiert.
          </p>
          <div className="proof-fields">
            {exercise.app.inputFields.map((field) => (
              <div className="field" key={field.key}>
                <label htmlFor={`proof-${field.key}`}>{field.label}</label>
                <input
                  id={`proof-${field.key}`}
                  type="text"
                  autoComplete="off"
                  value={form.proofInput[field.key] ?? ''}
                  onChange={(e) =>
                    set('proofInput', { ...form.proofInput, [field.key]: e.target.value })
                  }
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            className="button button-secondary"
            onClick={() => set('proofInput', { ...currentInput })}
          >
            Aktuelle Eingabe aus dem Testobjekt übernehmen
          </button>
        </fieldset>

        <div className="field">
          <label htmlFor="report-title">Titel (Title)</label>
          <input
            id="report-title"
            type="text"
            value={form.title}
            aria-describedby="report-title-help"
            onChange={(e) => set('title', e.target.value)}
          />
          <span className="field-help" id="report-title-help">
            Kurz und genau: Was ist falsch, und wo? Beispiel: „Kein Mengenrabatt bei genau 10
            Stück“.
          </span>
        </div>

        <div className="field">
          <label htmlFor="report-steps">{term('stepsToReproduce')}</label>
          <textarea
            id="report-steps"
            rows={5}
            value={form.steps}
            aria-describedby="report-steps-help"
            onChange={(e) => set('steps', e.target.value)}
          />
          <span className="field-help" id="report-steps-help">
            Ein Schritt pro Zeile. Nenne die genauen Werte. Beispiel: „1. Einzelpreis 10 eingeben“.
          </span>
        </div>

        <div className="field">
          <label htmlFor="report-expected">{term('expectedResult')}</label>
          <textarea
            id="report-expected"
            rows={2}
            value={form.expected}
            aria-describedby="report-expected-help"
            onChange={(e) => set('expected', e.target.value)}
          />
          <span className="field-help" id="report-expected-help">
            Was laut Anforderungen passieren soll. Mit Wert oder Anforderungsnummer, z. B. „Endpreis
            95,00 € (A3)“.
          </span>
        </div>

        <div className="field">
          <label htmlFor="report-actual">{term('actualResult')}</label>
          <textarea
            id="report-actual"
            rows={2}
            value={form.actual}
            aria-describedby="report-actual-help"
            onChange={(e) => set('actual', e.target.value)}
          />
          <span className="field-help" id="report-actual-help">
            Nur das, was wirklich angezeigt wurde. Nicht „sollte“ schreiben.
          </span>
        </div>

        <div className="two-fields">
          <fieldset>
            <legend>{term('severity')}</legend>
            <p className="field-help">Wie stark wirkt der Fehler?</p>
            {SEVERITIES.map((s) => (
              <label key={s} className="radio-line">
                <input
                  type="radio"
                  name="severity"
                  value={s}
                  checked={form.severity === s}
                  onChange={() => set('severity', s)}
                />
                <span>
                  <strong>
                    {SEVERITY_LABELS[s].de} ({SEVERITY_LABELS[s].en})
                  </strong>
                  : {SEVERITY_LABELS[s].help}
                </span>
              </label>
            ))}
          </fieldset>
          <fieldset>
            <legend>{term('priority')}</legend>
            <p className="field-help">
              Wie dringend soll er behoben werden? Das ist eine andere Frage als der Schweregrad.
            </p>
            {PRIORITIES.map((p) => (
              <label key={p} className="radio-line">
                <input
                  type="radio"
                  name="priority"
                  value={p}
                  checked={form.priority === p}
                  onChange={() => set('priority', p)}
                />
                <span>
                  <strong>
                    {PRIORITY_LABELS[p].de} ({PRIORITY_LABELS[p].en})
                  </strong>
                  : {PRIORITY_LABELS[p].help}
                </span>
              </label>
            ))}
          </fieldset>
        </div>

        <div className="field">
          <label htmlFor="report-environment">{term('environment')}</label>
          <input
            id="report-environment"
            type="text"
            value={form.environment}
            aria-describedby="report-environment-help"
            onChange={(e) => set('environment', e.target.value)}
          />
          <span className="field-help" id="report-environment-help">
            Ist schon ausgefüllt: App-Version, Browser und Übung. Du kannst es ändern.
          </span>
        </div>

        <div className="button-row">
          <button type="submit" className="button">
            Fehlerbericht abschicken
          </button>
          <button type="button" className="button button-secondary" onClick={startNew}>
            Formular leeren (neuer Bericht)
          </button>
        </div>
      </form>

      <div className="grading-area">
        {result ? (
          <GradingResultView
            ref={resultHeading}
            exercise={exercise}
            grading={result.grading}
            report={result.report}
          />
        ) : (
          <p className="field-help">
            Hier erscheint die Bewertung, sobald du einen Bericht abschickst.
          </p>
        )}
      </div>
    </section>
  );
}
