import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseAshby } from '../src/fetchers/ashby.js';
import { parseGreenhouse } from '../src/fetchers/greenhouse.js';
import { parseLever } from '../src/fetchers/lever.js';

const fixture = (name: string): unknown =>
  JSON.parse(readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), 'utf8'));

describe.each([
  ['greenhouse', parseGreenhouse],
  ['lever', parseLever],
  ['ashby', parseAshby],
])('%s parser', (name, parse) => {
  const postings = parse(fixture(name));

  it('normalizes every job in the fixture', () => {
    expect(postings).toHaveLength(3);
    for (const p of postings) {
      expect(p.externalId).not.toBe('');
      expect(p.title).toBe(p.title.trim());
      expect(p.url).toMatch(/^https:\/\//);
      expect(p.sourcePostedAt).toBeInstanceOf(Date);
    }
  });

  it('rejects a response with the wrong shape', () => {
    expect(() => parse({ unexpected: true })).toThrow();
  });

  it('skips a malformed job instead of failing the whole board', () => {
    const raw = fixture(name);
    const jobs = Array.isArray(raw) ? raw : (raw as { jobs: unknown[] }).jobs;
    jobs.push({ nonsense: 1 });
    expect(parse(raw)).toHaveLength(3);
  });
});

describe('ashby parser', () => {
  it('trims titles and joins secondary locations', () => {
    const [first] = parseAshby(fixture('ashby'));
    expect(first?.title).toBe('Security Engineer, Cloud');
    expect(first?.location).toContain('New York, NY (HQ)');
    expect(first?.location).toContain('Remote (Canada)');
  });
});

describe('greenhouse parser', () => {
  it('uses the numeric job id as a string', () => {
    const [first] = parseGreenhouse(fixture('greenhouse'));
    expect(first?.externalId).toBe('7789554');
  });
});
