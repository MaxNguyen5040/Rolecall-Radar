import { z } from 'zod';
import { type NormalizedPosting, parseJobs, toDate } from './types.js';

const response = z.object({ jobs: z.array(z.unknown()) });

const job = z.object({
  id: z.number(),
  title: z.string(),
  absolute_url: z.url(),
  location: z.object({ name: z.string() }).nullish(),
  first_published: z.string().nullish(),
  updated_at: z.string().nullish(),
});

export function greenhouseUrl(token: string): string {
  return `https://boards-api.greenhouse.io/v1/boards/${token}/jobs?content=true`;
}

export function parseGreenhouse(raw: unknown): NormalizedPosting[] {
  return parseJobs(response.parse(raw).jobs, job, (j) => ({
    externalId: String(j.id),
    title: j.title.trim(),
    location: j.location?.name ?? null,
    url: j.absolute_url,
    isRemote: null,
    sourcePostedAt: toDate(j.first_published ?? j.updated_at),
  }));
}
