import { hrefFor, PATHS } from '../app/router';

export function NotFoundPage() {
  return (
    <>
      <h1 tabIndex={-1}>Seite nicht gefunden</h1>
      <p>Diese Adresse gibt es in BugJagd nicht.</p>
      <p>
        <a href={hrefFor(PATHS.start)}>Zur Startseite</a>
      </p>
    </>
  );
}
