import { describe, expect, it } from 'vitest';
import { CODE_ALPHABET, dailyCode, isValidCode, parseCode, randomCode, viennaDate } from './code';

describe('Übungscodes', () => {
  it('das Alphabet enthält keine verwechselbaren Zeichen', () => {
    for (const ch of ['0', '1', 'O', 'I', 'L']) expect(CODE_ALPHABET).not.toContain(ch);
    expect(CODE_ALPHABET).toHaveLength(31);
  });

  it('randomCode() liefert gültige, verschiedene Codes', () => {
    const codes = new Set(Array.from({ length: 200 }, () => randomCode()));
    for (const code of codes) expect(isValidCode(code)).toBe(true);
    expect(codes.size).toBeGreaterThan(190);
  });

  it('parseCode() akzeptiert verschiedene Schreibweisen', () => {
    for (const text of [
      'BUG-7F3A-K9Q2',
      'bug-7f3a-k9q2',
      ' 7F3A K9Q2 ',
      '7F3AK9Q2',
      'BUG7F3AK9Q2',
    ]) {
      expect(parseCode(text)).toEqual({ ok: true, code: 'BUG-7F3A-K9Q2' });
    }
  });

  it('parseCode() meldet eine falsche Länge genau', () => {
    const result = parseCode('BUG-7F3A');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('Gefunden: 4');
  });

  it('parseCode() nennt verbotene Zeichen', () => {
    const result = parseCode('BUG-0OIL-2345');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('0, O, I, L');
  });

  it('Übung des Tages: gleicher Tag = gleicher Code, anderer Tag = anderer Code', () => {
    const morning = dailyCode(new Date('2026-11-20T07:00:00Z'));
    const evening = dailyCode(new Date('2026-11-20T20:00:00Z'));
    const nextDay = dailyCode(new Date('2026-11-21T07:00:00Z'));
    expect(morning).toBe(evening);
    expect(morning).not.toBe(nextDay);
    expect(isValidCode(morning)).toBe(true);
  });

  it('Übung des Tages richtet sich nach Wiener Zeit, nicht nach UTC', () => {
    // 23:30 UTC am 20.11. ist in Wien schon 00:30 am 21.11.
    expect(viennaDate(new Date('2026-11-20T23:30:00Z'))).toBe('2026-11-21');
    expect(dailyCode(new Date('2026-11-20T23:30:00Z'))).toBe(
      dailyCode(new Date('2026-11-21T10:00:00Z')),
    );
    // Sommerzeit: 22:30 UTC am 1.7. ist in Wien 00:30 am 2.7.
    expect(viennaDate(new Date('2026-07-01T22:30:00Z'))).toBe('2026-07-02');
  });
});
