import { z } from 'zod';
import { type NormalizedPosting, parseJobs, toDate } from './types.js';

const response = z.array(z.unknown());

const job = z.object({
  id: z.string(),
  text: z.string(),
  hostedUrl: z.url(),
  createdAt: z.number().nullish(),
  workplaceType: z.string().nullish(),
  categories: z
    .object({
      location: z.string().nullish(),
      allLocations: z.array(z.string()).nullish(),
    })
    .nullish(),
});

export function leverUrl(company: string): string {
  return `https://api.lever.co/v0/postings/${company}?mode=json`;
}

export function parseLever(raw: unknown): NormalizedPosting[] {
  return parseJobs(response.parse(raw), job, (j) => {
    const locations = j.categories?.allLocations?.length
      ? j.categories.allLocations.join(' | ')
      : (j.categories?.location ?? null);
    return {
      externalId: j.id,
      title: j.text.trim(),
      location: locations,
      url: j.hostedUrl,
      isRemote: j.workplaceType ? j.workplaceType === 'remote' : null,
      sourcePostedAt: toDate(j.createdAt),
    };
  });
}
