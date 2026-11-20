import { useState, type FormEvent } from 'react';
import { exerciseHref, navigate, PATHS } from '../app/router';
import { dailyCode, parseCode, randomCode } from '../core/random/code';
import type { Level } from '../core/types';
import { useProgress } from '../features/progress/ProgressContext';
import { startExercise } from '../features/progress/progress-logic';
import { CATALOG } from '../miniapps/registry';
import { LevelPicker } from '../ui/LevelPicker';

export function StartPage() {
  const { progress, setProgress } = useProgress();
  const [level, setLevel] = useState<Level>(1);
  const [codeText, setCodeText] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const today = dailyCode(new Date());
  const open = progress.active && progress.active.finishedAt === null ? progress.active : null;

  function start(code: string) {
    setProgress(startExercise(CATALOG, progress, { code, level }, new Date().toISOString()));
    navigate(PATHS.exercise, { code, stufe: String(level) });
  }

  function onCodeSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = parseCode(codeText);
    if (!parsed.ok) {
      setCodeError(parsed.error);
      return;
    }
    setCodeError(null);
    start(parsed.code);
  }

  return (
    <>
      <h1 tabIndex={-1}>BugJagd – Softwaretesten üben</h1>
      <p className="lead">
        BugJagd erzeugt kleine Programme mit versteckten Fehlern. Du findest die Fehler, beweist sie
        mit einer konkreten Eingabe und schreibst einen Fehlerbericht (Bug Report). Danach erklärt
        die App, warum der Fehler passiert und mit welcher Testtechnik du ihn systematisch gefunden
        hättest.
      </p>

      {open && (
        <section className="panel" aria-labelledby="open-heading">
          <h2 id="open-heading">Offene Übung</h2>
          <p>
            Code <code>{open.code}</code>, Stufe {open.level}. Bisher {open.reports.length}{' '}
            Bericht(e).
          </p>
          <a className="button" href={exerciseHref(open.code, open.level)}>
            Offene Übung fortsetzen
          </a>
        </section>
      )}

      <section className="panel" aria-labelledby="start-heading">
        <h2 id="start-heading">Neue Übung starten</h2>
        <ol className="plain-steps">
          <li>Wähle eine Schwierigkeitsstufe.</li>
          <li>Wähle eine der drei Möglichkeiten darunter.</li>
        </ol>
        <LevelPicker value={level} onChange={setLevel} />

        <div className="start-options">
          <div className="start-option">
            <h3>Übung des Tages</h3>
            <p>
              Heute für alle gleich: <code>{today}</code>
            </p>
            <button type="button" className="button" onClick={() => start(today)}>
              Übung des Tages starten
            </button>
          </div>
          <div className="start-option">
            <h3>Zufällige Übung</h3>
            <p>Eine neue Übung, die es so noch nicht gab.</p>
            <button type="button" className="button" onClick={() => start(randomCode())}>
              Zufällige Übung starten
            </button>
          </div>
          <form className="start-option" onSubmit={onCodeSubmit} noValidate>
            <h3>Übungscode eingeben</h3>
            <div className="field">
              <label htmlFor="code-input">Übungscode</label>
              <input
                id="code-input"
                type="text"
                autoComplete="off"
                spellCheck={false}
                value={codeText}
                aria-invalid={codeError ? true : undefined}
                aria-describedby={`code-help${codeError ? ' code-error' : ''}`}
                onChange={(e) => setCodeText(e.target.value)}
              />
              <span className="field-help" id="code-help">
                Format: BUG-XXXX-XXXX
              </span>
              {codeError && (
                <span className="field-error" id="code-error">
                  {codeError}
                </span>
              )}
            </div>
            <button type="submit" className="button">
              Diesen Code starten
            </button>
          </form>
        </div>
        {open && (
          <p className="notice">
            Hinweis: Wenn du eine neue Übung startest, wird die offene Übung als „abgebrochen“
            gespeichert. Die Erfahrungspunkte aus ihren Berichten bleiben erhalten. In der Statistik
            zählt sie nicht.
          </p>
        )}
      </section>

      <section className="panel" aria-labelledby="how-heading">
        <h2 id="how-heading">So läuft eine Übung ab</h2>
        <ol>
          <li>
            Lies die Anforderungen (Testbasis, Test Basis). Sie sagen, wie das Programm richtig
            arbeitet.
          </li>
          <li>
            Bediene das Testobjekt (Test Object) und vergleiche das Ergebnis mit den Anforderungen.
          </li>
          <li>
            Wenn ein Ergebnis falsch ist: Schreibe einen Fehlerbericht. Gib die Beweis-Eingabe an,
            also die genaue Eingabe, die den Fehler zeigt.
          </li>
          <li>
            Die App prüft den Beweis automatisch und bewertet den Bericht mit 9 festen Regeln.
          </li>
          <li>Klicke „Übung beenden“. Dann siehst du alle versteckten Fehler mit Erklärung.</li>
        </ol>
      </section>
    </>
  );
}
