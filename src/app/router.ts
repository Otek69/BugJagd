/**
 * Sehr kleiner Hash-Router. Adressen sehen so aus: …/#/uebung?code=BUG-7F3A-K9Q2&stufe=2
 * Hash-Adressen funktionieren auf GitHub Pages auch beim Neuladen.
 */
import { useSyncExternalStore } from 'react';

export interface Route {
  path: string;
  query: URLSearchParams;
}

export const PATHS = {
  start: '/',
  exercise: '/uebung',
  progress: '/fortschritt',
  settings: '/einstellungen',
} as const;

export function parseHash(hash: string): Route {
  const text = hash.replace(/^#/, '');
  const [path = '', query = ''] = text.split('?');
  return { path: path === '' ? '/' : path, query: new URLSearchParams(query) };
}

export function hrefFor(path: string, query?: Record<string, string>): string {
  const q = query ? new URLSearchParams(query).toString() : '';
  return `#${path}${q ? `?${q}` : ''}`;
}

export function navigate(path: string, query?: Record<string, string>): void {
  window.location.hash = hrefFor(path, query);
}

function subscribe(callback: () => void): () => void {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
}

export function useRoute(): Route {
  const hash = useSyncExternalStore(
    subscribe,
    () => window.location.hash,
    () => '',
  );
  return parseHash(hash);
}

export function exerciseHref(code: string, level: number): string {
  return hrefFor(PATHS.exercise, { code, stufe: String(level) });
}

/** Vollständiger Link zum Teilen einer Übung. */
export function exerciseShareUrl(code: string, level: number): string {
  const base = window.location.href.split('#')[0] ?? '';
  return `${base}${exerciseHref(code, level)}`;
}
