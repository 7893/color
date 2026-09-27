import { TurnstileSession } from './turnstile.js';

const verification = new TurnstileSession(import.meta.env?.VITE_TURNSTILE_SITE_KEY || '');

export function initTurnstile() {
  return verification.init();
}

export async function saveSnapshot(snapshot, options = {}) {
  const token = await verification.take();
  try {
    const response = await fetch('/api/snapshots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...snapshot, cfTurnstileToken: token }),
      keepalive: Boolean(options.keepalive),
    });
    const result = await response.json();
    if (!response.ok || result.success !== true) {
      throw new Error(result.error || 'Failed to save snapshot');
    }
    return result;
  } finally {
    verification.refresh();
  }
}
