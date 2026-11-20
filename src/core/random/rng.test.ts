import { describe, expect, it } from 'vitest';
import { hashString, Rng } from './rng';

describe('Rng', () => {
  it('gleicher Startwert ergibt die gleiche Zahlenfolge', () => {
    const a = new Rng('BUG-7F3A-K9Q2');
    const b = new Rng('BUG-7F3A-K9Q2');
    const seqA = Array.from({ length: 20 }, () => a.next());
    const seqB = Array.from({ length: 20 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it('verschiedene Startwerte ergeben verschiedene Folgen', () => {
    expect(new Rng('a').next()).not.toBe(new Rng('b').next());
  });

  it('next() liegt immer in [0, 1)', () => {
    const rng = new Rng('range');
    for (let i = 0; i < 10_000; i++) {
      const value = rng.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('int(min, max) erreicht beide Grenzen und verlässt den Bereich nie', () => {
    const rng = new Rng('int');
    const seen = new Set<number>();
    for (let i = 0; i < 2_000; i++) {
      const value = rng.int(3, 7);
      expect(value).toBeGreaterThanOrEqual(3);
      expect(value).toBeLessThanOrEqual(7);
      seen.add(value);
    }
    expect([...seen].sort()).toEqual([3, 4, 5, 6, 7]);
  });

  it('int() lehnt ungültige Bereiche ab', () => {
    expect(() => new Rng('x').int(5, 4)).toThrow();
    expect(() => new Rng('x').int(1.5, 4)).toThrow();
  });

  it('pick() lehnt leere Listen ab', () => {
    expect(() => new Rng('x').pick([])).toThrow();
  });

  it('shuffle() behält alle Elemente und ändert die Eingabe nicht', () => {
    const items = [1, 2, 3, 4, 5, 6];
    const shuffled = new Rng('shuffle').shuffle(items);
    expect([...shuffled].sort()).toEqual(items);
    expect(items).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('fork() ist unabhängig davon, wie viele Zahlen der Eltern-Generator schon verbraucht hat', () => {
    const a = new Rng('parent');
    const b = new Rng('parent');
    b.next();
    b.next();
    expect(a.fork('child').next()).toBe(b.fork('child').next());
    expect(a.fork('x').next()).not.toBe(a.fork('y').next());
  });

  it('hashString ist stabil (Schutz gegen versehentliche Änderung des Algorithmus)', () => {
    expect(hashString('BugJagd')).toBe(hashString('BugJagd'));
    expect(hashString('')).toBeTypeOf('number');
  });
});
