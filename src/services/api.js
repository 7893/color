export async function saveSnapshot(snapshot) {
  try {
    await fetch('/api/snapshots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(snapshot)
    });
  } catch (error) {
    console.error('Failed to save snapshot:', error);
  }
}
