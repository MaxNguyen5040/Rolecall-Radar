const TIMEOUT_MS = 10_000;
const MAX_RETRIES = 2;
const MIN_HOST_GAP_MS = 1000;
const BACKOFF_BASE_MS = 1000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Next free request slot per host, so requests to the same host stay at least 1s apart.
const nextSlotByHost = new Map<string, number>();

async function waitForHost(host: string): Promise<void> {
  const slot = Math.max(Date.now(), nextSlotByHost.get(host) ?? 0);
  nextSlotByHost.set(host, slot + MIN_HOST_GAP_MS);
  await sleep(slot - Date.now());
}

class HttpError extends Error {
  constructor(
    readonly status: number,
    host: string,
  ) {
    super(`HTTP ${status} from ${host}`);
  }
}

// 4xx other than 429 will not fix itself, so only retry transient failures.
function isRetryable(err: unknown): boolean {
  if (err instanceof HttpError) return err.status === 429 || err.status >= 500;
  return true;
}

export async function fetchJson(url: string): Promise<unknown> {
  const host = new URL(url).host;

  for (let attempt = 0; ; attempt++) {
    await waitForHost(host);
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { 'User-Agent': 'newgrad-radar/1.0', Accept: 'application/json' },
      });
      if (!res.ok) throw new HttpError(res.status, host);
      return await res.json();
    } catch (err) {
      if (attempt >= MAX_RETRIES || !isRetryable(err)) throw err;
      await sleep(BACKOFF_BASE_MS * 2 ** attempt);
    }
  }
}
