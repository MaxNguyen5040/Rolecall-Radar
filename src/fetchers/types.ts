import { z } from 'zod';
import { log } from '../log.js';

export interface NormalizedPosting {
  externalId: string;
  title: string;
  location: string | null;
  url: string;
  isRemote: boolean | null;
  sourcePostedAt: Date | null;
}

export function toDate(value: string | number | null | undefined): Date | null {
  if (value === null || value === undefined) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

// A single malformed job is skipped so it cannot block the rest of the board.
export function parseJobs<S extends z.ZodType>(
  items: unknown[],
  schema: S,
  normalize: (job: z.infer<S>) => NormalizedPosting,
): NormalizedPosting[] {
  const postings: NormalizedPosting[] = [];
  let skipped = 0;
  for (const item of items) {
    const result = schema.safeParse(item);
    if (result.success) postings.push(normalize(result.data));
    else skipped++;
  }
  if (skipped > 0) log('parse_skipped', { skipped });
  return postings;
}
