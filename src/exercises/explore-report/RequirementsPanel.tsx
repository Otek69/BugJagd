import type { Exercise } from '../../core/types';

export function RequirementsPanel({ exercise }: { exercise: Exercise }) {
  const requirements = exercise.app.requirements(exercise.appParams);
  return (
    <section className="panel" aria-labelledby="req-heading">
      <h2 id="req-heading">Anforderungen (Testbasis, Test Basis)</h2>
      <p className="field-help">
        So soll das Programm richtig arbeiten. Vergleiche jedes Ergebnis damit.
      </p>
      <dl className="requirements">
        {requirements.map((r) => (
          <div key={r.id} className="requirement">
            <dt>
              {r.id} – {r.title}
            </dt>
            <dd>{r.text}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
