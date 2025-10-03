export async function saveSnapshot(snapshot) {
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
