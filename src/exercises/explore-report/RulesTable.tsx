import { RULE_DESCRIPTIONS, type RuleId } from '../../core/grading/report-rules';
import { XP_RULES } from '../../features/progress/progress-logic';

export function RulesTable() {
  return (
    <>
      <table className="table">
        <thead>
          <tr>
            <th scope="col">Regel</th>
            <th scope="col">Prüfung</th>
            <th scope="col">Punkte</th>
          </tr>
        </thead>
        <tbody>
          {(Object.keys(RULE_DESCRIPTIONS) as RuleId[]).map((id) => (
            <tr key={id}>
              <th scope="row">
                {id} {RULE_DESCRIPTIONS[id].title}
              </th>
              <td>{RULE_DESCRIPTIONS[id].text}</td>
              <td>{RULE_DESCRIPTIONS[id].maxPoints}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="field-help">
        Erfahrungspunkte: Ein Bericht, der einen noch nicht gefundenen Fehler beweist, bringt
        Berichtspunkte ÷ {XP_RULES.reportDivisor}. Beim Beenden gibt es{' '}
        {XP_RULES.bonusPerBugPerLevel} × Stufe Bonuspunkte pro gefundenem Fehler. Ehrlicher Hinweis:
        Die Regeln prüfen die Form des Berichts, nicht jede inhaltliche Feinheit.
      </p>
    </>
  );
}
