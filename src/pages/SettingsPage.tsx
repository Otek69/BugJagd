import { useState } from 'react';
import { useProgress } from '../features/progress/ProgressContext';
import { defaultProgress, type Settings } from '../features/progress/schema';

const THEMES: { value: Settings['theme']; label: string }[] = [
  { value: 'system', label: 'Wie das Betriebssystem' },
  { value: 'light', label: 'Hell' },
  { value: 'dark', label: 'Dunkel' },
];

const FONT_SIZES: { value: Settings['fontSize']; label: string }[] = [
  { value: 'normal', label: 'Normal (100 %)' },
  { value: 'large', label: 'Groß (115 %)' },
  { value: 'larger', label: 'Größer (130 %)' },
  { value: 'largest', label: 'Am größten (150 %)' },
];

export function SettingsPage() {
  const { progress, setProgress } = useProgress();
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const settings = progress.settings;

  function change(next: Partial<Settings>) {
    setProgress({ ...progress, settings: { ...settings, ...next } });
  }

  function reset() {
    setProgress({ ...defaultProgress(), settings });
    setConfirmReset(false);
    setResetDone(true);
  }

  return (
    <>
      <h1 tabIndex={-1}>Einstellungen</h1>
      <p>Änderungen gelten sofort und werden automatisch gespeichert.</p>

      <section className="panel">
        <fieldset>
          <legend>Design</legend>
          {THEMES.map((t) => (
            <label key={t.value} className="radio-line">
              <input
                type="radio"
                name="theme"
                value={t.value}
                checked={settings.theme === t.value}
                onChange={() => change({ theme: t.value })}
              />
              <span>{t.label}</span>
            </label>
          ))}
        </fieldset>
      </section>

      <section className="panel">
        <fieldset>
          <legend>Schriftgröße</legend>
          {FONT_SIZES.map((f) => (
            <label key={f.value} className="radio-line">
              <input
                type="radio"
                name="font-size"
                value={f.value}
                checked={settings.fontSize === f.value}
                onChange={() => change({ fontSize: f.value })}
              />
              <span>{f.label}</span>
            </label>
          ))}
        </fieldset>
      </section>

      <section className="panel" aria-labelledby="calm-heading">
        <h2 id="calm-heading">Ruhige Oberfläche</h2>
        <ul>
          <li>Bewegung: BugJagd hat keine Animationen und keine Übergangseffekte.</li>
          <li>Geräusche: BugJagd spielt keine Geräusche ab.</li>
          <li>Zeitlimits und Serien (Streaks): gibt es nicht.</li>
          <li>Pop-up-Fenster: gibt es nicht. Rückfragen erscheinen direkt auf der Seite.</li>
        </ul>
      </section>

      <section className="panel" aria-labelledby="reset-heading">
        <h2 id="reset-heading">Fortschritt löschen</h2>
        <p>
          Löscht alle Übungen und Erfahrungspunkte in diesem Browser. Die Einstellungen bleiben.
          Tipp: Exportiere vorher deinen Fortschritt.
        </p>
        {!confirmReset ? (
          <button
            type="button"
            className="button button-danger"
            onClick={() => {
              setConfirmReset(true);
              setResetDone(false);
            }}
          >
            Fortschritt löschen …
          </button>
        ) : (
          <div className="confirm-box">
            <p>
              <strong>Wirklich alles löschen?</strong> Das kann man nicht rückgängig machen.
            </p>
            <div className="button-row">
              <button type="button" className="button button-danger" onClick={reset}>
                Ja, alles löschen
              </button>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setConfirmReset(false)}
              >
                Nein, abbrechen
              </button>
            </div>
          </div>
        )}
        {resetDone && (
          <p className="notice notice-success" role="status">
            Der Fortschritt wurde gelöscht.
          </p>
        )}
      </section>
    </>
  );
}
