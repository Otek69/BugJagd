/**
 * Bewertung eines Fehlerberichts mit festen, offen sichtbaren Regeln (R1–R9).
 * Keine Bewertung "nach Gefühl": Jede Regel ist eine einfache Prüfung.
 */
import type { Exercise, Priority, RawInput, Severity } from '../types';
import { SEVERITIES } from '../types';
import { checkProof, type ProofResult } from './proof';

export interface BugReportDraft {
  title: string;
  /** Ein Schritt pro Eintrag. */
  steps: string[];
  expected: string;
  actual: string;
  severity: Severity | '';
  priority: Priority | '';
  environment: string;
  proofInput: RawInput;
}

export type RuleId = 'R1' | 'R2' | 'R3' | 'R4' | 'R5' | 'R6' | 'R7' | 'R8' | 'R9';

export interface RuleResult {
  id: RuleId;
  title: string;
  passed: boolean;
  points: number;
  maxPoints: number;
  /** Was genau erfüllt ist, oder was genau fehlt. */
  feedback: string;
}

export interface GradingResult {
  rules: RuleResult[];
  score: number;
  maxScore: number;
  proof: ProofResult;
}

/** Die Regeln als Beschreibung für die Anzeige in der App. */
export const RULE_DESCRIPTIONS: Record<RuleId, { title: string; text: string; maxPoints: number }> =
  {
    R1: {
      title: 'Beweis',
      text: 'Die Beweis-Eingabe löst einen versteckten Fehler aus.',
      maxPoints: 50,
    },
    R2: {
      title: 'Titel',
      text: '10 bis 120 Zeichen lang und nennt ein Feld oder eine Funktion des Testobjekts (z. B. „Menge“, „Rabatt“).',
      maxPoints: 5,
    },
    R3: {
      title: 'Schritte',
      text: 'Mindestens 2 Schritte. Jeder Schritt hat mindestens 3 Wörter.',
      maxPoints: 10,
    },
    R4: {
      title: 'Werte in den Schritten',
      text: 'Alle ausgefüllten Werte der Beweis-Eingabe kommen in den Schritten vor.',
      maxPoints: 10,
    },
    R5: {
      title: 'Erwartetes Ergebnis',
      text: 'Ausgefüllt und enthält eine Zahl oder eine Anforderungsnummer (z. B. „A3“).',
      maxPoints: 5,
    },
    R6: {
      title: 'Tatsächliches Ergebnis',
      text: 'Ausgefüllt und enthält eine Zahl oder einen angezeigten Text in Anführungszeichen.',
      maxPoints: 5,
    },
    R7: {
      title: 'Erwartet und tatsächlich getrennt',
      text: 'Beide Felder sind verschieden. Das Feld „tatsächlich“ enthält keine Wörter wie „sollte“, „müsste“ oder „erwartet“.',
      maxPoints: 5,
    },
    R8: {
      title: 'Schweregrad',
      text: 'Höchstens eine Stufe vom Referenz-Schweregrad des gefundenen Fehlers entfernt.',
      maxPoints: 5,
    },
    R9: {
      title: 'Priorität und Umgebung',
      text: 'Beide sind ausgefüllt.',
      maxPoints: 5,
    },
  };

const EXPECTATION_WORDS =
  /(^|[^\p{L}])(sollte|sollten|müsste|müssten|muss|müssen|erwartet|richtig wäre)(?=$|[^\p{L}])/iu;

/** Entfernt eine Nummerierung am Anfang: "1.", "2)", "-", "*". */
export function stripStepPrefix(step: string): string {
  return step.replace(/^\s*(\d+[.)]|[-*•])\s*/, '').trim();
}

export function splitSteps(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter((w) => w.length > 0).length;
}

function rule(id: RuleId, passed: boolean, feedback: string): RuleResult {
  const { title, maxPoints } = RULE_DESCRIPTIONS[id];
  return { id, title, passed, points: passed ? maxPoints : 0, maxPoints, feedback };
}

export function severityDistance(a: Severity, b: Severity): number {
  return Math.abs(SEVERITIES.indexOf(a) - SEVERITIES.indexOf(b));
}

