import { useEffect, useRef, type ReactNode } from 'react';
import { useProgress } from '../features/progress/ProgressContext';
import { hrefFor, PATHS } from './router';

const NAV = [
  { path: PATHS.start, label: 'Start' },
  { path: PATHS.exercise, label: 'Übung' },
  { path: PATHS.progress, label: 'Fortschritt' },
  { path: PATHS.settings, label: 'Einstellungen' },
];

/** path kommt vom Eltern-Element. So sehen Kopfzeile und Seite immer dieselbe Adresse. */
export function Layout({ path, children }: { path: string; children: ReactNode }) {
  const { warning, dismissWarning } = useProgress();
  const firstRender = useRef(true);

  // Nach einem Seitenwechsel springt der Fokus auf die Überschrift.
  // So wissen auch Screenreader-Benutzer sofort, wo sie sind.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    document.querySelector<HTMLElement>('main h1')?.focus();
    window.scrollTo(0, 0);
  }, [path]);

  return (
    <div className="app">
      <a
        className="skip-link"
        href="#inhalt"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('inhalt')?.focus();
        }}
      >
        Zum Inhalt springen
      </a>
      <header className="app-header">
        <div className="app-header-inner">
          <span className="app-logo" aria-hidden="true">
            BugJagd
          </span>
          <nav aria-label="Hauptnavigation">
            <ul className="nav-list">
              {NAV.map((item) => (
                <li key={item.path}>
                  <a
                    href={hrefFor(item.path)}
                    aria-current={path === item.path ? 'page' : undefined}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
      {warning && (
        <div className="notice notice-warning app-warning" role="status">
          <p>{warning}</p>
          <button type="button" className="button button-secondary" onClick={dismissWarning}>
            Verstanden
          </button>
        </div>
      )}
      <main id="inhalt" tabIndex={-1}>
        {children}
      </main>
      <footer className="app-footer">
        <p>
          BugJagd {__APP_VERSION__} · Alle Daten bleiben in diesem Browser. Keine Anmeldung, kein
          Tracking. · <a href="https://github.com/Otek69/BugJagd">Quellcode auf GitHub</a>
        </p>
      </footer>
    </div>
  );
}
