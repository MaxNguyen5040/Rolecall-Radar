import type { Ats } from '@prisma/client';
import { ashbyUrl, parseAshby } from './ashby.js';
import { greenhouseUrl, parseGreenhouse } from './greenhouse.js';
import { leverUrl, parseLever } from './lever.js';
import { fetchJson } from './http.js';
import type { NormalizedPosting } from './types.js';

const sources: Record<
  Ats,
  { url: (token: string) => string; parse: (raw: unknown) => NormalizedPosting[] }
> = {
  GREENHOUSE: { url: greenhouseUrl, parse: parseGreenhouse },
  LEVER: { url: leverUrl, parse: parseLever },
  ASHBY: { url: ashbyUrl, parse: parseAshby },
};

export async function fetchPostings(ats: Ats, token: string): Promise<NormalizedPosting[]> {
  const source = sources[ats];
  return source.parse(await fetchJson(source.url(token)));
}
