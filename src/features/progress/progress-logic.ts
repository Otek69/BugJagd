/**
 * Reine Funktionen für den Fortschritt (ohne React, gut testbar).
 * Jede Funktion bekommt den alten Fortschritt und liefert einen neuen.
 */
import { CURRENT_CATALOG_VERSION } from '../../core/generator/catalog-version';
import { generateExercise, LEVEL_RULES, type Catalog } from '../../core/generator/generator';
import {
  gradeReport,
  type BugReportDraft,
  type GradingResult,
} from '../../core/grading/report-rules';
import type { BugCategory, Exercise, Level } from '../../core/types';
import type { ActiveExercise, Attempt, Progress, StoredReport } from './schema';

/** Punkte-Regeln. Werden auch in der App angezeigt. */
export const XP_RULES = {
  /** Ein Bericht, der einen neuen Fehler beweist, bringt Berichtspunkte ÷ 2. */
  reportDivisor: 2,
  /** Bonus pro gefundenem Fehler beim Beenden, mal Stufe. */
  bonusPerBugPerLevel: 10,
  /** Abzug pro bezahltem Hinweis (Stufe 2). */
  hintCost: 5,
  /** Punkte pro Rang. */
  xpPerRank: 200,
} as const;

export function exerciseFor(
  catalog: Catalog,
  active: Pick<ActiveExercise, 'code' | 'level' | 'catalogVersion'>,
): Exercise {
  return generateExercise(catalog, active);
}

export function foundBugIds(active: ActiveExercise): string[] {
  return [...new Set(active.reports.flatMap((r) => r.creditedBugIds))];
}

export function hintsUsed(active: ActiveExercise): number {
  return active.hintsShown.reduce((sum, n) => sum + n, 0);
}

export function paidHints(active: ActiveExercise): number {
  return LEVEL_RULES[active.level].hints === 'paid' ? hintsUsed(active) : 0;
}

function reportsXp(active: ActiveExercise): number {
  return active.reports.reduce((sum, r) => sum + r.xp, 0);
}

export function finishBonus(active: ActiveExercise): number {
  return foundBugIds(active).length * XP_RULES.bonusPerBugPerLevel * active.level;
}

/** Punkte der laufenden Übung (ohne Abschluss-Bonus). */
export function activeXp(active: ActiveExercise): number {
  return Math.max(0, reportsXp(active) - paidHints(active) * XP_RULES.hintCost);
}

export function totalXp(progress: Progress): number {
  const done = progress.attempts.reduce((sum, a) => sum + a.xp, 0);
  const running =
    progress.active && progress.active.finishedAt === null ? activeXp(progress.active) : 0;
  return done + running;
}

export function rankOf(xp: number): { rank: number; xpInRank: number; xpForNext: number } {
  const rank = Math.floor(xp / XP_RULES.xpPerRank) + 1;
  return { rank, xpInRank: xp % XP_RULES.xpPerRank, xpForNext: XP_RULES.xpPerRank };
}

function toAttempt(
  exercise: Exercise,
  active: ActiveExercise,
  status: Attempt['status'],
  now: string,
): Attempt {
  const found = new Set(foundBugIds(active));
  const xp =
    status === 'finished'
      ? Math.max(0, reportsXp(active) + finishBonus(active) - paidHints(active) * XP_RULES.hintCost)
      : activeXp(active);
  return {
    code: active.code,
    level: active.level,
    catalogVersion: active.catalogVersion,
    miniAppId: exercise.app.id,
    startedAt: active.startedAt,
    endedAt: now,
    status,
    bugs: exercise.bugs.map((b) => ({
      id: b.bug.id,
      category: b.bug.category,
      found: found.has(b.bug.id),
    })),
    reportCount: active.reports.length,
    hintsUsed: hintsUsed(active),
    xp,
  };
}

/**
 * Startet eine neue Übung. Eine offene, nicht beendete Übung wird als "abgebrochen"
 * gespeichert. Ihre bisherigen Punkte bleiben erhalten.
 */
export function startExercise(
  catalog: Catalog,
  progress: Progress,
  request: { code: string; level: Level },
  now: string,
): Progress {
  const attempts = [...progress.attempts];
  if (progress.active && progress.active.finishedAt === null) {
    attempts.push(
      toAttempt(exerciseFor(catalog, progress.active), progress.active, 'abandoned', now),
    );
  }
  const exercise = generateExercise(catalog, {
    ...request,
    catalogVersion: CURRENT_CATALOG_VERSION,
  });
  return {
    ...progress,
    attempts,
    active: {
      code: request.code,
      level: request.level,
      catalogVersion: CURRENT_CATALOG_VERSION,
      startedAt: now,
      reports: [],
      hintsShown: exercise.bugs.map(() => (LEVEL_RULES[request.level].hints === 'free' ? 1 : 0)),
      finishedAt: null,
    },
  };
}

export interface SubmitOutcome {
  progress: Progress;
  grading: GradingResult;
  report: StoredReport;
}

export function submitReport(
  progress: Progress,
  exercise: Exercise,
  draft: BugReportDraft,
  now: string,
  id: string,
): SubmitOutcome {
  const active = progress.active;
  if (!active || active.finishedAt !== null) throw new Error('Keine offene Übung.');
  const grading = gradeReport(exercise, draft);
  const already = new Set(foundBugIds(active));
  const credited = grading.proof.triggeredBugIds.filter((bugId) => !already.has(bugId));
  const report: StoredReport = {
    id,
    submittedAt: now,
    title: draft.title,
    steps: draft.steps,
    expected: draft.expected,
    actual: draft.actual,
    severity: draft.severity,
    priority: draft.priority,
    environment: draft.environment,
    proofInput: draft.proofInput,
    score: grading.score,
    triggeredBugIds: grading.proof.triggeredBugIds,
    creditedBugIds: credited,
    xp: credited.length > 0 ? Math.round(grading.score / XP_RULES.reportDivisor) : 0,
  };
  return {
    progress: { ...progress, active: { ...active, reports: [...active.reports, report] } },
    grading,
    report,
  };
}

export function revealHint(progress: Progress, bugIndex: number, maxHints: number): Progress {
  const active = progress.active;
  if (!active || active.finishedAt !== null) return progress;
  if (LEVEL_RULES[active.level].hints === 'none') return progress;
  const hintsShown = active.hintsShown.map((n, i) =>
    i === bugIndex ? Math.min(n + 1, maxHints) : n,
  );
  return { ...progress, active: { ...active, hintsShown } };
}

export function finishExercise(progress: Progress, exercise: Exercise, now: string): Progress {
  const active = progress.active;
  if (!active || active.finishedAt !== null) return progress;
  return {
    ...progress,
    attempts: [...progress.attempts, toAttempt(exercise, active, 'finished', now)],
    active: { ...active, finishedAt: now },
  };
}

export type CategoryStats = Partial<Record<BugCategory, { found: number; missed: number }>>;

/** Statistik pro Fehlerkategorie. Nur beendete Übungen zählen. */
export function categoryStats(progress: Progress): CategoryStats {
  const stats: CategoryStats = {};
  for (const attempt of progress.attempts) {
    if (attempt.status !== 'finished') continue;
    for (const bug of attempt.bugs) {
      const key = bug.category as BugCategory;
      const entry = stats[key] ?? { found: 0, missed: 0 };
      if (bug.found) entry.found++;
      else entry.missed++;
      stats[key] = entry;
    }
  }
  return stats;
}
