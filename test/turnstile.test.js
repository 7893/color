import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TurnstileSession } from '../src/services/turnstile.js';

test('each save receives a new token and consumption clears the cached token', async () => {
  let options, resets = 0;
  globalThis.window = { turnstile: {
    render: (_target, opts) => { options = opts; return 'widget'; },
    reset: () => { resets++; queueMicrotask(() => options.callback('token-' + resets)); },
  } };
  const session = new TurnstileSession('test-key');
  session.init();
  options.callback('initial');
  assert.equal(await session.take(), 'initial');
  assert.equal(session.token, null);
  session.refresh();
  await Promise.resolve();
  assert.equal(await session.take(), 'token-1');
  assert.equal(await session.take(), 'token-2');
  delete globalThis.window;
});

test('verification failure rejects the waiting save', async () => {
  let options;
  globalThis.window = { turnstile: {
    render: (_target, opts) => { options = opts; return 'widget'; },
    reset: () => queueMicrotask(() => options['error-callback']()),
  } };
  await assert.rejects(new TurnstileSession('test-key').take(), /verification failed/);
  delete globalThis.window;
});

test('missing configuration prevents an unverified request', async () => {
  globalThis.window = {};
  await assert.rejects(new TurnstileSession('').take(), /not available/);
  delete globalThis.window;
});
