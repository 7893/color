import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from './index.js';

const request = (body = '{}') => new Request('https://example.test/api/snapshots', {
  method: 'POST', headers: { Origin: 'https://example.test' }, body,
});
const protectedEnv = () => ({
  TURNSTILE_SECRET: 'test-only',
  SNAPSHOT_RATE_LIMITER: { limit: async () => ({ success: true }) },
});

test('missing security configuration blocks database writes', async () => {
  assert.equal((await worker.fetch(request(), {})).status, 503);
  assert.equal((await worker.fetch(request(), { TURNSTILE_SECRET: 'test' })).status, 503);
});
test('exhausted and broken rate limiters fail closed', async () => {
  const env = protectedEnv();
  env.SNAPSHOT_RATE_LIMITER.limit = async () => ({ success: false });
  assert.equal((await worker.fetch(request(), env)).status, 429);
  env.SNAPSHOT_RATE_LIMITER.limit = async () => { throw Error('unavailable'); };
  assert.equal((await worker.fetch(request(), env)).status, 503);
});
test('actual body bytes are limited without content-length', async () => {
  assert.equal((await worker.fetch(request(' '.repeat(10241)), protectedEnv())).status, 413);
});
test('malformed input fails before verification or storage', async () => {
  assert.equal((await worker.fetch(request('{'), protectedEnv())).status, 400);
});
