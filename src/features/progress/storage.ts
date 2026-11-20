/**
 * Speichern im Browser (localStorage).
 * Alles bleibt auf diesem Computer. Nichts wird an einen Server geschickt.
 */
import { defaultProgress, parseProgress, type Progress } from './schema';

export const STORAGE_KEY = 'bugjagd.progress';
export const BROKEN_KEY = 'bugjagd.progress.broken';

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface LoadResult {
  progress: Progress;
  /** Gesetzt, wenn gespeicherte Daten unlesbar waren. Sie wurden unter BROKEN_KEY gesichert. */
  warning: string | null;
}

export function loadProgress(store: KeyValueStore | null): LoadResult {
  if (!store) {
    return {
      progress: defaultProgress(),
      warning: 'Der Browser erlaubt kein Speichern. Der Fortschritt geht beim Schließen verloren.',
    };
  }
  let text: string | null;
  try {
    text = store.getItem(STORAGE_KEY);
  } catch {
    return {
      progress: defaultProgress(),
      warning: 'Der Browser erlaubt kein Speichern. Der Fortschritt geht beim Schließen verloren.',
    };
  }
  if (text === null) return { progress: defaultProgress(), warning: null };
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    data = undefined;
  }
  const parsed = parseProgress(data);
  if (parsed.ok) return { progress: parsed.progress, warning: null };
  try {
    store.setItem(BROKEN_KEY, text);
  } catch {
    // nichts weiter möglich
  }
  return {
    progress: defaultProgress(),
    warning:
      'Der gespeicherte Fortschritt war beschädigt. Er wurde gesichert und durch einen leeren Fortschritt ersetzt.',
  };
}

export function saveProgress(store: KeyValueStore | null, progress: Progress): boolean {
  if (!store) return false;
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}

export function browserStore(): KeyValueStore | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function exportFileName(date: Date): string {
  const iso = date.toISOString().slice(0, 10);
  return `bugjagd-fortschritt-${iso}.json`;
}

export function serializeProgress(progress: Progress): string {
  return JSON.stringify(progress, null, 2);
}
