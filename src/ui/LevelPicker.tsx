import { LEVEL_RULES } from '../core/generator/generator';
import type { Level } from '../core/types';
import { LEVELS } from '../core/types';

export const LEVEL_TEXT: Record<Level, string> = {
  1: 'Genau 1 gut sichtbarer Fehler. Die Fehlerkategorie wird genannt. Hinweise sind kostenlos.',
  2: '1 oder 2 Fehler. Die Kategorie wird nicht genannt. Jeder Hinweis kostet 5 Erfahrungspunkte.',
  3: '2 oder 3 Fehler. Keine Hinweise.',
};

export function LevelPicker({
  value,
  onChange,
}: {
  value: Level;
  onChange: (level: Level) => void;
}) {
  return (
    <fieldset className="level-picker">
      <legend>Schwierigkeitsstufe</legend>
      {LEVELS.map((level) => (
        <label key={level} className="radio-card">
          <input
            type="radio"
            name="level"
            value={level}
            checked={value === level}
            onChange={() => onChange(level)}
          />
          <span>
            <strong>Stufe {level}</strong>
            <span className="radio-card-text">
              {LEVEL_TEXT[level]} (
              {LEVEL_RULES[level].minBugs === LEVEL_RULES[level].maxBugs
                ? LEVEL_RULES[level].minBugs
                : `${LEVEL_RULES[level].minBugs}–${LEVEL_RULES[level].maxBugs}`}{' '}
              Fehler)
            </span>
          </span>
        </label>
      ))}
    </fieldset>
  );
}
