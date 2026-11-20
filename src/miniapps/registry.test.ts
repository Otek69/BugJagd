import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CATEGORIES } from '../catalog/categories';
import { SYLLABUS } from '../content/syllabus';
import { CURRENT_CATALOG_VERSION } from '../core/generator/catalog-version';
import { Rng } from '../core/random/rng';
import { BUGS, MINI_APPS } from './registry';

const here = join(process.cwd(), 'src', 'miniapps');

describe('Katalog (Registry)', () => {
  it('findet die Mini-Apps und alle Fehlerarten automatisch', () => {
    expect(MINI_APPS.map((a) => a.id)).toContain('discount-calculator');
    expect(BUGS.length).toBeGreaterThanOrEqual(5);
  });

  it('IDs sind eindeutig', () => {
    const ids = BUGS.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('jede Fehlerart-Datei hat eine eigene Testdatei', () => {
    for (const app of MINI_APPS) {
      const dir = join(here, app.id, 'bugs');
      const files = readdirSync(dir).filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'));
      for (const file of files) {
        expect(
          existsSync(join(dir, file.replace(/\.ts$/, '.test.ts'))),
          `${file} braucht einen Test`,
        ).toBe(true);
      }
    }
  });

  it('jede Fehlerart gehört zu einer vorhandenen Mini-App und einer bekannten Kategorie', () => {
    for (const bug of BUGS) {
      expect(MINI_APPS.some((a) => a.id === bug.miniAppId)).toBe(true);
      expect(CATEGORIES[bug.category]).toBeDefined();
      expect(bug.since).toBeLessThanOrEqual(CURRENT_CATALOG_VERSION);
    }
  });

  it('jede Erklärung verweist auf ein bekanntes Lehrplan-Kapitel', () => {
    for (const bug of BUGS) {
      const app = MINI_APPS.find((a) => a.id === bug.miniAppId);
      if (!app) throw new Error('Mini-App fehlt');
      const appParams = app.generateParams(new Rng('syllabus'));
      const explanation = bug.explain(appParams, bug.generateParams(new Rng('s'), appParams));
      for (const section of explanation.syllabus) expect(SYLLABUS[section], section).toBeDefined();
    }
  });

  it('jede Mini-App hat Stufe-1-Fehlerarten (für Anfänger)', () => {
    for (const app of MINI_APPS) {
      expect(BUGS.some((b) => b.miniAppId === app.id && b.obviousness === 1)).toBe(true);
    }
  });
});
