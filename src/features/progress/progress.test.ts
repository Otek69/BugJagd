import { describe, expect, it } from 'vitest';
import { CATALOG } from '../../miniapps/registry';
import type { BugReportDraft } from '../../core/grading/report-rules';
import {
  categoryStats,
  exerciseFor,
  finishExercise,
  foundBugIds,
  rankOf,
  revealHint,
  startExercise,
  submitReport,
  totalXp,
} from './progress-logic';
import { defaultProgress, parseProgressJson, type Progress } from './schema';
import {
  BROKEN_KEY,
  loadProgress,
  saveProgress,
  serializeProgress,
  STORAGE_KEY,
  type KeyValueStore,
} from './storage';

const NOW = '2026-11-20T10:00:00.000Z';
// BUG-7F3A-K9Q2, Stufe 1: Grenzwertfehler, zweite Stufe ab 15 Stück, Variante "late".
const CODE = 'BUG-7F3A-K9Q2';

function memoryStore(): KeyValueStore & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
}

function draft(proof: Record<string, string>): BugReportDraft {
  return {
    title: 'Mengenrabatt fehlt bei genau 15 Stück',
    steps: [
      `Einzelpreis ${proof.price} eingeben`,
      `Menge ${proof.quantity} eingeben`,
      'Auf Preis berechnen klicken',
    ],
    expected: 'Mengenrabatt 11 % laut A3',
    actual: 'Mengenrabatt 7 %',
    severity: 'medium',
    priority: 'medium',
    environment: 'Test',
    proofInput: proof,
  };
}

function started(): Progress {
  return startExercise(CATALOG, defaultProgress(), { code: CODE, level: 1 }, NOW);
}

describe('Fortschritt: Ablauf einer Übung', () => {
  it('startExercise legt eine offene Übung an; Stufe 1 zeigt den ersten Hinweis sofort', () => {
    const p = started();
    expect(p.active).toMatchObject({ code: CODE, level: 1, catalogVersion: 1, finishedAt: null });
    expect(p.active?.hintsShown).toEqual([1]);
  });

  it('ein Bericht mit Beweis wird angerechnet und bringt Punkte', () => {
    const p = started();
    const exercise = exerciseFor(CATALOG, p.active!);
    const out = submitReport(
      p,
      exercise,
      draft({ price: '10', quantity: '15', coupon: '' }),
      NOW,
      'r1',
    );
    expect(out.grading.score).toBe(100);
    expect(out.report.creditedBugIds).toEqual(['discount.boundary-quantity-threshold']);
    expect(out.report.xp).toBe(50);
    expect(totalXp(out.progress)).toBe(50);
  });

  it('derselbe Fehler bringt beim zweiten Bericht keine Punkte mehr', () => {
    const p = started();
    const exercise = exerciseFor(CATALOG, p.active!);
    const first = submitReport(
      p,
      exercise,
      draft({ price: '10', quantity: '15', coupon: '' }),
      NOW,
      'r1',
    );
    const second = submitReport(
      first.progress,
      exercise,
      draft({ price: '20', quantity: '15', coupon: '' }),
      NOW,
      'r2',
    );
    expect(second.report.creditedBugIds).toEqual([]);
    expect(second.report.xp).toBe(0);
    expect(foundBugIds(second.progress.active!)).toHaveLength(1);
  });

  it('Bericht ohne Beweis bringt keine Punkte', () => {
    const p = started();
    const out = submitReport(
      p,
      exerciseFor(CATALOG, p.active!),
      draft({ price: '10', quantity: '3', coupon: '' }),
      NOW,
      'r1',
    );
    expect(out.report.xp).toBe(0);
  });

  it('finishExercise speichert den Versuch mit Bonus und Statistik', () => {
    const p = started();
    const exercise = exerciseFor(CATALOG, p.active!);
    const out = submitReport(
      p,
      exercise,
      draft({ price: '10', quantity: '15', coupon: '' }),
      NOW,
      'r1',
    );
    const done = finishExercise(out.progress, exercise, NOW);
    expect(done.active?.finishedAt).toBe(NOW);
    expect(done.attempts).toHaveLength(1);
    expect(done.attempts[0]).toMatchObject({ status: 'finished', xp: 60, reportCount: 1 });
    expect(totalXp(done)).toBe(60);
    expect(categoryStats(done)).toEqual({ boundary: { found: 1, missed: 0 } });
    // Zweites Beenden ändert nichts.
    expect(finishExercise(done, exercise, NOW)).toBe(done);
  });

  it('neue Übung während einer offenen: die alte wird als abgebrochen gespeichert und zählt nicht in der Statistik', () => {
    const p = startExercise(CATALOG, started(), { code: 'BUG-2345-6789', level: 2 }, NOW);
    expect(p.attempts).toHaveLength(1);
    expect(p.attempts[0]?.status).toBe('abandoned');
    expect(categoryStats(p)).toEqual({});
    expect(p.active?.code).toBe('BUG-2345-6789');
  });

  it('Hinweise: Stufe 2 kostet Punkte, Stufe 3 erlaubt keine', () => {
    const level2 = startExercise(
      CATALOG,
      defaultProgress(),
      { code: 'BUG-2345-6789', level: 2 },
      NOW,
    );
    expect(level2.active?.hintsShown).toEqual([0]);
    const withHint = revealHint(level2, 0, 3);
    expect(withHint.active?.hintsShown).toEqual([1]);
    expect(
      revealHint(revealHint(revealHint(withHint, 0, 3), 0, 3), 0, 3).active?.hintsShown,
    ).toEqual([3]);

    const level3 = startExercise(
      CATALOG,
      defaultProgress(),
      { code: 'BUG-ABCD-EFGH', level: 3 },
      NOW,
    );
    expect(revealHint(level3, 0, 3)).toBe(level3);
  });

  it('Ränge: alle 200 Punkte ein Rang', () => {
    expect(rankOf(0)).toEqual({ rank: 1, xpInRank: 0, xpForNext: 200 });
    expect(rankOf(199).rank).toBe(1);
    expect(rankOf(200).rank).toBe(2);
  });
});

