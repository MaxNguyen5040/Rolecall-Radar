import cron from 'node-cron';
import { createApp } from './api.js';
import { config } from './config.js';
import { log } from './log.js';
import { pollAll } from './poller.js';

let running = false;

async function runPoll(): Promise<void> {
  if (running) {
    log('poll_skipped', { reason: 'previous run still in progress' });
    return;
  }
  running = true;
  try {
    await pollAll();
  } catch (err) {
    log('poll_error', { error: String(err) });
  } finally {
    running = false;
  }
}

cron.schedule(config.POLL_CRON, runPoll);
log('scheduler_started', { cron: config.POLL_CRON });
createApp().listen(config.PORT, () => log('api_listening', { port: config.PORT }));
void runPoll();
