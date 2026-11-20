import type { BugCategory, Priority, Severity } from '../core/types';

export interface CategoryInfo {
  id: BugCategory;
  de: string;
  en: string;
  /** Ein Satz: Was gehört in diese Kategorie? */
  description: string;
  /** Ab dieser BugJagd-Version gibt es Fehlerarten dieser Kategorie. */
  availableFrom: string;
}

export const CATEGORIES: Record<BugCategory, CategoryInfo> = {
  boundary: {
    id: 'boundary',
    de: 'Grenzwertfehler',
    en: 'Boundary Error',
    description: 'Ein Vergleich an einer Grenze ist falsch, z. B. „>“ statt „>=“ (Off-by-one).',
    availableFrom: '0.1',
  },
  validation: {
    id: 'validation',
    de: 'Eingabeprüfung',
    en: 'Input Validation',
    description: 'Ungültige Eingaben werden angenommen oder gültige abgelehnt.',
    availableFrom: '0.1',
  },
  calculation: {
    id: 'calculation',
    de: 'Rundungs- und Rechenfehler',
    en: 'Calculation / Rounding Error',
    description: 'Ein Ergebnis wird falsch berechnet oder falsch gerundet.',
    availableFrom: '0.1',
  },
  locale: {
    id: 'locale',
    de: 'Text und Sprache',
    en: 'Localization',
    description: 'Fehler mit Umlauten, Dezimalkomma, Datumsformaten oder Sprache.',
    availableFrom: '0.1',
  },
  state: {
    id: 'state',
    de: 'Zustandsfehler',
    en: 'State Transition Error',
    description: 'Ein unerlaubter Zustandswechsel ist möglich, z. B. durch doppelten Klick.',
    availableFrom: 'später',
  },
  datetime: {
    id: 'datetime',
    de: 'Datum und Zeit',
    en: 'Date/Time Error',
    description: 'Fehler mit Schaltjahr, Monatsende oder Zeitzone.',
    availableFrom: 'später',
  },
  a11y: {
    id: 'a11y',
    de: 'Barrierefreiheit',
    en: 'Accessibility',
    description: 'Fehlende Beschriftung oder keine Bedienung per Tastatur.',
    availableFrom: 'später',
  },
  api: {
    id: 'api',
    de: 'API-Fehler',
    en: 'API Error',
    description: 'Falscher Statuscode, fehlende Prüfung oder falsches Datenformat.',
    availableFrom: 'später',
  },
  security: {
    id: 'security',
    de: 'Sicherheits-Grundlagen (simuliert)',
    en: 'Security Basics (simulated)',
    description: 'Harmlos simuliert, z. B. ungefilterte Eingabe wird angezeigt.',
    availableFrom: 'später',
  },
  performance: {
    id: 'performance',
    de: 'Performance',
    en: 'Performance',
    description: 'Die Antwort wird bei großen Mengen langsam.',
    availableFrom: 'später',
  },
};

export function categoryLabel(id: BugCategory): string {
  const c = CATEGORIES[id];
  return `${c.de} (${c.en})`;
}

export const SEVERITY_LABELS: Record<Severity, { de: string; en: string; help: string }> = {
  critical: {
    de: 'Kritisch',
    en: 'Critical',
    help: 'Das System ist nicht benutzbar, oder es entsteht großer Schaden.',
  },
  high: {
    de: 'Hoch',
    en: 'High',
    help: 'Eine wichtige Funktion liefert falsche Ergebnisse, z. B. ein falscher Preis.',
  },
  medium: {
    de: 'Mittel',
    en: 'Medium',
    help: 'Eine Funktion ist in bestimmten Fällen falsch. Es gibt einen Umweg.',
  },
  low: {
    de: 'Niedrig',
    en: 'Low',
    help: 'Kleiner Fehler mit wenig Wirkung, z. B. ein Cent Unterschied oder ein Tippfehler.',
  },
};

export const PRIORITY_LABELS: Record<Priority, { de: string; en: string; help: string }> = {
  high: { de: 'Hoch', en: 'High', help: 'Soll sofort behoben werden.' },
  medium: { de: 'Mittel', en: 'Medium', help: 'Soll im normalen Ablauf behoben werden.' },
  low: { de: 'Niedrig', en: 'Low', help: 'Kann später behoben werden.' },
};
