const TURNSTILE_SITEKEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';
let turnstileToken = null;
let turnstileReady = false;
let turnstileWidgetId = null;

export function initTurnstile() {
  if (!TURNSTILE_SITEKEY || turnstileReady || typeof window.turnstile === 'undefined') return;
  turnstileReady = true;
  turnstileWidgetId = window.turnstile.render('#turnstile-widget', {
    sitekey: TURNSTILE_SITEKEY,
    callback: (token) => { turnstileToken = token; },
    'expired-callback': () => { 
      turnstileToken = null; 
      if (turnstileWidgetId !== null) window.turnstile.reset(turnstileWidgetId);
    },
    'error-callback': () => { 
      turnstileToken = null; 
      if (turnstileWidgetId !== null) window.turnstile.reset(turnstileWidgetId);
    },
  });
}

function getTurnstileToken() {
  initTurnstile();
  const token = turnstileToken;
  turnstileToken = null; // consume once
  return token;
}

export async function saveSnapshot(snapshot, options = {}) {
  const token = getTurnstileToken();
  const payload = token ? { ...snapshot, cfTurnstileToken: token } : snapshot;

  const preferBeacon = Boolean(
    options.preferBeacon &&
    typeof navigator !== 'undefined' &&
    typeof navigator.sendBeacon === 'function'
  );

  if (preferBeacon) {
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    if (navigator.sendBeacon('/api/snapshots', blob)) {
      return { success: true, queued: true };
    }
  }

  try {
    const response = await fetch('/api/snapshots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save snapshot');
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to save snapshot:', error);
    throw error;
  }
}
