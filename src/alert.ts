import { config } from './config.js';
import { log } from './log.js';

export interface AlertPosting {
  company: string;
  title: string;
  location: string | null;
  url: string;
  priority: boolean;
}

// Returns false when no webhook is configured or the send fails, so the caller leaves alertedAt unset.
export async function sendAlert(posting: AlertPosting): Promise<boolean> {
  const webhook = config.DISCORD_WEBHOOK_URL;
  if (!webhook) {
    log('alert_skipped', { reason: 'DISCORD_WEBHOOK_URL not set' });
    return false;
  }

  const tag = posting.priority ? '[Canada] ' : '';
  const content = `${tag}**${posting.title}** at ${posting.company}\n${posting.location ?? 'Location not listed'}\n${posting.url}`;

  try {
    const res = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return true;
  } catch (err) {
    log('alert_failed', { company: posting.company, error: String(err) });
    return false;
  }
}