export const SEVERITY_DE: Record<Severity, string> = {
  critical: 'Kritisch',
  high: 'Hoch',
  medium: 'Mittel',
  low: 'Niedrig',
};

export function gradeReport(exercise: Exercise, report: BugReportDraft): GradingResult {
  const proof = checkProof(exercise, report.proofInput);
  const rules: RuleResult[] = [];

  // R1 Beweis
  if (proof.triggeredBugIds.length > 0) {
    const n = proof.triggeredBugIds.length;
    rules.push(
      rule(
        'R1',
        true,
        n === 1
          ? 'Deine Eingabe löst einen versteckten Fehler aus.'
          : `Deine Eingabe löst ${n} versteckte Fehler gleichzeitig aus. Gute Praxis: ein Bericht pro Fehler. Versuche, die Fehler mit getrennten Eingaben zu isolieren.`,
      ),
    );
  } else if (proof.programDiffers) {
    rules.push(
      rule(
        'R1',
        false,
        'Das Ergebnis ist falsch, aber es lässt sich keinem einzelnen Fehler zuordnen. Ändere die Eingabe so, dass nur ein Fehler wirkt.',
      ),
    );
  } else {
    rules.push(
      rule(
        'R1',
        false,
        'Mit dieser Eingabe verhält sich das Programm korrekt. Sie beweist keinen Fehler. Prüfe, ob du die Eingabe übernommen hast, mit der du den Fehler gesehen hast.',
      ),
    );
  }

  // R2 Titel
  const title = report.title.trim();
  const lowerTitle = title.toLowerCase();
  const keyword = exercise.app.reportKeywords.find((k) => lowerTitle.includes(k));
  if (title.length < 10 || title.length > 120) {
    rules.push(
      rule('R2', false, `Der Titel hat ${title.length} Zeichen. Erlaubt sind 10 bis 120.`),
    );
  } else if (!keyword) {
    rules.push(
      rule(
        'R2',
        false,
        'Der Titel nennt kein Feld und keine Funktion des Testobjekts. Beispiele: Preis, Menge, Rabatt, Gutschein, Rundung.',
      ),
    );
  } else {
    const shown = title.substr(lowerTitle.indexOf(keyword), keyword.length);
    rules.push(rule('R2', true, `Der Titel hat eine passende Länge und nennt „${shown}“.`));
  }

  // R3 Schritte
  const steps = report.steps.map(stripStepPrefix).filter((s) => s.length > 0);
  const shortSteps = steps
    .map((s, i) => ({ n: i + 1, words: wordCount(s) }))
    .filter((s) => s.words < 3);
  if (steps.length < 2) {
    rules.push(
      rule('R3', false, `Du hast ${steps.length} Schritt(e) angegeben. Nötig sind mindestens 2.`),
    );
  } else if (shortSteps.length > 0) {
    rules.push(
      rule(
        'R3',
        false,
        `Diese Schritte haben weniger als 3 Wörter: ${shortSteps.map((s) => s.n).join(', ')}. Beschreibe genau, was man tut.`,
      ),
    );
  } else {
    rules.push(rule('R3', true, `${steps.length} vollständige Schritte.`));
  }

  // R4 Werte der Beweis-Eingabe in den Schritten
  const stepsText = steps.join('\n').toLowerCase();
  const filled = exercise.app.inputFields
    .map((f) => ({ label: f.label, value: (report.proofInput[f.key] ?? '').trim() }))
    .filter((f) => f.value.length > 0);
  const missing = filled.filter((f) => !stepsText.includes(f.value.toLowerCase()));
  if (filled.length === 0) {
    rules.push(
      rule(
        'R4',
        false,
        'Die Beweis-Eingabe ist leer. Es gibt keine Werte, die man nachstellen kann.',
      ),
    );
  } else if (missing.length > 0) {
    rules.push(
      rule(
        'R4',
        false,
        `Diese Werte fehlen in den Schritten: ${missing.map((f) => `${f.label} „${f.value}“`).join(', ')}. Ohne genaue Werte kann niemand den Fehler nachstellen.`,
      ),
    );
  } else {
    rules.push(rule('R4', true, 'Alle Werte der Beweis-Eingabe stehen in den Schritten.'));
  }

  // R5 Erwartet
  const expected = report.expected.trim();
  if (expected === '') {
    rules.push(rule('R5', false, 'Das erwartete Ergebnis ist leer.'));
  } else if (!/\d/.test(expected)) {
    rules.push(
      rule(
        'R5',
        false,
        'Das erwartete Ergebnis enthält keine Zahl und keine Anforderungsnummer. Schreibe den genauen Wert oder z. B. „laut A3“.',
      ),
    );
  } else {
    rules.push(rule('R5', true, 'Das erwartete Ergebnis ist konkret.'));
  }

  // R6 Tatsächlich
  const actual = report.actual.trim();
  if (actual === '') {
    rules.push(rule('R6', false, 'Das tatsächliche Ergebnis ist leer.'));
  } else if (!/\d/.test(actual) && !/["„“'‚‘»«].+["“”'‘’«»]/.test(actual)) {
    rules.push(
      rule(
        'R6',
        false,
        'Das tatsächliche Ergebnis enthält keine Zahl und keinen zitierten Text. Schreibe genau auf, was angezeigt wurde.',
      ),
    );
  } else {
    rules.push(rule('R6', true, 'Das tatsächliche Ergebnis ist konkret.'));
  }

  // R7 Getrennt
  if (expected === '' || actual === '') {
    rules.push(
      rule('R7', false, 'Beide Felder müssen ausgefüllt sein, damit man sie vergleichen kann.'),
    );
  } else if (expected.toLowerCase() === actual.toLowerCase()) {
    rules.push(
      rule('R7', false, 'Erwartet und tatsächlich sind gleich. Dann gibt es keinen Fehler.'),
    );
  } else if (EXPECTATION_WORDS.test(actual)) {
    const word = EXPECTATION_WORDS.exec(actual)?.[2] ?? '';
    rules.push(
      rule(
        'R7',
        false,
        `Im Feld „tatsächlich“ steht „${word}“. Das beschreibt das Erwartete. Schreibe dort nur, was wirklich passiert ist.`,
      ),
    );
  } else {
    rules.push(rule('R7', true, 'Erwartet und tatsächlich sind sauber getrennt.'));
  }

  // R8 Schweregrad
  const triggered = exercise.bugs.filter((p) => proof.triggeredBugIds.includes(p.bug.id));
  const reference = triggered
    .map((p) => p.bug.severity)
    .sort((a, b) => SEVERITIES.indexOf(a) - SEVERITIES.indexOf(b))[0];
  if (report.severity === '') {
    rules.push(rule('R8', false, 'Kein Schweregrad gewählt.'));
  } else if (!reference) {
    rules.push(
      rule(
        'R8',
        false,
        'Der Schweregrad kann nur bewertet werden, wenn die Beweis-Eingabe einen Fehler auslöst (Regel R1).',
      ),
    );
  } else if (severityDistance(report.severity, reference) > 1) {
    rules.push(
      rule(
        'R8',
        false,
        `Du hast „${SEVERITY_DE[report.severity]}“ gewählt. Der Referenz-Schweregrad ist „${SEVERITY_DE[reference]}“. Das sind mehr als eine Stufe Unterschied.`,
      ),
    );
  } else {
    rules.push(
      rule(
        'R8',
        true,
        `Du hast „${SEVERITY_DE[report.severity]}“ gewählt. Referenz: „${SEVERITY_DE[reference]}“.`,
      ),
    );
  }

  // R9 Priorität und Umgebung
  const missingMeta = [
    report.priority === '' ? 'Priorität' : null,
    report.environment.trim() === '' ? 'Umgebung' : null,
  ].filter((x): x is string => x !== null);
  rules.push(
    missingMeta.length > 0
      ? rule('R9', false, `Nicht ausgefüllt: ${missingMeta.join(' und ')}.`)
      : rule('R9', true, 'Priorität und Umgebung sind ausgefüllt.'),
  );

  const score = rules.reduce((sum, r) => sum + r.points, 0);
  const maxScore = rules.reduce((sum, r) => sum + r.maxPoints, 0);
  return { rules, score, maxScore, proof };
}
