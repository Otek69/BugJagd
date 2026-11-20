/**
 * Datenformat des gespeicherten Fortschritts.
 * zod prüft dieses Format beim Laden und beim Import. Eine kaputte oder fremde
 * Datei kann den Fortschritt dadurch nicht beschädigen.
 */
import { z } from 'zod';
import { isValidCode } from '../../core/random/code';

export const SCHEMA_VERSION = 1;

const LevelSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);
const CodeSchema = z.string().refine(isValidCode, { message: 'ungültiger Übungscode' });
const IsoDate = z.string().min(1);

export const StoredReportSchema = z.object({
  id: z.string().min(1),
  submittedAt: IsoDate,
  title: z.string(),
  steps: z.array(z.string()),
  expected: z.string(),
  actual: z.string(),
  severity: z.enum(['critical', 'high', 'medium', 'low', '']),
  priority: z.enum(['high', 'medium', 'low', '']),
  environment: z.string(),
  proofInput: z.record(z.string(), z.string()),
  score: z.number().int().min(0).max(100),
  triggeredBugIds: z.array(z.string()),
  /** Fehler, die mit diesem Bericht zum ersten Mal gefunden wurden. */
  creditedBugIds: z.array(z.string()),
  xp: z.number().int().min(0),
});

export const ActiveExerciseSchema = z.object({
  code: CodeSchema,
  level: LevelSchema,
  catalogVersion: z.number().int().min(1),
  startedAt: IsoDate,
  reports: z.array(StoredReportSchema),
  /** Anzahl der angezeigten Hinweise pro verstecktem Fehler (gleiche Reihenfolge wie in der Übung). */
  hintsShown: z.array(z.number().int().min(0)),
  /** Gesetzt, sobald die Übung beendet ist. Dann wird die Lösung angezeigt. */
  finishedAt: IsoDate.nullable(),
});

export const AttemptSchema = z.object({
  code: CodeSchema,
  level: LevelSchema,
  catalogVersion: z.number().int().min(1),
  miniAppId: z.string(),
  startedAt: IsoDate,
  endedAt: IsoDate,
  status: z.enum(['finished', 'abandoned']),
  bugs: z.array(z.object({ id: z.string(), category: z.string(), found: z.boolean() })),
  reportCount: z.number().int().min(0),
  hintsUsed: z.number().int().min(0),
  xp: z.number().int().min(0),
});

export const SettingsSchema = z.object({
  theme: z.enum(['system', 'light', 'dark']),
  fontSize: z.enum(['normal', 'large', 'larger', 'largest']),
});

export const ProgressSchema = z.object({
  app: z.literal('BugJagd'),
  schemaVersion: z.literal(SCHEMA_VERSION),
  active: ActiveExerciseSchema.nullable(),
  attempts: z.array(AttemptSchema),
  settings: SettingsSchema,
});

export type StoredReport = z.infer<typeof StoredReportSchema>;
export type ActiveExercise = z.infer<typeof ActiveExerciseSchema>;
export type Attempt = z.infer<typeof AttemptSchema>;
export type Settings = z.infer<typeof SettingsSchema>;
export type Progress = z.infer<typeof ProgressSchema>;

export const DEFAULT_SETTINGS: Settings = { theme: 'system', fontSize: 'normal' };

export function defaultProgress(): Progress {
  return {
    app: 'BugJagd',
    schemaVersion: SCHEMA_VERSION,
    active: null,
    attempts: [],
    settings: { ...DEFAULT_SETTINGS },
  };
}

export type ParseResult = { ok: true; progress: Progress } | { ok: false; error: string };

/** Prüft beliebige Daten. Liefert eine genaue deutsche Fehlermeldung. */
export function parseProgress(data: unknown): ParseResult {
  const result = ProgressSchema.safeParse(data);
  if (result.success) return { ok: true, progress: result.data };
  const issue = result.error.issues[0];
  const path = issue && issue.path.length > 0 ? issue.path.join(' → ') : '(oberste Ebene)';
  return {
    ok: false,
    error: `Die Daten haben nicht das richtige Format. Stelle: ${path}. Problem: ${issue?.message ?? 'unbekannt'}.`,
  };
}

/** Liest den Text einer Export-Datei. */
export function parseProgressJson(text: string): ParseResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Die Datei ist keine gültige JSON-Datei.' };
  }
  if (typeof data === 'object' && data !== null && (data as { app?: unknown }).app !== 'BugJagd') {
    return { ok: false, error: 'Die Datei ist keine BugJagd-Fortschrittsdatei.' };
  }
  return parseProgress(data);
}
