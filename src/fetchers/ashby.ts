import { z } from 'zod';
import { type NormalizedPosting, parseJobs, toDate } from './types.js';

const response = z.object({ jobs: z.array(z.unknown()) });

const job = z.object({
  id: z.string(),
  title: z.string(),
  jobUrl: z.url(),
  location: z.string().nullish(),
  secondaryLocations: z.array(z.object({ location: z.string() })).nullish(),
  isRemote: z.boolean().nullish(),
  isListed: z.boolean().nullish(),
  publishedAt: z.string().nullish(),
});

export function ashbyUrl(org: string): string {
  return `https://api.ashbyhq.com/posting-api/job-board/${org}?includeCompensation=true`;
}

export function parseAshby(raw: unknown): NormalizedPosting[] {
  const listed = response
    .parse(raw)
    .jobs.filter((j) => (j as { isListed?: boolean }).isListed !== false);
  return parseJobs(listed, job, (j) => {
    const locations = [j.location, ...(j.secondaryLocations ?? []).map((s) => s.location)].filter(
      (l): l is string => Boolean(l),
    );
    return {
      externalId: j.id,
      title: j.title.trim(),
      location: locations.length ? locations.join(' | ') : null,
      url: j.jobUrl,
      isRemote: j.isRemote ?? null,
      sourcePostedAt: toDate(j.publishedAt),
    };
  });
}
