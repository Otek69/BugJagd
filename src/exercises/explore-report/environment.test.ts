import { describe, expect, it } from 'vitest';
import { browserName } from './environment';

describe('browserName', () => {
  it.each([
    [
      'Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36',
      'Chrome 131',
    ],
    [
      'Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36 Edg/131.0',
      'Edge 131',
    ],
    ['Mozilla/5.0 (X11; Linux x86_64; rv:133.0) Gecko/20100101 Firefox/133.0', 'Firefox 133'],
    ['Mozilla/5.0 (Macintosh) AppleWebKit/605.1.15 Version/18.1 Safari/605.1.15', 'Safari 18'],
    ['curl/8.0', 'Unbekannter Browser'],
  ])('%s → %s', (agent, expected) => {
    expect(browserName(agent)).toBe(expected);
  });
});