describe('Fortschritt: Speichern, Export, Import', () => {
  it('speichert und lädt verlustfrei', () => {
    const store = memoryStore();
    const p = started();
    expect(saveProgress(store, p)).toBe(true);
    expect(loadProgress(store)).toEqual({ progress: p, warning: null });
  });

  it('ohne gespeicherte Daten gibt es einen leeren Fortschritt ohne Warnung', () => {
    expect(loadProgress(memoryStore())).toEqual({ progress: defaultProgress(), warning: null });
  });

  it('beschädigte Daten werden gesichert und nicht verwendet', () => {
    const store = memoryStore();
    store.setItem(STORAGE_KEY, '{"app":"BugJagd","schemaVersion":1,"attempts":"kaputt"}');
    const result = loadProgress(store);
    expect(result.progress).toEqual(defaultProgress());
    expect(result.warning).toContain('beschädigt');
    expect(store.data.get(BROKEN_KEY)).toContain('kaputt');
  });

  it('ohne Speicher (z. B. privater Modus) gibt es eine Warnung', () => {
    expect(loadProgress(null).warning).toContain('kein Speichern');
    expect(saveProgress(null, defaultProgress())).toBe(false);
  });

  it('Export und Import ergeben denselben Fortschritt', () => {
    const p = started();
    const result = parseProgressJson(serializeProgress(p));
    expect(result).toEqual({ ok: true, progress: p });
  });

  it.each([
    ['kein JSON', 'hallo', 'keine gültige JSON-Datei'],
    ['fremde Datei', '{"name":"etwas"}', 'keine BugJagd-Fortschrittsdatei'],
    [
      'falsches Feld',
      '{"app":"BugJagd","schemaVersion":1,"active":null,"attempts":[],"settings":{"theme":"blau","fontSize":"normal"}}',
      'settings → theme',
    ],
    [
      'ungültiger Code',
      JSON.stringify({
        ...defaultProgress(),
        active: {
          code: 'BUG-0000-0000',
          level: 1,
          catalogVersion: 1,
          startedAt: 'x',
          reports: [],
          hintsShown: [],
          finishedAt: null,
        },
      }),
      'active → code',
    ],
  ])('Import lehnt ab: %s', (_name, text, message) => {
    const result = parseProgressJson(text);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain(message);
  });
});
