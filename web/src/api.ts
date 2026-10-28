export type Posting = {
  id: number;
  title: string;
  location: string | null;
  url: string;
  isRemote: boolean | null;
  sourcePostedAt: string | null;
  firstSeenAt: string;
  matched: boolean;
  company: { name: string; ats: 'GREENHOUSE' | 'LEVER' | 'ASHBY' };
};

export type Filters = {
  q: string;
  location: string;
  since: string | null;
  matchedOnly: boolean;
};

export async function fetchPostings(filters: Filters, signal: AbortSignal): Promise<Posting[]> {
  const params = new URLSearchParams({ limit: '200' });
  if (filters.q) params.set('q', filters.q);
  if (filters.location) params.set('location', filters.location);
  if (filters.since) params.set('since', filters.since);
  if (filters.matchedOnly) params.set('matched', 'true');

  const res = await fetch(`/postings?${params}`, { signal });
  if (!res.ok) throw new Error(`API returned ${res.status}`);
  return res.json();
}
