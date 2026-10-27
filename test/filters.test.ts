import { describe, expect, it } from 'vitest';
import { matchPosting, matchesLocation, matchesTitle } from '../src/filters.js';

describe('title filter', () => {
  it.each([
    ['Software Engineer I', true],
    ['Software Engineer II', false],
    ['AI Engineer', false],
    ['UI Developer', false],
    ['iOS Engineer, New Grad', true],
    ['Senior Software Engineer, Mobile', false],
    ['Software Engineering Intern', false],
    ['Developer 1', true],
    ['Software Engineer III', false],
    ['Junior Backend Developer', true],
    ['Early Career Software Engineer', true],
    ['Software Engineer, New Grad 2027', true],
    ['Staff Engineer, New Grad Program', false],
    ['Mobile Engineer', false],
    ['International Sales Manager', false],
  ])('%s -> %s', (title, expected) => {
    expect(matchesTitle(title)).toBe(expected);
  });
});

describe('location filter', () => {
  it.each([
    ['Toronto, ON', true],
    ['Remote (Canada)', true],
    ['Remote', true],
    ['New York, NY (HQ) | Remote (US)', true],
    ['Austin, Texas, United States', true],
    ['San Francisco', true],
    ['Tokyo, Japan', false],
    ['London, UK', false],
    ['Remote, in Europe', false],
  ])('%s -> %s', (location, expected) => {
    expect(matchesLocation(location, null)).toBe(expected);
  });

  it('accepts a missing location only for remote roles', () => {
    expect(matchesLocation(null, true)).toBe(true);
    expect(matchesLocation(null, null)).toBe(false);
  });
});

describe('matchPosting', () => {
  it('requires both title and location to match', () => {
    expect(
      matchPosting({ title: 'Software Engineer I', location: 'Tokyo, Japan', isRemote: null })
        .matched,
    ).toBe(false);
    expect(
      matchPosting({ title: 'Software Engineer II', location: 'Toronto, ON', isRemote: null })
        .matched,
    ).toBe(false);
  });

  it('flags Canadian matches as priority', () => {
    const toronto = matchPosting({
      title: 'New Grad Engineer',
      location: 'Toronto, ON',
      isRemote: null,
    });
    const us = matchPosting({ title: 'New Grad Engineer', location: 'Austin, TX', isRemote: null });
    expect(toronto).toEqual({ matched: true, priority: true });
    expect(us).toEqual({ matched: true, priority: false });
  });
});
