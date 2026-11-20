/**
 * Übungscodes im Format BUG-XXXX-XXXX.
 *
 * Erlaubte Zeichen: Ziffern 2–9 und Buchstaben ohne I, L, O.
 * So kann man 0/O und 1/I/L nicht verwechseln.
 * 31 Zeichen hoch 8 Stellen = über 850 Milliarden mögliche Codes.
 */
import { Rng } from './rng';

export const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const CODE_LENGTH = 8;
const CODE_PATTERN = new RegExp(`^BUG-[${CODE_ALPHABET}]{4}-[${CODE_ALPHABET}]{4}$`);

export type CodeParseResult = { ok: true; code: string } | { ok: false; error: string };

export function isValidCode(code: string): boolean {
  return CODE_PATTERN.test(code);
}

/**
 * Liest einen eingegebenen Code tolerant ein:
 * Groß-/Kleinschreibung, Leerzeichen und Bindestriche sind egal,
 * das Präfix "BUG" ist optional.
 */
export function parseCode(input: string): CodeParseResult {
  let text = input.toUpperCase().replace(/[\s-]/g, '');
  if (text.startsWith('BUG')) text = text.slice(3);
  if (text.length !== CODE_LENGTH) {
    return {
      ok: false,
      error: `Der Code braucht genau ${CODE_LENGTH} Zeichen nach „BUG-“. Gefunden: ${text.length}.`,
    };
  }
  const invalid = [...text].filter((ch) => !CODE_ALPHABET.includes(ch));
  if (invalid.length > 0) {
    const unique = [...new Set(invalid)].join(', ');
    return {
      ok: false,
      error: `Diese Zeichen gibt es in Codes nicht: ${unique}. Erlaubt sind 2–9 und A–Z ohne I, L, O.`,
    };
  }
  return { ok: true, code: `BUG-${text.slice(0, 4)}-${text.slice(4)}` };
}

function codeFromRng(rng: Rng): string {
  let chars = '';
  for (let i = 0; i < CODE_LENGTH; i++) chars += rng.pick([...CODE_ALPHABET]);
  return `BUG-${chars.slice(0, 4)}-${chars.slice(4)}`;
}

/** Zufälliger neuer Code. Nutzt den sicheren Zufall des Browsers. */
export function randomCode(): string {
  const bytes = new Uint32Array(2);
  globalThis.crypto.getRandomValues(bytes);
  return codeFromRng(new Rng(`random:${bytes[0]}:${bytes[1]}`));
}

/** Datum als JJJJ-MM-TT in der Zeitzone Europe/Vienna. */
export function viennaDate(date: Date): string {
  // en-CA liefert das Format JJJJ-MM-TT.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Vienna',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** Code der "Übung des Tages". Gleicher Tag (Wiener Zeit) = gleicher Code. */
export function dailyCode(date: Date): string {
  return codeFromRng(new Rng(`daily:${viennaDate(date)}`));
}
