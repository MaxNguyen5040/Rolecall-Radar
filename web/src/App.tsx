import { useEffect, useState } from 'react';
import { fetchPostings, type Filters, type Posting } from './api';

type Range = 'all' | '1d' | '7d' | '30d' | 'visit';

const DAY_MS = 24 * 60 * 60 * 1000;
const RANGE_DAYS: Record<'1d' | '7d' | '30d', number> = { '1d': 1, '7d': 7, '30d': 30 };

function useDebounced<T>(value: T, ms = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

function sinceFor(range: Range, lastVisit: string | null): string | null {
  if (range === 'visit') return lastVisit;
  if (range === 'all') return null;
  return new Date(Date.now() - RANGE_DAYS[range] * DAY_MS).toISOString();
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export function App() {
  // Read the previous visit once, then stamp this one.
  const [lastVisit] = useState(() => localStorage.getItem('lastVisit'));
  useEffect(() => {
    localStorage.setItem('lastVisit', new Date().toISOString());
  }, []);

  const [q, setQ] = useState('');
  const [location, setLocation] = useState('');
  const [range, setRange] = useState<Range>('all');
  const [matchedOnly, setMatchedOnly] = useState(true);
  const [postings, setPostings] = useState<Posting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const debouncedQ = useDebounced(q);
  const debouncedLocation = useDebounced(location);

  useEffect(() => {
    const controller = new AbortController();
    const filters: Filters = {
      q: debouncedQ,
      location: debouncedLocation,
      since: sinceFor(range, lastVisit),
      matchedOnly,
    };
    setLoading(true);
    fetchPostings(filters, controller.signal)
      .then((rows) => {
        setPostings(rows);
        setError(null);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Something went wrong');
        setLoading(false);
      });
    return () => controller.abort();
  }, [debouncedQ, debouncedLocation, range, matchedOnly, lastVisit]);

  return (
    <main>
      <header>
        <h1>Rolecall Radar</h1>
        <p>Entry-level and new grad postings, straight from company job boards.</p>
      </header>

      <section className="filters">
        <input
          type="search"
          placeholder="Role (e.g. software engineer)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <input
          type="search"
          placeholder="Location (e.g. Toronto)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <select value={range} onChange={(e) => setRange(e.target.value as Range)}>
          <option value="all">Any time</option>
          <option value="1d">Last 24 hours</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="visit" disabled={!lastVisit}>
            New since last visit
          </option>
        </select>
        <label>
          <input
            type="checkbox"
            checked={matchedOnly}
            onChange={(e) => setMatchedOnly(e.target.checked)}
          />
          Entry-level matches only
        </label>
      </section>

      {range === 'visit' && lastVisit && (
        <p className="note">Showing postings first seen after {formatDate(lastVisit)}.</p>
      )}
      {error && <p className="error">Could not load postings: {error}</p>}

      <table className={loading ? 'loading' : undefined}>
        <thead>
          <tr>
            <th>Title</th>
            <th>Company</th>
            <th>Location</th>
            <th>First seen</th>
          </tr>
        </thead>
        <tbody>
          {postings.map((p) => (
            <tr key={p.id}>
              <td>
                <a href={p.url} target="_blank" rel="noreferrer">
                  {p.title}
                </a>
                {lastVisit && p.firstSeenAt > lastVisit && <span className="badge">New</span>}
              </td>
              <td>{p.company.name}</td>
              <td>{p.location ?? 'Not listed'}</td>
              <td>{formatDate(p.firstSeenAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!loading && !error && postings.length === 0 && <p className="note">No postings found.</p>}
      <footer>{postings.length} shown (max 200)</footer>
    </main>
  );
}
