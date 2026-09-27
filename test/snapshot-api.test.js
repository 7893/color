import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
let next = 0, resets = 0;
mock.module('../src/services/turnstile.js', { exports: { TurnstileSession: class {
  async take() { return 'token-' + ++next; }
  refresh() { resets++; }
} } });
const { saveSnapshot } = await import('../src/services/api.js');

test('transport confirms server success and refreshes tokens after rejection too', async () => {
  const calls = [];
  const stub = mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push({ url, ...options });
    return new Response(JSON.stringify({ success: true, id: 'test' }));
  });
  await saveSnapshot({ colors: '[]' }, { keepalive: true });
  assert.equal(calls[0].keepalive, true);
  assert.equal(JSON.parse(calls[0].body).cfTurnstileToken, 'token-1');
  stub.mock.mockImplementation(async () => new Response(JSON.stringify({ error: 'denied' }), { status: 403 }));
  await assert.rejects(saveSnapshot({}), /denied/);
  assert.equal(resets, 2);
  stub.mock.restore();
});
