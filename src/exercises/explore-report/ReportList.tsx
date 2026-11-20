import type { Exercise } from '../../core/types';
import type { ActiveExercise } from '../../features/progress/schema';

export function ReportList({ exercise, active }: { exercise: Exercise; active: ActiveExercise }) {
  return (
    <section className="panel" aria-labelledby="reports-heading">
      <h2 id="reports-heading">Deine Berichte in dieser Übung</h2>
      {active.reports.length === 0 ? (
        <p>Noch keine Berichte.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Nr.</th>
              <th scope="col">Titel</th>
              <th scope="col">Punkte</th>
              <th scope="col">Beweis</th>
              <th scope="col">Erfahrungspunkte</th>
            </tr>
          </thead>
          <tbody>
            {active.reports.map((r, i) => (
              <tr key={r.id}>
                <td>{i + 1}</td>
                <td>{r.title || '(ohne Titel)'}</td>
                <td>{r.score} / 100</td>
                <td>
                  {r.triggeredBugIds.length > 0
                    ? `gültig (${r.creditedBugIds.length > 0 ? 'neuer Fehler' : 'schon gefunden'})`
                    : 'kein Fehler ausgelöst'}
                </td>
                <td>{r.xp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="field-help">Übung: {exercise.code}</p>
    </section>
  );
}
