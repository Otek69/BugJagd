/**
 * Fachbegriffe auf Deutsch mit englischer Übersetzung.
 * Anzeige immer als: "Deutsch (English)".
 */
export const TERMS = {
  bugReport: { de: 'Fehlerbericht', en: 'Bug Report' },
  severity: { de: 'Schweregrad', en: 'Severity' },
  priority: { de: 'Priorität', en: 'Priority' },
  environment: { de: 'Umgebung', en: 'Environment' },
  stepsToReproduce: { de: 'Schritte zum Nachstellen', en: 'Steps to Reproduce' },
  expectedResult: { de: 'Erwartetes Ergebnis', en: 'Expected Result' },
  actualResult: { de: 'Tatsächliches Ergebnis', en: 'Actual Result' },
  proofInput: { de: 'Beweis-Eingabe', en: 'Reproducing Input' },
  testBasis: { de: 'Testbasis', en: 'Test Basis' },
  testObject: { de: 'Testobjekt', en: 'Test Object' },
  exploratoryTesting: { de: 'Exploratives Testen', en: 'Exploratory Testing' },
  testOracle: { de: 'Testorakel', en: 'Test Oracle' },
  defect: { de: 'Fehlerzustand', en: 'Defect' },
  failure: { de: 'Fehlerwirkung', en: 'Failure' },
} as const;

export type TermKey = keyof typeof TERMS;

export function term(key: TermKey): string {
  const t = TERMS[key];
  return `${t.de} (${t.en})`;
}
