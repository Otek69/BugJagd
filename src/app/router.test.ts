import { describe, expect, it } from 'vitest';
import { hrefFor, parseHash } from './router';

describe('Hash-Router', () => {
  it('liest Pfad und Parameter', () => {
    const route = parseHash('#/uebung?code=BUG-7F3A-K9Q2&stufe=2');
    expect(route.path).toBe('/uebung');
    expect(route.query.get('code')).toBe('BUG-7F3A-K9Q2');
    expect(route.query.get('stufe')).toBe('2');
  });
  it('leerer Hash ist die Startseite', () => {
    expect(parseHash('').path).toBe('/');
    expect(parseHash('#').path).toBe('/');
  });
  it('baut Links', () => {
    expect(hrefFor('/uebung', { code: 'BUG-2222-2222', stufe: '1' })).toBe(
      '#/uebung?code=BUG-2222-2222&stufe=1',
    );
    expect(hrefFor('/fortschritt')).toBe('#/fortschritt');
  });
});
