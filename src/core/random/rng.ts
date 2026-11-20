/**
 * Deterministischer Zufallsgenerator (pseudo-random number generator, PRNG).
 *
 * Gleicher Startwert (seed) => immer die gleiche Zahlenfolge.
 * Das ist die Grundlage für "gleicher Übungscode = gleiche Übung".
 *
 * Algorithmus: cyrb53-ähnlicher String-Hash + mulberry32.
 * Beide sind klein, schnell und gut genug für Übungen (nicht für Kryptografie).
 */

/** Wandelt einen Text in eine 32-Bit-Zahl um. Gleicher Text = gleiche Zahl. */
export function hashString(text: string): number {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h1 ^ h2) >>> 0;
}

export class Rng {
  private state: number;
  private readonly seedText: string;

  constructor(seed: string) {
    this.seedText = seed;
    this.state = hashString(seed);
  }

  /** Zahl im Bereich [0, 1). */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Ganze Zahl von min bis max (beide eingeschlossen). */
  int(min: number, max: number): number {
    if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) {
      throw new Error(`Rng.int: ungültiger Bereich ${min}..${max}`);
    }
    return min + Math.floor(this.next() * (max - min + 1));
  }

  /** Wählt ein Element aus einer nicht leeren Liste. */
  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error('Rng.pick: leere Liste');
    return items[this.int(0, items.length - 1)] as T;
  }

  /** Gibt eine gemischte Kopie der Liste zurück (Fisher-Yates). */
  shuffle<T>(items: readonly T[]): T[] {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      [copy[i], copy[j]] = [copy[j] as T, copy[i] as T];
    }
    return copy;
  }

  /**
   * Erzeugt einen unabhängigen Generator für einen benannten Bereich.
   * Wichtig für stabile Seeds: Wenn ein Bereich (z. B. eine Fehlerart) mehr
   * Zufallszahlen verbraucht, ändern sich die anderen Bereiche nicht.
   */
  fork(label: string): Rng {
    return new Rng(`${this.seedText}::${label}`);
  }
}
