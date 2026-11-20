import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Progress } from './schema';
import { browserStore, loadProgress, saveProgress } from './storage';

interface ProgressApi {
  progress: Progress;
  /** Ersetzt den Fortschritt. Er wird sofort gespeichert. */
  setProgress: (next: Progress) => void;
  warning: string | null;
  dismissWarning: () => void;
}

const ProgressContext = createContext<ProgressApi | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(() => loadProgress(browserStore()));
  const [progress, setProgressState] = useState<Progress>(initial.progress);
  const [warning, setWarning] = useState<string | null>(initial.warning);

  useEffect(() => {
    saveProgress(browserStore(), progress);
  }, [progress]);

  // Einstellungen auf das <html>-Element anwenden (Design und Schriftgröße).
  useEffect(() => {
    const root = document.documentElement;
    if (progress.settings.theme === 'system') delete root.dataset.theme;
    else root.dataset.theme = progress.settings.theme;
    root.dataset.fontSize = progress.settings.fontSize;
  }, [progress.settings]);

  const setProgress = useCallback((next: Progress) => setProgressState(next), []);
  const dismissWarning = useCallback(() => setWarning(null), []);

  const api = useMemo(
    () => ({ progress, setProgress, warning, dismissWarning }),
    [progress, setProgress, warning, dismissWarning],
  );
  return <ProgressContext.Provider value={api}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressApi {
  const api = useContext(ProgressContext);
  if (!api) throw new Error('useProgress braucht einen ProgressProvider.');
  return api;
}
