/**
 * Kapitel des ISTQB-CTFL-v4.0-Lehrplans, auf die BugJagd verweist.
 * Die Titel sind eigene Formulierungen (Deutsch + Englisch), keine Kopie des Lehrplans.
 */
export interface SyllabusEntry {
  section: string;
  de: string;
  en: string;
}

export const SYLLABUS: Record<string, SyllabusEntry> = {
  '1': { section: '1', de: 'Grundlagen des Testens', en: 'Fundamentals of Testing' },
  '1.2.3': {
    section: '1.2.3',
    de: 'Fehlhandlung, Fehlerzustand, Fehlerwirkung',
    en: 'Errors, Defects, Failures',
  },
  '2': {
    section: '2',
    de: 'Testen im Softwareentwicklungslebenszyklus',
    en: 'Testing Throughout the SDLC',
  },
  '3': { section: '3', de: 'Statisches Testen', en: 'Static Testing' },
  '4': { section: '4', de: 'Testanalyse und Testentwurf', en: 'Test Analysis and Design' },
  '4.2.1': {
    section: '4.2.1',
    de: 'Äquivalenzklassenbildung',
    en: 'Equivalence Partitioning',
  },
  '4.2.2': { section: '4.2.2', de: 'Grenzwertanalyse', en: 'Boundary Value Analysis' },
  '4.2.3': { section: '4.2.3', de: 'Entscheidungstabellentest', en: 'Decision Table Testing' },
  '4.2.4': { section: '4.2.4', de: 'Zustandsübergangstest', en: 'State Transition Testing' },
  '4.4.1': { section: '4.4.1', de: 'Intuitive Testfallermittlung', en: 'Error Guessing' },
  '4.4.2': { section: '4.4.2', de: 'Exploratives Testen', en: 'Exploratory Testing' },
  '5': { section: '5', de: 'Management der Testaktivitäten', en: 'Managing the Test Activities' },
  '5.5': { section: '5.5', de: 'Fehlermanagement', en: 'Defect Management' },
  '6': { section: '6', de: 'Testwerkzeuge', en: 'Test Tools' },
};

export function syllabusLabel(section: string): string {
  const entry = SYLLABUS[section];
  if (!entry) return `CTFL 4.0, Kapitel ${section}`;
  return `CTFL 4.0, Kapitel ${entry.section}: ${entry.de} (${entry.en})`;
}
