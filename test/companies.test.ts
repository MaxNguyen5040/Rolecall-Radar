import { describe, expect, it } from 'vitest';
import { companies } from '../src/companies.js';

describe('company list', () => {
  it('has no duplicate boards or names', () => {
    const boards = companies.map((c) => `${c.ats}:${c.boardToken}`);
    expect(new Set(boards).size).toBe(boards.length);
    expect(new Set(companies.map((c) => c.name)).size).toBe(companies.length);
  });

  it('covers all three ATS types', () => {
    expect(new Set(companies.map((c) => c.ats))).toEqual(new Set(['GREENHOUSE', 'LEVER', 'ASHBY']));
  });
});
