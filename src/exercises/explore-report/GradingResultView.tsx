import type { Ref } from 'react';
import type { GradingResult } from '../../core/grading/report-rules';
import type { Exercise } from '../../core/types';
import type { StoredReport } from '../../features/progress/schema';

interface Props {
  ref?: Ref<HTMLHeadingElement>;
  exercise: Exercise;
  grading: GradingResult;
  report: StoredReport;
}

export function GradingResultView({ ref, exercise, grading, report }: Props) {
  const { app } = exercise;
  let xpText: string;
  if (report.xp > 0)
    xpText = `+${report.xp} Erfahrungspunkte. Neu gefundene Fehler: ${report.creditedBugIds.length}.`;
  else if (report.triggeredBugIds.length > 0)
    xpText = '0 Erfahrungspunkte: Diesen Fehler hast du schon mit einem früheren Bericht bewiesen.';
  else xpText = '0 Erfahrungspunkte: Die Beweis-Eingabe zeigt keinen versteckten Fehler.';

  return (
    <div className="grading" data-testid="grading-result">
      <h3 ref={ref} tabIndex={-1}>
        Bewertung: {grading.score} von {grading.maxScore} Punkten
      </h3>
      <p>{xpText}</p>
      <table className="table">
        <thead>
          <tr>
            <th scope="col">Regel</th>
            <th scope="col">Ergebnis</th>
            <th scope="col">Punkte</th>
            <th scope="col">Rückmeldung</th>
          </tr>
        </thead>
        <tbody>
          {grading.rules.map((r) => (
            <tr key={r.id} data-rule={r.id} data-passed={r.passed}>
              <th scope="row">
                {r.id} {r.title}
              </th>
              <td className={r.passed ? 'result-pass' : 'result-fail'}>
                {r.passed ? '✓ erfüllt' : '✗ nicht erfüllt'}
              </td>
              <td>
                {r.points} / {r.maxPoints}
              </td>
              <td>{r.feedback}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h4>Vergleich für deine Beweis-Eingabe</h4>
      <dl className="compare">
        <dt>Korrektes Programm (Testorakel, Test Oracle)</dt>
        <dd>{app.describeOutput(grading.proof.expected)}</dd>
        <dt>Dein Testobjekt</dt>
        <dd>{app.describeOutput(grading.proof.actual)}</dd>
      </dl>
    </div>
  );
}
