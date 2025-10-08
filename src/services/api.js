export async function saveSnapshot(snapshot, options = {}) {
  const preferBeacon = Boolean(
    options.preferBeacon &&
    typeof navigator !== 'undefined' &&
    typeof navigator.sendBeacon === 'function'
  );

  if (preferBeacon) {
    const blob = new Blob([JSON.stringify(snapshot)], { type: 'application/json' });
    if (navigator.sendBeacon('/api/snapshots', blob)) {
      return { success: true, queued: true };
    }
  }

  try {
    const response = await fetch('/api/snapshots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(snapshot)
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
