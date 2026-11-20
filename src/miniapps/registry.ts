/**
 * Findet alle Mini-Apps und Fehlerarten automatisch.
 *
 * Neue Mini-App:  Ordner src/miniapps/<id>/ mit index.ts (export default).
 * Neue Fehlerart: Datei src/miniapps/<id>/bugs/<name>.ts (export default).
 * Hier muss nichts geändert werden.
 */
import type { AnyBug, AnyMiniApp } from '../core/types';
import type { Catalog } from '../core/generator/generator';

const appModules = import.meta.glob<{ default: AnyMiniApp }>('./*/index.ts', { eager: true });
const bugModules = import.meta.glob<{ default: AnyBug }>(['./*/bugs/*.ts', '!./*/bugs/*.test.ts'], {
  eager: true,
});

function byId<T extends { id: string }>(a: T, b: T): number {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

export const MINI_APPS: readonly AnyMiniApp[] = Object.values(appModules)
  .map((m) => m.default)
  .sort(byId);

export const BUGS: readonly AnyBug[] = Object.values(bugModules)
  .map((m) => m.default)
  .sort(byId);

export const CATALOG: Catalog = { apps: MINI_APPS, bugs: BUGS };

export function findMiniApp(id: string): AnyMiniApp | undefined {
  return MINI_APPS.find((app) => app.id === id);
}
