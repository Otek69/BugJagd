import { ProgressProvider } from '../features/progress/ProgressContext';
import { ExercisePage } from '../pages/ExercisePage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { ProgressPage } from '../pages/ProgressPage';
import { SettingsPage } from '../pages/SettingsPage';
import { StartPage } from '../pages/StartPage';
import { Layout } from './Layout';
import { PATHS, useRoute, type Route } from './router';

function CurrentPage({ route }: { route: Route }) {
  switch (route.path) {
    case PATHS.start:
      return <StartPage />;
    case PATHS.exercise:
      return <ExercisePage query={route.query} />;
    case PATHS.progress:
      return <ProgressPage />;
    case PATHS.settings:
      return <SettingsPage />;
    default:
      return <NotFoundPage />;
  }
}

/** Liest die Adresse an genau einer Stelle und gibt sie an Kopfzeile und Seite weiter. */
function Shell() {
  const route = useRoute();
  return (
    <Layout path={route.path}>
      <CurrentPage route={route} />
    </Layout>
  );
}

export function App() {
  return (
    <ProgressProvider>
      <Shell />
    </ProgressProvider>
  );
}
