import { useRef, useState, type ChangeEvent } from 'react';
import { exerciseHref } from '../app/router';
import { CATEGORIES } from '../catalog/categories';
import type { BugCategory } from '../core/types';
import { useProgress } from '../features/progress/ProgressContext';
import { categoryStats, rankOf, totalXp } from '../features/progress/progress-logic';
import { parseProgressJson, type Progress } from '../features/progress/schema';
import { exportFileName, serializeProgress } from '../features/progress/storage';
import { findMiniApp } from '../miniapps/registry';

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('de-AT', { dateStyle: 'medium', timeStyle: 'short' });
}

export function ProgressPage() {
  const { progress, setProgress } = useProgress();
  const xp = totalXp(progress);
  const rank = rankOf(xp);
  const stats = categoryStats(progress);
  const [pending, setPending] = useState<Progress | null>(null);
  const [importMessage, setImportMessage] = useState<{
    kind: 'error' | 'success';
    text: string;
  } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  function exportProgress() {
    const blob = new Blob([serializeProgress(progress)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = exportFileName(new Date());
    link.click();
    URL.revokeObjectURL(url);
  }

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const result = parseProgressJson(await file.text());
    if (result.ok) {
      setPending(result.progress);
      setImportMessage(null);
    } else {
      setPending(null);
      setImportMessage({
        kind: 'error',
        text: `Import nicht möglich. ${result.error} Dein Fortschritt wurde nicht verändert.`,
      });
    }
    event.target.value = '';
  }

  function confirmImport() {
    if (!pending) return;
    setProgress(pending);
    setPending(null);
    setImportMessage({ kind: 'success', text: 'Der Fortschritt wurde importiert.' });
  }

  return (
    <>
      <h1 tabIndex={-1}>Fortschritt</h1>

      <section className="panel" aria-labelledby="xp-heading">
        <h2 id="xp-heading">Erfahrungspunkte (XP)</h2>
        <p className="big-number" data-testid="total-xp">
          {xp} XP
        </p>
        <p>
          Rang {rank.rank}. Noch {rank.xpForNext - rank.xpInRank} XP bis Rang {rank.rank + 1}.
        </p>
        <label htmlFor="rank-progress">Fortschritt bis zum nächsten Rang</label>
        <progress id="rank-progress" max={rank.xpForNext} value={rank.xpInRank}>
          {rank.xpInRank} von {rank.xpForNext}
        </progress>
      </section>

      <section className="panel" aria-labelledby="stats-heading">
        <h2 id="stats-heading">Statistik nach Fehlerkategorie</h2>
        <p className="field-help">
          Es zählen nur beendete Übungen. Abgebrochene Übungen zählen nicht.
        </p>
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Kategorie</th>
              <th scope="col">Gefunden</th>
              <th scope="col">Übersehen</th>
              <th scope="col">Quote</th>
            </tr>
          </thead>
          <tbody>
            {(Object.keys(CATEGORIES) as BugCategory[]).map((id) => {
              const c = CATEGORIES[id];
              const s = stats[id];
              const all = s ? s.found + s.missed : 0;
              return (
                <tr key={id}>
                  <th scope="row">
                    {c.de} ({c.en})
                  </th>
                  {c.availableFrom === 'später' ? (
                    <td colSpan={3}>Kommt in einer späteren Version.</td>
                  ) : (
                    <>
                      <td>{s?.found ?? 0}</td>
                      <td>{s?.missed ?? 0}</td>
                      <td>{all > 0 ? `${Math.round(((s?.found ?? 0) / all) * 100)} %` : '–'}</td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="panel" aria-labelledby="attempts-heading">
        <h2 id="attempts-heading">Bisherige Übungen</h2>
        {progress.attempts.length === 0 ? (
          <p>Noch keine Übung beendet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Ende</th>
                <th scope="col">Code</th>
                <th scope="col">Mini-App</th>
                <th scope="col">Stufe</th>
                <th scope="col">Status</th>
                <th scope="col">Gefunden</th>
                <th scope="col">XP</th>
              </tr>
            </thead>
            <tbody>
              {[...progress.attempts].reverse().map((a) => (
                <tr key={`${a.code}-${a.startedAt}`}>
                  <td>{formatDate(a.endedAt)}</td>
                  <td>
                    <a href={exerciseHref(a.code, a.level)}>{a.code}</a>
                  </td>
                  <td>{findMiniApp(a.miniAppId)?.title ?? a.miniAppId}</td>
                  <td>{a.level}</td>
                  <td>{a.status === 'finished' ? 'beendet' : 'abgebrochen'}</td>
                  <td>
                    {a.bugs.filter((b) => b.found).length} von {a.bugs.length}
                  </td>
                  <td>{a.xp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="panel" aria-labelledby="backup-heading">
        <h2 id="backup-heading">Sichern und Übertragen</h2>
        <p>
          Dein Fortschritt ist nur in diesem Browser gespeichert. Mit „Exportieren“ bekommst du eine
          JSON-Datei. Mit „Importieren“ lädst du sie wieder, zum Beispiel auf einem anderen
          Computer.
        </p>
        <div className="button-row">
          <button type="button" className="button" onClick={exportProgress}>
            Fortschritt exportieren
          </button>
          <button
            type="button"
            className="button button-secondary"
            onClick={() => fileInput.current?.click()}
          >
            Fortschritt importieren
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="visually-hidden"
            aria-label="Fortschrittsdatei auswählen"
            data-testid="import-file"
            onChange={onFile}
          />
        </div>
        {pending && (
          <div className="confirm-box" data-testid="import-confirm">
            <p>
              <strong>Die Datei ist gültig.</strong> Sie enthält {totalXp(pending)} XP und{' '}
              {pending.attempts.length} Übung(en). Der Import <strong>ersetzt</strong> deinen
              aktuellen Fortschritt ({xp} XP).
            </p>
            <div className="button-row">
              <button type="button" className="button" onClick={confirmImport}>
                Ja, importieren und ersetzen
              </button>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setPending(null)}
              >
                Abbrechen
              </button>
            </div>
          </div>
        )}
        {importMessage && (
          <p
            className={`notice ${importMessage.kind === 'error' ? 'notice-error' : 'notice-success'}`}
            role="status"
          >
            {importMessage.text}
          </p>
        )}
      </section>
    </>
  );
}
